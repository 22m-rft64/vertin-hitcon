import { Result } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTF, CTFCredentials, ICTF } from '@core/models/CTF';
import { IChallenge } from '@core/models/Challenge';

// --- CTF Repository ---

export type CTFSearchQuery = Partial<Pick<
  ICTF,
  'name' | 'event_id' | 'archived' | 'ended' | 'guild_category' | 'guild_role'
>>;

export interface ICTFRepository {
  findByQuery(query: CTFSearchQuery): Promise<Result<CTF | null, ServiceError>>;
  findActive(): Promise<Result<CTF[], ServiceError>>;
  findAll(): Promise<Result<CTF[], ServiceError>>;
  create(data: Partial<ICTF>): Promise<Result<CTF, ServiceError>>;
  update(name: string, data: Partial<ICTF>): Promise<Result<boolean, ServiceError>>;
  delete(name: string): Promise<Result<boolean, ServiceError>>;
  updateCredentials(name: string, credentials: CTFCredentials): Promise<Result<void, ServiceError>>;

  // Challenge operations (embedded in CTF document)
  addChallenge(ctfName: string, challenge: IChallenge): Promise<Result<void, ServiceError>>;
  updateChallenge(ctfName: string, challengeId: string, data: Partial<IChallenge>): Promise<Result<boolean, ServiceError>>;
  removeChallenge(ctfName: string, challengeId: string): Promise<Result<boolean, ServiceError>>;
  addWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>>;
  removeWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>>;
  addIdleWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>>;
  removeIdleWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>>;
}
