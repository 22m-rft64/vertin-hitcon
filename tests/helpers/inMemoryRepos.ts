import { Ok, Err, Result } from '../../src/utils/types/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTF, CTFCredentials, ICTF } from '@core/models/CTF';
import { Challenge, IChallenge } from '@core/models/Challenge';
import { CTFMember, ICTFMember } from '@core/models/CTFMember';
import { IAchievement } from '@core/models/Achievement';
import { MemberAchievement } from '@core/models/MemberAchievement';
import {
  ICTFRepository,
  CTFSearchQuery,
  IMemberRepository,
  MemberSearchQuery,
  MemberWithRawAchievements,
  IAchievementRepository,
} from '@core/ports/repositories';

// --- InMemory CTF Repository ---

export class InMemoryCTFRepository implements ICTFRepository {
  readonly store: Map<string, CTF> = new Map();

  async findByQuery(query: CTFSearchQuery): Promise<Result<CTF | null, ServiceError>> {
    for (const ctf of this.store.values()) {
      const matches = Object.entries(query).every(([key, value]) => {
        if (value === undefined) return true;
        const ctfVal = ctf[key as keyof CTF];
        if (key === 'name' && typeof value === 'string') {
          return String(ctfVal).trim().toLowerCase() === value.trim().toLowerCase();
        }
        return ctfVal === value;
      });
      if (matches) return Ok(ctf);
    }
    return Ok(null);
  }

  async findActive(): Promise<Result<CTF[], ServiceError>> {
    const active = [...this.store.values()].filter((c) => !c.archived);
    return Ok(active);
  }

  async findAll(): Promise<Result<CTF[], ServiceError>> {
    return Ok([...this.store.values()]);
  }

  async create(data: Partial<ICTF>): Promise<Result<CTF, ServiceError>> {
    const ctf = new CTF(data);
    this.store.set(ctf.name, ctf);
    return Ok(ctf);
  }

  async update(name: string, data: Partial<ICTF>): Promise<Result<boolean, ServiceError>> {
    const ctf = this.store.get(name);
    if (!ctf) return Ok(false);
    Object.assign(ctf, data);
    if (data.name && data.name !== name) {
      this.store.delete(name);
      this.store.set(ctf.name, ctf);
    }
    return Ok(true);
  }

  async delete(name: string): Promise<Result<boolean, ServiceError>> {
    return Ok(this.store.delete(name));
  }

  async updateCredentials(name: string, credentials: CTFCredentials): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(name);
    if (!ctf) return Err(ServiceError.notFound('CTF', name));
    ctf.credentials = credentials;
    return Ok(void 0);
  }

  async addChallenge(ctfName: string, challenge: IChallenge): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Err(ServiceError.notFound('CTF', ctfName));
    ctf.challenges.set(challenge._id, new Challenge(challenge));
    return Ok(void 0);
  }

  async updateChallenge(ctfName: string, challengeId: string, data: Partial<IChallenge>): Promise<Result<boolean, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Ok(false);
    const ch = ctf.challenges.get(challengeId);
    if (!ch) return Ok(false);
    Object.assign(ch, data);
    return Ok(true);
  }

  async removeChallenge(ctfName: string, challengeId: string): Promise<Result<boolean, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Ok(false);
    return Ok(ctf.challenges.delete(challengeId));
  }

  async addWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Err(ServiceError.notFound('CTF', ctfName));
    const ch = ctf.challenges.get(challengeId);
    if (!ch) return Err(ServiceError.notFound('Challenge', challengeId));
    if (!ch.players.includes(memberId)) ch.players.push(memberId);
    return Ok(void 0);
  }

  async removeWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Err(ServiceError.notFound('CTF', ctfName));
    const ch = ctf.challenges.get(challengeId);
    if (!ch) return Err(ServiceError.notFound('Challenge', challengeId));
    ch.players = ch.players.filter((id) => id !== memberId);
    return Ok(void 0);
  }

  async addIdleWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Err(ServiceError.notFound('CTF', ctfName));
    const ch = ctf.challenges.get(challengeId);
    if (!ch) return Err(ServiceError.notFound('Challenge', challengeId));
    if (!ch.idleWorkers.includes(memberId)) ch.idleWorkers.push(memberId);
    return Ok(void 0);
  }

  async removeIdleWorker(ctfName: string, challengeId: string, memberId: string): Promise<Result<void, ServiceError>> {
    const ctf = this.store.get(ctfName);
    if (!ctf) return Err(ServiceError.notFound('CTF', ctfName));
    const ch = ctf.challenges.get(challengeId);
    if (!ch) return Err(ServiceError.notFound('Challenge', challengeId));
    ch.idleWorkers = ch.idleWorkers.filter((id) => id !== memberId);
    return Ok(void 0);
  }
}

// --- InMemory Member Repository ---

export class InMemoryMemberRepository implements IMemberRepository {
  readonly store: Map<string, CTFMember> = new Map();

  async findById(id: string): Promise<Result<CTFMember | null, ServiceError>> {
    return Ok(this.store.get(id) ?? null);
  }

  async findByQuery(query: MemberSearchQuery): Promise<Result<CTFMember[], ServiceError>> {
    const results = [...this.store.values()].filter((m) =>
      Object.entries(query).every(([key, value]) => {
        if (value === undefined) return true;
        return m[key as keyof CTFMember] === value;
      }),
    );
    return Ok(results);
  }

  async findAll(): Promise<Result<CTFMember[], ServiceError>> {
    return Ok([...this.store.values()]);
  }

  async findAllWithRawAchievements(): Promise<Result<MemberWithRawAchievements[], ServiceError>> {
    const results = [...this.store.values()].map((member) => ({
      member,
      rawAchievements: member.achievements.map((a) => ({
        id: a.id,
        member_id: a.member_id,
        achievement_id: a.achievement_id,
        achieved_at: a.achieved_at,
        achieved_ctfs: a.achieved_ctfs,
        achieved_msg: a.achieved_msg,
        progress_count: a.progress_count,
      })),
    }));
    return Ok(results);
  }

  async create(data: Partial<ICTFMember>): Promise<Result<CTFMember, ServiceError>> {
    const member = new CTFMember(data);
    this.store.set(member.id, member);
    return Ok(member);
  }

  async update(id: string, data: Partial<ICTFMember>): Promise<Result<boolean, ServiceError>> {
    const member = this.store.get(id);
    if (!member) return Ok(false);
    Object.assign(member, data);
    return Ok(true);
  }

  async updateMemberAchievement(
    memberId: string,
    achievementId: string,
    data: { achieved_at: Date | null; achieved_ctfs: string[]; achieved_msg: string | null; progress_count: number },
  ): Promise<Result<void, ServiceError>> {
    const member = this.store.get(memberId);
    if (!member) return Err(ServiceError.notFound('Member', memberId));
    const ma = member.achievements.find((a) => a.id === achievementId);
    if (ma) Object.assign(ma, data);
    return Ok(void 0);
  }

  async addAchievements(
    memberId: string,
    achievements: { id: string; member_id: string; achievement_id: string; achieved_at: Date | null; achieved_ctfs: string[]; progress_count: number }[],
  ): Promise<Result<void, ServiceError>> {
    // No-op for in-memory; MemberService adds to the member object directly
    return Ok(void 0);
  }
}

// --- InMemory Achievement Repository ---

export class InMemoryAchievementRepository implements IAchievementRepository {
  readonly store: Map<string, IAchievement> = new Map();

  async findAll(): Promise<Result<IAchievement[], ServiceError>> {
    return Ok([...this.store.values()]);
  }

  async upsertAll(achievements: IAchievement[]): Promise<Result<{ upsertedCount: number; modifiedCount: number }, ServiceError>> {
    let upserted = 0;
    let modified = 0;
    for (const ach of achievements) {
      const existing = this.store.get(ach.id);
      if (existing) {
        modified += 1;
        // Preserve runtime stats on update (mirrors real mongo upsert behavior)
        this.store.set(ach.id, { ...ach, unlock_count: existing.unlock_count, rating: existing.rating });
      } else {
        upserted += 1;
        this.store.set(ach.id, ach);
      }
    }
    return Ok({ upsertedCount: upserted, modifiedCount: modified });
  }

  async update(id: string, data: Partial<IAchievement>): Promise<Result<boolean, ServiceError>> {
    const existing = this.store.get(id);
    if (!existing) return Ok(false);
    this.store.set(id, { ...existing, ...data });
    return Ok(true);
  }
}
