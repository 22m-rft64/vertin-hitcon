import { Result, Ok, Err, isOk, isErr } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTF, CTFCredentials, ICTF } from '@core/models/CTF';
import { ICTFRepository, CTFSearchQuery } from '@ports/repositories';
import { createLogger } from '@discordutils/logger';

const log = createLogger('CTFService');

export class CTFService {
  private cache: Map<string, CTF> = new Map();
  private readonly repo: ICTFRepository;

  constructor(repo: ICTFRepository) {
    this.repo = repo;
  }

  async init(): Promise<Result<void, ServiceError>> {
    const result = await this.loadActiveCTFs();
    if (isErr(result)) {
      return result;
    }
    log.info('Initialized with %d active CTFs', this.cache.size);
    return Ok(void 0);
  }

  async createCTF(data: Partial<ICTF>): Promise<Result<CTF, ServiceError>> {
    const existingResult = await this.getCTF({ name: data.name });
    if (isOk(existingResult) && existingResult.value) {
      return Err(ServiceError.duplicate('CTF', data.name));
    }

    const dbResult = await this.repo.create(data);
    if (isErr(dbResult)) {
      return dbResult;
    }

    const ctf = dbResult.value;
    this.cache.set(ctf.name, ctf);
    return Ok(ctf);
  }

  async deleteCTF(name: string): Promise<Result<boolean, ServiceError>> {
    const dbResult = await this.repo.delete(name);
    if (isErr(dbResult)) {
      return dbResult;
    }

    if (!dbResult.value) {
      return Err(ServiceError.notFound('CTF', name));
    }

    this.cache.delete(name);
    return Ok(true);
  }

  async updateCTF(
    name: string,
    data: Partial<ICTF>,
  ): Promise<Result<CTF, ServiceError>> {
    const { challenges, ...updateData } = data;

    const dbResult = await this.repo.update(name, updateData);
    if (isErr(dbResult)) {
      return dbResult;
    }

    if (!dbResult.value) {
      return Err(ServiceError.notFound('CTF', name));
    }

    const ctf = this.cache.get(name);
    if (ctf) {
      if (data.name && data.name !== name) {
        this.cache.delete(name);
      }
      Object.assign(ctf, updateData);
      ctf._updatedAt = new Date();
      if (data.name && data.name !== name) {
        this.cache.set(ctf.name, ctf);
      }
      return Ok(ctf);
    }

    // 캐시에 없으면 DB에서 조회
    const fetchResult = await this.getCTF({ name: data.name || name });
    if (isErr(fetchResult) || !fetchResult.value) {
      return Err(ServiceError.notFound('CTF', name));
    }
    return Ok(fetchResult.value);
  }

  async archiveCTF(name: string): Promise<Result<boolean, ServiceError>> {
    const dbResult = await this.repo.update(name, {
      archived: true,
      ended: true,
      ended_at: new Date(),
    });

    if (isErr(dbResult)) {
      return dbResult;
    }

    const ctf = this.cache.get(name);
    if (ctf) {
      ctf.archived = true;
      ctf.ended = true;
      ctf.ended_at = new Date();
    }
    this.cache.delete(name);

    return Ok(true);
  }

  async getCTF(
    query: CTFSearchQuery,
  ): Promise<Result<CTF | null, ServiceError>> {
    const cached = this.findInCache(query);
    if (cached) {
      return Ok(cached);
    }

    const dbResult = await this.repo.findByQuery(query);
    if (isErr(dbResult)) {
      return dbResult;
    }

    if (!dbResult.value) {
      return Ok(null);
    }

    const ctf = dbResult.value;
    if (!ctf.archived) {
      this.cache.set(ctf.name, ctf);
    }
    return Ok(ctf);
  }

  listActiveCTFs(): CTF[] {
    return Array.from(this.cache.values());
  }

  async listAllCTFs(): Promise<Result<CTF[], ServiceError>> {
    return this.repo.findAll();
  }

  async updateCredentials(
    ctfName: string,
    credentials: CTFCredentials,
  ): Promise<Result<void, ServiceError>> {
    const dbResult = await this.repo.updateCredentials(ctfName, credentials);
    if (isErr(dbResult)) {
      return dbResult;
    }

    const ctf = this.cache.get(ctfName);
    if (ctf) {
      ctf.credentials = credentials;
      ctf._updatedAt = new Date();
    }
    return Ok(void 0);
  }

  async loadActiveCTFs(): Promise<Result<void, ServiceError>> {
    const dbResult = await this.repo.findActive();
    if (isErr(dbResult)) {
      return dbResult;
    }

    this.cache.clear();
    for (const ctf of dbResult.value) {
      this.cache.set(ctf.name, ctf);
    }
    return Ok(void 0);
  }

  getCache(): Map<string, CTF> {
    return this.cache;
  }

  private findInCache(query: CTFSearchQuery): CTF | null {
    const entries = Object.entries(query) as [string, unknown][];

    for (const ctf of this.cache.values()) {
      const matches = entries.every(([key, value]) => {
        if (value === undefined) return true;

        const ctfValue = ctf[key as keyof CTF];

        if (key === 'name' && typeof value === 'string') {
          return String(ctfValue).trim().toLowerCase() === value.trim().toLowerCase();
        }
        return ctfValue === value;
      });

      if (matches) {
        return ctf;
      }
    }
    return null;
  }
}
