import { Result, Ok, Err, isErr } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTF } from '@core/models/CTF';
import { Challenge } from '@core/models/Challenge';
import { ChallengeService } from './ChallengeService';
import { CTFService } from './CTFService';
import { CTFPlatformClient, PlatformChallenge } from '@ports/ctfplatform';
import { HitconClient } from '@discordutils/ctf/platforms/hitcon';
import { createChallengeChannel } from '@discordutils/ctf/discordutil';
import { VertinClient } from '@discordutils/vertinclient';
import {
  setScoreboardSnapshot,
  computeScoreDelta,
  formatScoreDelta,
  Team,
} from '@discordutils/ctf/scoreboardcache';
import { fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { isOk } from '@discordtypes/result';
import { createLogger } from '@discordutils/logger';
import { EmbedBuilder } from 'discord.js';

const log = createLogger('PullService');

/**
 * 챌린지 이름을 정규화하여 비교용 키를 만든다.
 * lowercase + 연속 공백 → 단일 공백 + trim
 */
const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, ' ').trim();

/** 플랫폼 수준에서 항상 무시할 챌린지 이름 (정규화 적용) */
const GLOBAL_PULL_IGNORE = new Set<string>([]);

export interface PullChallengeResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

export interface PullScoreboardResult {
  teamCount: number;
  myTeam: Team | null;
  deltaMessage: string | null;
}

export class PullService {
  private readonly challengeService: ChallengeService;
  private readonly ctfService: CTFService;
  private readonly clientCache: Map<string, HitconClient> = new Map();

  constructor(challengeService: ChallengeService, ctfService: CTFService) {
    this.challengeService = challengeService;
    this.ctfService = ctfService;
  }

  async pullChallenges(
    client: VertinClient,
    ctf: CTF,
    platformClient: CTFPlatformClient,
  ): Promise<Result<PullChallengeResult, ServiceError>> {
    const remoteChallenges = await platformClient.listChallenges();

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    // pull_ignore 목록을 정규화된 Set으로 구축
    const ignoreSet = new Set(ctf.pull_ignore.map(normalizeName));

    // 기존 챌린지를 platform_id / 정규화된 이름으로 인덱싱
    const byPlatformId = new Map<string, Challenge>();
    const byNormalizedName = new Map<string, Challenge>();
    for (const ch of ctf.challenges.values()) {
      if (ch.platform_id) {
        byPlatformId.set(ch.platform_id, ch);
      }
      byNormalizedName.set(normalizeName(ch.name), ch);
    }

    log.info(
      'Pull: %d remote, %d local (byId=%d, byName=%d)',
      remoteChallenges.length, ctf.challenges.size,
      byPlatformId.size, byNormalizedName.size,
    );

    for (const remote of remoteChallenges) {
      const normalizedRemoteName = normalizeName(remote.name);

      // 0) 글로벌 또는 CTF별 무시 목록에 있으면 스킵
      if (GLOBAL_PULL_IGNORE.has(normalizedRemoteName) || ignoreSet.has(normalizedRemoteName)) {
        skipped.push(remote.name);
        continue;
      }

      // 1) platform_id로 매칭
      const existing = byPlatformId.get(remote.id);
      if (existing) {
        skipped.push(remote.name);
        continue;
      }

      // 2) 정규화된 이름으로 매칭 (대소문자·공백 무시)
      const byName = byNormalizedName.get(normalizedRemoteName);
      if (byName) {
        // 이름은 같은데 platform_id가 없으면 연결만 해줌
        if (!byName.platform_id) {
          await this.challengeService.updateChallenge(ctf, byName._id, {
            platform_id: remote.id,
            raw_category: remote.category,
          });
          byPlatformId.set(remote.id, byName);
        }
        skipped.push(remote.name);
        continue;
      }

      try {
        const channelResult = await createChallengeChannel(
          client,
          ctf,
          client.guild,
          remote.name,
          remote.category,
        );

        if (isErr(channelResult)) {
          errors.push(`${remote.name}: ${channelResult.error.message}`);
          continue;
        }

        const { challenge, threadChannel } = channelResult.value;

        await this.challengeService.updateChallenge(ctf, challenge._id, {
          platform_id: remote.id,
          raw_category: remote.category,
        });

        // 인덱스 갱신: 이후 반복에서 중복 생성 방지
        byPlatformId.set(remote.id, challenge);
        byNormalizedName.set(normalizedRemoteName, challenge);

        // 스레드에 문제 정보 게시
        await postChallengeInfo(threadChannel, remote).catch((err) => {
          log.error('Failed to post challenge info to thread', err);
        });

        // #general에 새 챌린지 알림
        const generalResult = await fetchTextChannelFromClient(
          client, ctf.guild_channels.general, 'general',
        );
        if (isOk(generalResult)) {
          const embed = buildNewChallengeEmbed(remote);
          await generalResult.value.send({
            content: 'New challenge dropped.',
            embeds: [embed],
          }).catch((err) => {
            log.error('Failed to send new challenge notification', err);
          });
        }

        created.push(remote.name);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${remote.name}: ${msg}`);
        log.error('Failed to create challenge "%s"', remote.name, error);
      }
    }

    return Ok({ created, skipped, errors });
  }

  async pullScoreboard(
    client: VertinClient,
    ctf: CTF,
    platformClient: CTFPlatformClient,
  ): Promise<Result<PullScoreboardResult, ServiceError>> {
    const remoteTeams = await platformClient.getScoreboard();
    const selfInfo = await platformClient.getSelf();

    const teams: Team[] = remoteTeams.map((t) => ({
      name: t.name,
      score: t.score,
    }));

    let myTeam: Team | null = null;
    if (selfInfo?.name) {
      const found = teams.find((t) => t.name === selfInfo.name);
      myTeam = found ?? { name: selfInfo.name, score: selfInfo.score ?? 0 };
    }

    const delta = computeScoreDelta(ctf.name, teams, myTeam);
    setScoreboardSnapshot(ctf.name, teams, myTeam);

    let deltaMessage: string | null = null;
    if (delta && delta.scoreDiff !== null && delta.scoreDiff !== 0) {
      deltaMessage = formatScoreDelta(delta);
    }

    return Ok({
      teamCount: teams.length,
      myTeam,
      deltaMessage,
    });
  }

  /**
   * CTF 크레덴셜에서 HitconClient를 생성한다.
   * teamToken에는 브라우저에서 복사한 세션 쿠키 문자열을 넣는다
   * (예: "session=...; cf_clearance=..."). 만료되면 null.
   */
  async createPlatformClient(ctf: CTF): Promise<HitconClient | null> {
    const { url, teamToken } = ctf.credentials;

    if (!url || !teamToken) {
      return null;
    }

    const cached = this.clientCache.get(ctf.name);
    if (cached && await cached.isSessionValid()) {
      return cached;
    }

    this.clientCache.delete(ctf.name);

    const client = new HitconClient(url, teamToken);
    if (!await client.isSessionValid()) {
      log.warn('Session cookie expired for "%s"', ctf.name);
      return null;
    }

    this.clientCache.set(ctf.name, client);
    return client;
  }
}

/**
 * #general에 보낼 새 챌린지 알림 임베드
 */
const buildNewChallengeEmbed = (chall: PlatformChallenge): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setTitle(`${chall.category.toUpperCase()} | ${chall.name}`)
    .setColor('#d8cfae')
    .setTimestamp();

  const descLines: string[] = [];

  if (chall.description) {
    const trimmed = chall.description.length > 300
      ? `${chall.description.slice(0, 297)}...`
      : chall.description;
    descLines.push(trimmed);
  }

  descLines.push(`\n**${chall.points}pts** · ${chall.solves} solves`);

  if (chall.authors.length > 0) {
    descLines.push(`by ${chall.authors.join(', ')}`);
  }

  if (chall.files.length > 0) {
    const fileLinks = chall.files.map((url) => {
      const name = url.split('/').pop()?.split('?')[0] ?? 'download';
      return `[${name}](${url})`;
    });
    descLines.push(`\n📎 ${fileLinks.join(' · ')}`);
  }

  embed.setDescription(descLines.join('\n'));
  return embed;
};

/**
 * 챌린지 스레드에 문제 정보 게시
 */
const postChallengeInfo = async (
  thread: { send: (opts: { content?: string; embeds?: EmbedBuilder[] }) => Promise<unknown> },
  chall: PlatformChallenge,
): Promise<void> => {
  const lines: string[] = [];

  if (chall.description) {
    lines.push(chall.description);
  }

  if (chall.authors.length > 0) {
    lines.push(`\n**Authors:** ${chall.authors.join(', ')}`);
  }

  lines.push(`**Points:** ${chall.points}pts · **Solves:** ${chall.solves}`);

  if (chall.files.length > 0) {
    lines.push('\n**Files:**');
    for (const url of chall.files) {
      const name = url.split('/').pop()?.split('?')[0] ?? 'download';
      lines.push(`📎 [${name}](${url})`);
    }
  }

  await thread.send({ content: lines.join('\n') });
};
