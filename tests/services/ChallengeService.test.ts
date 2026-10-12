import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '../../src/utils/types/result';
import { CTFService } from '@services/CTFService';
import { ChallengeService } from '@services/ChallengeService';
import { CTF } from '@core/models/CTF';
import { Challenge } from '@core/models/Challenge';
import { InMemoryCTFRepository } from '../helpers/inMemoryRepos';

let repo: InMemoryCTFRepository;
let ctfService: CTFService;
let service: ChallengeService;
let ctf: CTF;

beforeEach(async () => {
  repo = new InMemoryCTFRepository();
  ctfService = new CTFService(repo);
  service = new ChallengeService(repo, ctfService);

  const result = await ctfService.createCTF({ name: 'TestCTF', start_at: new Date(2025, 0, 1) });
  if (isOk(result)) ctf = result.value;
});

// --- createChallenge ---

describe('ChallengeService.createChallenge', () => {
  it('should create a challenge and add to CTF map', async () => {
    const result = await service.createChallenge(ctf, { name: 'WebChall', category: 'web' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe('WebChall');
      expect(result.value.category).toBe('web');
      expect(result.value.slug).toContain('testctf:web:webchall');
    }
    expect(ctf.challenges.size).toBe(1);
  });

  it('should generate a unique _id', async () => {
    const r1 = await service.createChallenge(ctf, { name: 'A' });
    const r2 = await service.createChallenge(ctf, { name: 'B' });

    if (isOk(r1) && isOk(r2)) {
      expect(r1.value._id).not.toBe(r2.value._id);
    }
  });
});

// --- solveChallenge ---

describe('ChallengeService.solveChallenge', () => {
  it('should mark challenge as solved with solver and contributors', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'SolveMe' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    const result = await service.solveChallenge(ctf, chall._id, 'user1', ['user2']);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.solved).toBe(true);
      expect(result.value.solver).toBe('user1');
      expect(result.value.contributors).toEqual(['user2']);
      expect(result.value.solvers).toEqual(['user1', 'user2']);
      expect(result.value.solve_time).toBeInstanceOf(Date);
    }
  });

  it('should store flag when provided', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'FlagMe' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    const result = await service.solveChallenge(ctf, chall._id, 'user1', [], 'CTF{flag}');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.flag).toBe('CTF{flag}');
    }
  });

  it('should return NOT_FOUND for non-existent challenge', async () => {
    const result = await service.solveChallenge(ctf, 'fake_id', 'user1');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

// --- unsolveChallenge ---

describe('ChallengeService.unsolveChallenge', () => {
  it('should revert solve status', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'UnsolveMe' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    await service.solveChallenge(ctf, chall._id, 'user1', ['user2'], 'flag{test}');
    const result = await service.unsolveChallenge(ctf, chall._id);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.solved).toBe(false);
      expect(result.value.solve_time).toBeNull();
      expect(result.value.solver).toBeNull();
      expect(result.value.contributors).toEqual([]);
      expect(result.value.flag).toBeNull();
    }
  });
});

// --- updateSolveInfo ---

describe('ChallengeService.updateSolveInfo', () => {
  it('should update contributors and flag without unsolving', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'EditSolve' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    await service.solveChallenge(ctf, chall._id, 'user1', [], null);
    const result = await service.updateSolveInfo(ctf, chall._id, {
      contributors: ['user2', 'user3'],
      flag: 'codegate{updated}',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.solved).toBe(true);
      expect(result.value.solver).toBe('user1');
      expect(result.value.contributors).toEqual(['user2', 'user3']);
      expect(result.value.flag).toBe('codegate{updated}');
      expect(result.value.solvers).toEqual(['user1', 'user2', 'user3']);
    }
  });

  it('should fail on unsolved challenge', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'NotSolved' });
    if (!isOk(createResult)) throw new Error('setup failed');

    const result = await service.updateSolveInfo(ctf, createResult.value._id, { flag: 'test' });
    expect(isErr(result)).toBe(true);
  });
});

// --- updateChallenge ---

describe('ChallengeService.updateChallenge', () => {
  it('should update challenge fields', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'UpdChall' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    const result = await service.updateChallenge(ctf, chall._id, { name: 'Renamed' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe('Renamed');
    }
  });

  it('should return NOT_FOUND for non-existent challenge', async () => {
    const result = await service.updateChallenge(ctf, 'fake_id', { name: 'X' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

// --- removeChallenge ---

describe('ChallengeService.removeChallenge', () => {
  it('should remove challenge from CTF map', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'RemoveMe' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    const result = await service.removeChallenge(ctf, chall._id);

    expect(isOk(result)).toBe(true);
    expect(ctf.challenges.size).toBe(0);
  });
});

// --- addWorker / removeWorker ---

describe('ChallengeService worker management', () => {
  it('should add a worker', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'WorkChall' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    await service.addWorker(ctf, chall._id, 'user1');

    expect(chall.players).toContain('user1');
  });

  it('should not duplicate workers', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'DupWorker' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    await service.addWorker(ctf, chall._id, 'user1');
    await service.addWorker(ctf, chall._id, 'user1');

    expect(chall.players.filter((p) => p === 'user1')).toHaveLength(1);
  });

  it('should remove a worker', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'RmWorker' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    await service.addWorker(ctf, chall._id, 'user1');
    await service.removeWorker(ctf, chall._id, 'user1');

    expect(chall.players).not.toContain('user1');
  });
});

// --- platform_id ---

describe('ChallengeService platform_id', () => {
  it('should store and find challenge by platform_id', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'PlatformIdChall', category: 'web' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;

    expect(chall.platform_id).toBeNull();

    await service.updateChallenge(ctf, chall._id, { platform_id: '42' });

    const found = service.findChallenge(ctf, { platform_id: '42' });
    expect(found).not.toBeNull();
    expect(found?.name).toBe('PlatformIdChall');
  });

  it('should return null for non-existent platform_id', () => {
    const found = service.findChallenge(ctf, { platform_id: 'nonexistent' });
    expect(found).toBeNull();
  });

  it('should preserve _id when updating platform_id (no overwrite bug)', async () => {
    const createResult = await service.createChallenge(ctf, { name: 'PreserveId' });
    if (!isOk(createResult)) throw new Error('setup failed');
    const chall = createResult.value;
    const originalId = chall._id;

    await service.updateChallenge(ctf, chall._id, { platform_id: '99' });

    expect(chall._id).toBe(originalId);
    expect(chall.platform_id).toBe('99');
    // Map lookup by original _id should still work
    expect(ctf.challenges.get(originalId)).toBe(chall);
  });

  it('should not match a specific platform_id query against null platform_id', async () => {
    await service.createChallenge(ctf, { name: 'NullPlatformId', category: 'web' });

    const found = service.findChallenge(ctf, { platform_id: '42' });
    expect(found).toBeNull();
  });

  it('should support compound platform_id + name query', async () => {
    const r1 = await service.createChallenge(ctf, { name: 'SameName', category: 'web' });
    const r2 = await service.createChallenge(ctf, { name: 'SameName', category: 'pwn' });
    if (isOk(r1)) await service.updateChallenge(ctf, r1.value._id, { platform_id: '10' });
    if (isOk(r2)) await service.updateChallenge(ctf, r2.value._id, { platform_id: '20' });

    const found = service.findChallenge(ctf, { platform_id: '20', name: 'SameName' });
    expect(found).not.toBeNull();
    expect(found!.platform_id).toBe('20');
    expect(found!.category).toBe('pwn');
  });
});

// --- find methods ---

describe('ChallengeService find methods', () => {
  let webChall: Challenge;
  let pwnChall: Challenge;

  beforeEach(async () => {
    const r1 = await service.createChallenge(ctf, { name: 'WebFind', category: 'web', thread: 'thread-1' });
    const r2 = await service.createChallenge(ctf, { name: 'PwnFind', category: 'pwn', thread: 'thread-2' });
    if (isOk(r1)) webChall = r1.value;
    if (isOk(r2)) pwnChall = r2.value;
  });

  it('findByName should be case-insensitive', () => {
    expect(service.findByName(ctf, 'webfind')?.name).toBe('WebFind');
  });

  it('findByName should return null for non-existent', () => {
    expect(service.findByName(ctf, 'NoSuch')).toBeNull();
  });

  it('findBySlug should match exact slug', () => {
    const found = service.findBySlug(ctf, webChall.slug!);
    expect(found?.name).toBe('WebFind');
  });

  it('findByThread should match thread id', () => {
    expect(service.findByThread(ctf, 'thread-1')?.name).toBe('WebFind');
    expect(service.findByThread(ctf, 'thread-2')?.name).toBe('PwnFind');
  });

  it('findChallenge should match partial query', () => {
    const found = service.findChallenge(ctf, { category: 'pwn' });
    expect(found?.name).toBe('PwnFind');
  });

  it('getChallengeList should return all challenges', () => {
    expect(service.getChallengeList(ctf)).toHaveLength(2);
  });
});
