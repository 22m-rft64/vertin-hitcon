import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isOk } from '../../src/utils/types/result';
import { CTFService } from '@services/CTFService';
import { ChallengeService } from '@services/ChallengeService';
import { PullService } from '@services/PullService';
import { CTF } from '@core/models/CTF';
import { Challenge } from '@core/models/Challenge';
import { InMemoryCTFRepository } from '../helpers/inMemoryRepos';
import { Ok } from '../../src/utils/types/result';
import { CTFPlatformClient, PlatformChallenge } from '@ports/ctfplatform';

// --- Mock Discord 의존성 ---

vi.mock('@discordutils/ctf/discordutil', () => ({
  createChallengeChannel: vi.fn(),
  normalizeCategory: vi.fn((c: string) => c.toLowerCase()),
}));

vi.mock('@discordutils/ctf/safefetch', () => ({
  fetchTextChannelFromClient: vi.fn(() => Ok({ send: vi.fn(async () => {}) })),
}));

import { createChallengeChannel } from '@discordutils/ctf/discordutil';

const mockCreateChannel = createChallengeChannel as ReturnType<typeof vi.fn>;

// --- 헬퍼 ---

let idCounter = 0;

const makeRemote = (
  overrides: Partial<PlatformChallenge> = {},
): PlatformChallenge => {
  idCounter += 1;
  return {
    id: `remote-${idCounter}`,
    name: `Challenge ${idCounter}`,
    category: 'web',
    description: '',
    points: 100,
    solves: 0,
    files: [],
    authors: [],
    ...overrides,
  };
};

const makePlatformClient = (challenges: PlatformChallenge[]): CTFPlatformClient => ({
  url: 'https://ctf.example',
  isSessionValid: vi.fn(async () => true),
  listChallenges: vi.fn(async () => challenges),
  getScoreboard: vi.fn(async () => []),
  getSelf: vi.fn(async () => null),
});

const makeClient = (
  ctfService: CTFService,
  challengeService: ChallengeService,
) => ({
  ctfService,
  challengeService,
  guild: { id: 'guild-1' },
}) as any;

// --- 셋업 ---

let repo: InMemoryCTFRepository;
let ctfService: CTFService;
let challengeService: ChallengeService;
let pullService: PullService;
let ctf: CTF;

beforeEach(async () => {
  vi.clearAllMocks();
  idCounter = 0;

  repo = new InMemoryCTFRepository();
  ctfService = new CTFService(repo);
  challengeService = new ChallengeService(repo, ctfService);
  pullService = new PullService(challengeService, ctfService);

  const result = await ctfService.createCTF({
    name: 'TestCTF',
    guild_category: 'cat-1',
    start_at: new Date(2025, 0, 1),
  });
  if (isOk(result)) ctf = result.value;
});

// --- 테스트 ---

describe('PullService.pullChallenges 중복 방지', () => {
  it('createchallenge로 이미 만든 챌린지는 skip (정확히 같은 이름)', async () => {
    await challengeService.createChallenge(ctf, { name: 'SQL Injection', category: 'web' });

    const remote = makeRemote({ name: 'SQL Injection' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.created).toHaveLength(0);
      expect(result.value.skipped).toContain('SQL Injection');
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('대소문자 달라도 같은 챌린지로 인식 (case-insensitive)', async () => {
    await challengeService.createChallenge(ctf, { name: 'XSS Challenge', category: 'web' });

    const remote = makeRemote({ name: 'xss challenge' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.created).toHaveLength(0);
      expect(result.value.skipped).toContain('xss challenge');
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('공백 차이도 무시 (whitespace normalization)', async () => {
    await challengeService.createChallenge(ctf, { name: 'Buffer  Overflow', category: 'pwn' });

    const remote = makeRemote({ name: 'Buffer Overflow' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.created).toHaveLength(0);
      expect(result.value.skipped).toContain('Buffer Overflow');
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('대소문자 + 공백 모두 다른 경우에도 매칭', async () => {
    await challengeService.createChallenge(ctf, { name: '  HEAP  Exploit  ', category: 'pwn' });

    const remote = makeRemote({ name: 'heap exploit' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.created).toHaveLength(0);
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('platform_id가 이미 연결된 챌린지는 skip', async () => {
    const createResult = await challengeService.createChallenge(ctf, { name: 'Known', category: 'misc' });
    if (isOk(createResult)) {
      await challengeService.updateChallenge(ctf, createResult.value._id, { platform_id: 'plat-42' });
    }

    const remote = makeRemote({ id: 'plat-42', name: 'Known' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.created).toHaveLength(0);
      expect(result.value.skipped).toContain('Known');
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('이름 매칭 시 platform_id가 없으면 자동 연결', async () => {
    const createResult = await challengeService.createChallenge(ctf, { name: 'LinkMe', category: 'web' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;
    expect(chall.platform_id).toBeNull();

    const remote = makeRemote({ id: 'plat-99', name: 'LinkMe' });
    const dc = makePlatformClient([remote]);
    const client = makeClient(ctfService, challengeService);

    await pullService.pullChallenges(client, ctf, dc);

    // platform_id가 연결되어야 함
    expect(chall.platform_id).toBe('plat-99');
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('진짜 새 챌린지만 생성', async () => {
    await challengeService.createChallenge(ctf, { name: 'Existing', category: 'web' });

    const existing = makeRemote({ name: 'Existing' });
    const brandNew = makeRemote({ name: 'BrandNew' });
    const dc = makePlatformClient([existing, brandNew]);

    mockCreateChannel.mockResolvedValue(
      Ok({
        challenge: new Challenge({ _id: 'new-1', name: 'BrandNew', category: 'web' }),
        threadChannel: { send: vi.fn(async () => {}) },
      }),
    );

    const client = makeClient(ctfService, challengeService);
    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.skipped).toContain('Existing');
      expect(result.value.created).toContain('BrandNew');
    }
    expect(mockCreateChannel).toHaveBeenCalledTimes(1);
  });

  it('두 번 연속 pull해도 중복 생성 안 됨', async () => {
    const remotes = [
      makeRemote({ id: 'r1', name: 'Chall A' }),
      makeRemote({ id: 'r2', name: 'Chall B' }),
    ];

    let callCount = 0;
    mockCreateChannel.mockImplementation(async (_client: any, _ctf: any, _guild: any, name: string, category: string) => {
      callCount += 1;
      const ch = new Challenge({ _id: `created-${callCount}`, name, category });
      // pullChallenges 내부에서 ctf.challenges에 추가되도록 서비스 호출
      await challengeService.createChallenge(ctf, { _id: ch._id, name, category });
      return Ok({ challenge: ctf.challenges.get(ch._id)!, threadChannel: { send: vi.fn(async () => {}) } });
    });

    const dc = makePlatformClient(remotes);
    const client = makeClient(ctfService, challengeService);

    // 첫 번째 pull — 2개 생성
    const result1 = await pullService.pullChallenges(client, ctf, dc);
    expect(isOk(result1)).toBe(true);
    if (isOk(result1)) {
      expect(result1.value.created).toHaveLength(2);
    }

    // 두 번째 pull — 0개 생성
    mockCreateChannel.mockClear();
    const result2 = await pullService.pullChallenges(client, ctf, dc);
    expect(isOk(result2)).toBe(true);
    if (isOk(result2)) {
      expect(result2.value.created).toHaveLength(0);
      expect(result2.value.skipped).toHaveLength(2);
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });

  it('같은 pull 루프 내에서 플랫폼이 같은 이름을 중복 반환해도 한 번만 생성', async () => {
    const remotes = [
      makeRemote({ id: 'dup-1', name: 'Duplicate' }),
      makeRemote({ id: 'dup-2', name: 'Duplicate' }),
    ];

    let callCount = 0;
    mockCreateChannel.mockImplementation(async (_client: any, _ctf: any, _guild: any, name: string, category: string) => {
      callCount += 1;
      const ch = new Challenge({ _id: `dup-created-${callCount}`, name, category });
      await challengeService.createChallenge(ctf, { _id: ch._id, name, category });
      return Ok({ challenge: ctf.challenges.get(ch._id)!, threadChannel: { send: vi.fn(async () => {}) } });
    });

    const dc = makePlatformClient(remotes);
    const client = makeClient(ctfService, challengeService);

    const result = await pullService.pullChallenges(client, ctf, dc);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // 첫 번째만 생성, 두 번째는 이름 매칭으로 skip
      expect(result.value.created).toHaveLength(1);
      expect(result.value.skipped).toHaveLength(1);
    }
    expect(mockCreateChannel).toHaveBeenCalledTimes(1);
  });
});
