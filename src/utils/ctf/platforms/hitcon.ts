import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import {
  CTFPlatformClient,
  PlatformChallenge,
  PlatformTeam,
  PlatformTeamSelf,
} from '@ports/ctfplatform';
import { createLogger } from '@discordutils/logger';

const log = createLogger('HitconClient');

/**
 * HITCON CTF 자체 플랫폼 (ctf2025.hitcon.org 기준).
 * 대시보드 JS가 호출하는 JSON 엔드포인트를 그대로 쓴다. 인증은 로그인 세션 쿠키.
 * Cloudflare 챌린지가 걸려 있으면 cf_clearance 쿠키와 그걸 발급받은 브라우저의
 * User-Agent(HITCON_USER_AGENT)가 함께 필요하다.
 */

const HitconHintSchema = z.object({
  content: z.string(),
  public_time: z.number().optional(),
});

const HitconChallengeSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  hint: z.array(HitconHintSchema).nullable().optional(),
  is_opened: z.boolean().optional(),
  solved: z.boolean().optional(),
  solved_times: z.number().optional(),
});

const HitconChallengesResponseSchema = z.array(HitconChallengeSchema);

const HitconTeamStatSchema = z.object({
  id: z.number(),
  name: z.string(),
  score: z.number().nullable(),
  country_name: z.string().optional(),
  last_submit_time: z.number().nullable().optional(),
  solved_challenge: z.array(z.number()).optional(),
});

const HitconScoreboardResponseSchema = z.object({
  teamstat: z.array(HitconTeamStatSchema),
  challenges: z.array(z.object({
    id: z.number(),
    name: z.string(),
    score: z.number().optional(),
    solved_times: z.number().optional(),
    first_solved_team: z.number().nullable().optional(),
  })).optional(),
  last_update: z.string().optional(),
});

const MARKDOWN_LINK_RE = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
const TEAM_ID_RE = /var\s+team_id\s*=\s*(-?\d+)/;

const extractFiles = (description: string): string[] => (
  [...description.matchAll(MARKDOWN_LINK_RE)].map(([, url]) => url)
);

export class HitconClient implements CTFPlatformClient {
  private readonly http: AxiosInstance;

  readonly url: string;

  constructor(baseURL: string, cookies: string) {
    this.url = baseURL.replace(/\/+$/, '');

    const userAgent = process.env.HITCON_USER_AGENT;
    this.http = axios.create({
      baseURL: this.url,
      headers: {
        Cookie: cookies,
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 15_000,
      maxRedirects: 0,
    });
  }

  /**
   * 세션이 만료되면 로그인 페이지로 리다이렉트되거나 JSON이 아닌 응답이 온다.
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const res = await this.http.get('/dashboard/challenge_data', {
        validateStatus: (status) => status < 500,
      });
      return res.status === 200 && Array.isArray(res.data);
    } catch {
      return false;
    }
  }

  async listChallenges(): Promise<PlatformChallenge[]> {
    try {
      const res = await this.http.get('/dashboard/challenge_data');
      const parsed = HitconChallengesResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        log.error('Failed to parse challenges response: %s', parsed.error.message);
        return [];
      }

      return parsed.data
        .filter((raw) => raw.is_opened !== false)
        .map((raw) => {
          const description = raw.description ?? '';
          return {
            id: String(raw.id),
            name: raw.name,
            category: raw.category ?? 'misc',
            description,
            points: raw.score ?? 0,
            solves: raw.solved_times ?? 0,
            files: extractFiles(description),
            authors: raw.author ? [raw.author] : [],
          };
        });
    } catch (error) {
      log.error('Failed to fetch challenges', error);
      return [];
    }
  }

  async getScoreboard(): Promise<PlatformTeam[]> {
    try {
      const res = await this.http.get('/dashboard/scoreboard_data');
      const parsed = HitconScoreboardResponseSchema.safeParse(res.data);
      if (!parsed.success) {
        log.error('Failed to parse scoreboard response: %s', parsed.error.message);
        return [];
      }

      return parsed.data.teamstat.map((team, idx) => ({
        id: team.id,
        name: team.name,
        rank: idx + 1,
        score: team.score,
        lastSolve: team.last_submit_time
          ? new Date(team.last_submit_time * 1000).toISOString()
          : null,
      }));
    } catch (error) {
      log.error('Failed to fetch scoreboard', error);
      return [];
    }
  }

  /**
   * 자기 팀 API가 따로 없다. 대시보드 HTML에 박힌 `var team_id = N`을 읽고
   * 스코어보드에서 이름/점수를 찾는다.
   */
  async getSelf(): Promise<PlatformTeamSelf | null> {
    try {
      const res = await this.http.get<string>('/dashboard/', { responseType: 'text' });
      const match = TEAM_ID_RE.exec(String(res.data));
      if (!match) {
        log.error('team_id not found in dashboard page');
        return null;
      }

      const teamId = parseInt(match[1], 10);
      if (teamId < 0) {
        return null;
      }

      const teams = await this.getScoreboard();
      const self = teams.find((team) => team.id === teamId);
      return {
        id: teamId,
        name: self?.name ?? null,
        score: self?.score ?? null,
      };
    } catch (error) {
      log.error('Failed to fetch team self', error);
      return null;
    }
  }
}
