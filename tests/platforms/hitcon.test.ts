import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { HitconClient } from '@discordutils/ctf/platforms/hitcon';

vi.mock('axios', () => ({
  default: { create: vi.fn() },
}));

const routes = new Map<string, unknown>();
const httpGet = vi.fn(async (path: string) => ({ status: 200, data: routes.get(path) }));

beforeEach(() => {
  routes.clear();
  httpGet.mockClear();
  vi.mocked(axios.create).mockReturnValue({ get: httpGet } as never);
});

// ctf2025.hitcon.org /dashboard/scoreboard_data 실제 응답 형태
const SCOREBOARD = {
  teamstat: [
    {
      id: 507,
      name: 'thehackerscrew',
      score: 1242,
      flag_css: '',
      country_name: 'Antarctica',
      last_submit_time: 1755886559.0,
      solved_challenge: [1, 6, 12, 13],
    },
    {
      id: 111,
      name: 'The Amazing Ditigal Orange',
      score: 792,
      flag_css: '',
      country_name: 'South Korea',
      last_submit_time: 1755884446.0,
      solved_challenge: [1, 6, 13],
    },
  ],
  challenges: [{ id: 1, name: 'web-1', score: 300, solved_times: 40, first_solved_team: 507 }],
  last_update: '2025-08-22 18:00:00',
};

describe('HitconClient', () => {
  it('challenge_data를 플랫폼 챌린지로 정규화하고 잠긴 문제는 뺀다', async () => {
    routes.set('/dashboard/challenge_data', [
      {
        id: 3,
        name: 'pwn me',
        category: 'pwn',
        score: 250,
        description: 'nc host 1337\n[dist.tar.gz](https://storage.example/dist.tar.gz)',
        author: 'alice',
        hint: [],
        is_opened: true,
        solved: false,
        solved_times: 4,
      },
      {
        id: 4, name: 'locked', category: 'web', score: 500, description: '', is_opened: false,
      },
    ]);

    const client = new HitconClient('https://ctf.example/', 'session=abc');
    const challenges = await client.listChallenges();

    expect(challenges).toEqual([{
      id: '3',
      name: 'pwn me',
      category: 'pwn',
      description: 'nc host 1337\n[dist.tar.gz](https://storage.example/dist.tar.gz)',
      points: 250,
      solves: 4,
      files: ['https://storage.example/dist.tar.gz'],
      authors: ['alice'],
    }]);
  });

  it('scoreboard_data 순서대로 순위를 매긴다', async () => {
    routes.set('/dashboard/scoreboard_data', SCOREBOARD);

    const teams = await new HitconClient('https://ctf.example', 'session=abc').getScoreboard();

    expect(teams.map(({ name, rank, score }) => ({ name, rank, score }))).toEqual([
      { name: 'thehackerscrew', rank: 1, score: 1242 },
      { name: 'The Amazing Ditigal Orange', rank: 2, score: 792 },
    ]);
  });

  it('대시보드 HTML의 team_id로 자기 팀을 찾는다', async () => {
    routes.set('/dashboard/', '<script>\n var team_id = 111;\n</script>');
    routes.set('/dashboard/scoreboard_data', SCOREBOARD);

    const self = await new HitconClient('https://ctf.example', 'session=abc').getSelf();

    expect(self).toEqual({ id: 111, name: 'The Amazing Ditigal Orange', score: 792 });
  });

  it('로그인 안 된 대시보드(team_id = -1)면 null', async () => {
    routes.set('/dashboard/', 'var team_id = -1;');

    const self = await new HitconClient('https://ctf.example', 'session=abc').getSelf();

    expect(self).toBeNull();
  });

  it('JSON 배열이 아닌 응답이면 세션 만료로 본다', async () => {
    routes.set('/dashboard/challenge_data', '<html>login</html>');

    const valid = await new HitconClient('https://ctf.example', 'session=abc').isSessionValid();

    expect(valid).toBe(false);
  });
});
