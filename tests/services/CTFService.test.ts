import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '../../src/utils/types/result';
import { CTFService } from '@services/CTFService';
import { CTF } from '@core/models/CTF';
import { InMemoryCTFRepository } from '../helpers/inMemoryRepos';

let repo: InMemoryCTFRepository;
let service: CTFService;

beforeEach(async () => {
  repo = new InMemoryCTFRepository();
  service = new CTFService(repo);
});

// --- init ---

describe('CTFService.init', () => {
  it('should load active CTFs into cache', async () => {
    repo.store.set('ActiveCTF', new CTF({ name: 'ActiveCTF' }));
    repo.store.set('Archived', new CTF({ name: 'Archived', archived: true }));

    await service.init();

    expect(service.listActiveCTFs()).toHaveLength(1);
    expect(service.listActiveCTFs()[0].name).toBe('ActiveCTF');
  });

  it('should return Ok on success', async () => {
    const result = await service.init();
    expect(isOk(result)).toBe(true);
  });
});

// --- createCTF ---

describe('CTFService.createCTF', () => {
  it('should create and cache a CTF', async () => {
    const result = await service.createCTF({ name: 'NewCTF' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe('NewCTF');
    }
    expect(service.listActiveCTFs()).toHaveLength(1);
  });

  it('should reject duplicate CTF names', async () => {
    await service.createCTF({ name: 'DupCTF' });
    const result = await service.createCTF({ name: 'DupCTF' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('DUPLICATE');
    }
  });
});

// --- getCTF ---

describe('CTFService.getCTF', () => {
  it('should return cached CTF by name', async () => {
    await service.createCTF({ name: 'CachedCTF' });
    const result = await service.getCTF({ name: 'CachedCTF' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value?.name).toBe('CachedCTF');
    }
  });

  it('should be case-insensitive for name lookup', async () => {
    await service.createCTF({ name: 'MyCTF' });
    const result = await service.getCTF({ name: 'myctf' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value?.name).toBe('MyCTF');
    }
  });

  it('should return null for non-existent CTF', async () => {
    const result = await service.getCTF({ name: 'Ghost' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBeNull();
    }
  });

  it('should query DB if not in cache', async () => {
    // Directly insert into repo (bypassing cache)
    repo.store.set('DBOnly', new CTF({ name: 'DBOnly' }));

    const result = await service.getCTF({ name: 'DBOnly' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value?.name).toBe('DBOnly');
    }
  });
});

// --- updateCTF ---

describe('CTFService.updateCTF', () => {
  it('should update CTF fields in cache', async () => {
    await service.createCTF({ name: 'UpdCTF' });
    const result = await service.updateCTF('UpdCTF', { ended: true });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.ended).toBe(true);
    }
  });

  it('should handle CTF rename (cache key swap)', async () => {
    await service.createCTF({ name: 'OldName' });
    const result = await service.updateCTF('OldName', { name: 'NewName' });

    expect(isOk(result)).toBe(true);
    expect(service.getCache().has('OldName')).toBe(false);
    expect(service.getCache().has('NewName')).toBe(true);
  });

  it('should return NOT_FOUND for non-existent CTF', async () => {
    const result = await service.updateCTF('NoSuchCTF', { ended: true });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

// --- deleteCTF ---

describe('CTFService.deleteCTF', () => {
  it('should delete CTF and remove from cache', async () => {
    await service.createCTF({ name: 'DelCTF' });
    const result = await service.deleteCTF('DelCTF');

    expect(isOk(result)).toBe(true);
    expect(service.listActiveCTFs()).toHaveLength(0);
    expect(repo.store.has('DelCTF')).toBe(false);
  });

  it('should return NOT_FOUND for non-existent CTF', async () => {
    const result = await service.deleteCTF('Ghost');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});

// --- archiveCTF ---

describe('CTFService.archiveCTF', () => {
  it('should archive CTF and remove from active cache', async () => {
    await service.createCTF({ name: 'ArchCTF' });
    const result = await service.archiveCTF('ArchCTF');

    expect(isOk(result)).toBe(true);
    expect(service.listActiveCTFs()).toHaveLength(0);

    const ctf = repo.store.get('ArchCTF');
    expect(ctf?.archived).toBe(true);
    expect(ctf?.ended).toBe(true);
    expect(ctf?.ended_at).toBeInstanceOf(Date);
  });
});

// --- updateCredentials ---

describe('CTFService.updateCredentials', () => {
  it('should update credentials in cache and repo', async () => {
    await service.createCTF({ name: 'CredCTF' });
    const creds = {
      url: 'https://ctf.example.com',
      username: 'team',
      password: 'pass',
      email: null,
      invite: null,
      teamToken: null,
      _message: null,
    };

    const result = await service.updateCredentials('CredCTF', creds);

    expect(isOk(result)).toBe(true);
    expect(service.getCache().get('CredCTF')?.credentials.url).toBe('https://ctf.example.com');
  });
});

// --- listAllCTFs ---

describe('CTFService.listAllCTFs', () => {
  it('should return all CTFs including archived', async () => {
    await service.createCTF({ name: 'Active' });
    repo.store.set('Old', new CTF({ name: 'Old', archived: true }));

    const result = await service.listAllCTFs();

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(2);
    }
  });
});
