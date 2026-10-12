import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isOk, isErr } from '../../src/utils/types/result';
import { CTFService } from '@services/CTFService';
import { ChallengeService } from '@services/ChallengeService';
import { CTF } from '@core/models/CTF';
import { InMemoryCTFRepository } from '../helpers/inMemoryRepos';

// --- Mock Discord Interaction ---

function mockInteractionOptions(opts: Record<string, string | null>) {
  return {
    getString: (name: string, required?: boolean) => {
      const val = opts[name] ?? null;
      if (required && val === null) throw new Error(`Missing required option: ${name}`);
      return val;
    },
    getSubcommand: () => 'createchallenge',
  };
}

function mockInteraction(opts: {
  options?: Record<string, string | null>;
  channelParentId?: string;
} = {}) {
  let deferred = false;
  let replied = false;
  let lastReply: unknown = null;
  let modalShown: unknown = null;

  return {
    options: mockInteractionOptions(opts.options ?? {}),
    guild: { id: 'guild-1' },
    user: { id: 'user-1', username: 'testuser' },
    locale: 'ko',
    member: { permissions: { has: () => true } },
    channel: {
      type: 0, // GuildText
      parentId: opts.channelParentId ?? 'cat-1',
      parent: { parentId: opts.channelParentId ?? 'cat-1' },
    },
    deferred,
    replied,
    deferReply: vi.fn(async () => { deferred = true; }),
    editReply: vi.fn(async (data: unknown) => { lastReply = data; }),
    reply: vi.fn(async (data: unknown) => { replied = true; lastReply = data; }),
    showModal: vi.fn(async (modal: unknown) => { modalShown = modal; }),
    get _lastReply() { return lastReply; },
    get _modalShown() { return modalShown; },
  };
}

// --- Mock createChallengeChannel (avoid Discord API calls) ---

vi.mock('@discordutils/ctf/discordutil', () => ({
  createChallengeChannel: vi.fn(),
  normalizeCategory: vi.fn((c: string) => c.toLowerCase()),
}));

vi.mock('@discordutils/ctf/safefetch', () => ({
  findCtfByInteraction: vi.fn(),
}));

import CreateChallenge from '@commands/ctf/subcommands/createchallenge';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { createChallengeChannel } from '@discordutils/ctf/discordutil';
import { Ok } from '../../src/utils/types/result';
import { Challenge } from '@core/models/Challenge';

const mockFindCtf = findCtfByInteraction as ReturnType<typeof vi.fn>;
const mockCreateChannel = createChallengeChannel as ReturnType<typeof vi.fn>;

let repo: InMemoryCTFRepository;
let ctfService: CTFService;
let challengeService: ChallengeService;
let ctf: CTF;

beforeEach(async () => {
  vi.clearAllMocks();

  repo = new InMemoryCTFRepository();
  ctfService = new CTFService(repo);
  challengeService = new ChallengeService(repo, ctfService);

  const result = await ctfService.createCTF({
    name: 'TestCTF',
    guild_category: 'cat-1',
    start_at: new Date(2025, 0, 1),
  });
  if (isOk(result)) ctf = result.value;
});

// --- 단건 생성 (기존 flow) ---

describe('createchallenge: 단건 생성 (name + category)', () => {
  it('name과 category가 모두 있으면 deferReply 후 단건 생성', async () => {
    const interaction = mockInteraction({
      options: { name: 'sql-injection', category: 'web' },
      channelParentId: 'cat-1',
    });

    mockFindCtf.mockResolvedValue(Ok(ctf));
    mockCreateChannel.mockResolvedValue(
      Ok({
        challenge: new Challenge({ name: 'sql-injection', category: 'web' }),
        threadChannel: {},
      }),
    );

    const client = { ctfService, challengeService } as any;
    const result = await CreateChallenge.execute(client, interaction as any);

    expect(isOk(result)).toBe(true);
    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.showModal).not.toHaveBeenCalled();
    expect(mockCreateChannel).toHaveBeenCalledWith(
      client, ctf, interaction.guild, 'sql-injection', 'web',
    );
  });

  it('이미 존재하는 챌린지면 에러 반환', async () => {
    // 챌린지 미리 생성
    await challengeService.createChallenge(ctf, { name: 'xss', category: 'web' });

    const interaction = mockInteraction({
      options: { name: 'xss', category: 'web' },
      channelParentId: 'cat-1',
    });

    mockFindCtf.mockResolvedValue(Ok(ctf));

    const client = { ctfService, challengeService } as any;
    const result = await CreateChallenge.execute(client, interaction as any);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain('이미 같은 이름');
    }
    expect(mockCreateChannel).not.toHaveBeenCalled();
  });
});

// --- 배치 생성 (name 없이 category만) ---

describe('createchallenge: 배치 모달 (category만)', () => {
  it('name 없이 category만 주면 showModal 호출', async () => {
    const interaction = mockInteraction({
      options: { name: null, category: 'pwn' },
      channelParentId: 'cat-1',
    });

    mockFindCtf.mockResolvedValue(Ok(ctf));

    const client = {
      ctfService,
      challengeService,
      componentRegistry: {
        register: vi.fn(),
        unregister: vi.fn(),
      },
    } as any;
    const result = await CreateChallenge.execute(client, interaction as any);

    expect(isOk(result)).toBe(true);
    expect(interaction.showModal).toHaveBeenCalled();
    expect(interaction.deferReply).not.toHaveBeenCalled();
  });

  it('아카이브된 CTF에서는 에러 반환', async () => {
    ctf.archived = true;

    const interaction = mockInteraction({
      options: { name: null, category: 'web' },
      channelParentId: 'cat-1',
    });

    mockFindCtf.mockResolvedValue(Ok(ctf));

    const client = { ctfService, challengeService } as any;
    const result = await CreateChallenge.execute(client, interaction as any);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain('아카이브');
    }
  });
});

// --- CTF context 검증 ---

describe('createchallenge: CTF context 에러', () => {
  it('CTF 채널 밖에서 실행하면 에러', async () => {
    const interaction = mockInteraction({
      options: { name: 'test', category: 'web' },
    });

    mockFindCtf.mockResolvedValue(Ok(null));

    const client = { ctfService, challengeService } as any;
    const result = await CreateChallenge.execute(client, interaction as any);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain('CTF 채널');
    }
  });
});
