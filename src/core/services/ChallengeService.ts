import { Result, Ok, Err, isErr } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { normalizeCategory } from '@core/models/Category';
import { Challenge, IChallenge, buildChallengeSlug } from '@core/models/Challenge';
import { CTF } from '@core/models/CTF';
import { ICTFRepository } from '@ports/repositories';
import { IActivityFeed } from '@ports/activityfeed';
import { CTFService } from './CTFService';
import { ObjectId } from 'bson';

export class ChallengeService {
  private readonly repo: ICTFRepository;
  private readonly ctfService: CTFService;
  private readonly activityFeed: IActivityFeed | null;

  constructor(
    repo: ICTFRepository,
    ctfService: CTFService,
    activityFeed: IActivityFeed | null = null,
  ) {
    this.repo = repo;
    this.ctfService = ctfService;
    this.activityFeed = activityFeed;
  }

  async createChallenge(
    ctf: CTF,
    data: Partial<IChallenge>,
  ): Promise<Result<Challenge, ServiceError>> {
    const oid = data._id || new ObjectId().toString();

    const challenge = new Challenge({
      _id: oid,
      slug: buildChallengeSlug(ctf.name, data.category || 'misc', data.name || 'Unnamed Challenge', ctf.year),
      name: data.name || 'Unnamed Challenge',
      category: data.category || 'misc',
      thread: data.thread || null,
      solved: data.solved || false,
      blooded: data.blooded || false,
      players: data.players || [],
      announcement: data.announcement || null,
      solve_time: data.solve_time || null,
      solve_announcement: data.solve_announcement || null,
      flag: data.flag || null,
    });

    const dbResult = await this.repo.addChallenge(ctf.name, challenge.toJSON());
    if (isErr(dbResult)) {
      return dbResult;
    }

    ctf.challenges.set(challenge._id, challenge);
    return Ok(challenge);
  }

  async updateChallenge(
    ctf: CTF,
    challengeId: string,
    data: Partial<IChallenge>,
  ): Promise<Result<Challenge, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const dbResult = await this.repo.updateChallenge(ctf.name, challengeId, data);
    if (isErr(dbResult)) {
      return dbResult;
    }

    if (!dbResult.value) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    Object.assign(challenge, data);
    challenge._updatedAt = new Date();
    return Ok(challenge);
  }

  async removeChallenge(
    ctf: CTF,
    challengeId: string,
  ): Promise<Result<boolean, ServiceError>> {
    const dbResult = await this.repo.removeChallenge(ctf.name, challengeId);
    if (isErr(dbResult)) {
      return dbResult;
    }

    ctf.challenges.delete(challengeId);
    return Ok(dbResult.value);
  }

  async solveChallenge(
    ctf: CTF,
    challengeId: string,
    solverId: string,
    contributors: string[] = [],
    flag: string | null = null,
    silent = false,
  ): Promise<Result<Challenge, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const solveTime = new Date();
    const updateData: Partial<IChallenge> = {
      solved: true,
      solve_time: solveTime,
      solver: solverId,
      contributors,
      flag,
    };

    const dbResult = await this.repo.updateChallenge(ctf.name, challengeId, updateData);
    if (isErr(dbResult)) {
      return dbResult;
    }

    challenge.solved = true;
    challenge.solve_time = solveTime;
    challenge.solver = solverId;
    challenge.contributors = contributors;
    challenge.flag = flag;
    challenge._updatedAt = new Date();

    if (!silent) {
      const feedId = ctf.guild_channels.feed;
      if (feedId) {
        await this.activityFeed
          ?.onChallengeSolve(feedId, challenge.name, challenge.category, challenge.solvers)
          .catch(() => {});
      }
    }

    return Ok(challenge);
  }

  /**
   * solve 정보 업데이트 (contributors, flag 수정 — unsolve 없이)
   */
  async updateSolveInfo(
    ctf: CTF,
    challengeId: string,
    data: { solver?: string; contributors?: string[]; flag?: string | null },
  ): Promise<Result<Challenge, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }
    if (!challenge.solved) {
      return Err(ServiceError.validation('Challenge is not solved'));
    }

    const updateData: Partial<IChallenge> = {};
    if (data.solver !== undefined) {
      updateData.solver = data.solver;
      challenge.solver = data.solver;
    }
    if (data.contributors !== undefined) {
      updateData.contributors = data.contributors;
      challenge.contributors = data.contributors;
    }
    if (data.flag !== undefined) {
      updateData.flag = data.flag;
      challenge.flag = data.flag;
    }

    const dbResult = await this.repo.updateChallenge(ctf.name, challengeId, updateData);
    if (isErr(dbResult)) return dbResult;

    challenge._updatedAt = new Date();
    return Ok(challenge);
  }

  async unsolveChallenge(
    ctf: CTF,
    challengeId: string,
  ): Promise<Result<Challenge, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const updateData: Partial<IChallenge> = {
      solved: false,
      solve_time: null,
      solve_announcement: null,
      solver: null,
      contributors: [],
      flag: null,
    };

    const dbResult = await this.repo.updateChallenge(ctf.name, challengeId, updateData);
    if (isErr(dbResult)) {
      return dbResult;
    }

    challenge.solved = false;
    challenge.solve_time = null;
    challenge.solve_announcement = null;
    challenge.solver = null;
    challenge.contributors = [];
    challenge.flag = null;
    challenge._updatedAt = new Date();

    const unsolveFeedId = ctf.guild_channels.feed;
    if (unsolveFeedId) {
      await this.activityFeed
        ?.onChallengeUnsolve(unsolveFeedId, challenge.name, challenge.category)
        .catch(() => {});
    }

    return Ok(challenge);
  }

  async addWorker(
    ctf: CTF,
    challengeId: string,
    memberId: string,
    silent = false,
  ): Promise<Result<boolean, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const dbResult = await this.repo.addWorker(ctf.name, challengeId, memberId);
    if (isErr(dbResult)) {
      return dbResult;
    }

    if (!challenge.players.includes(memberId)) {
      challenge.players.push(memberId);
    }
    challenge._updatedAt = new Date();

    if (!silent) {
      const workerFeedId = ctf.guild_channels.feed;
      if (workerFeedId) {
        await this.activityFeed
          ?.onWorkerJoin(workerFeedId, challenge.name, challenge.category, memberId)
          .catch(() => {});
      }
    }

    return Ok(true);
  }

  async removeWorker(
    ctf: CTF,
    challengeId: string,
    memberId: string,
  ): Promise<Result<boolean, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const dbResult = await this.repo.removeWorker(ctf.name, challengeId, memberId);
    if (isErr(dbResult)) {
      return dbResult;
    }

    challenge.players = challenge.players.filter((id) => id !== memberId);
    challenge._updatedAt = new Date();
    return Ok(true);
  }

  /**
   * 활성 → 휴식: players에서 제거하고 idleWorkers에 추가
   */
  async deactivateWorker(
    ctf: CTF,
    challengeId: string,
    memberId: string,
  ): Promise<Result<boolean, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const removeResult = await this.repo.removeWorker(ctf.name, challengeId, memberId);
    if (isErr(removeResult)) return removeResult;

    const addResult = await this.repo.addIdleWorker(ctf.name, challengeId, memberId);
    if (isErr(addResult)) return addResult;

    challenge.players = challenge.players.filter((id) => id !== memberId);
    if (!challenge.idleWorkers.includes(memberId)) {
      challenge.idleWorkers.push(memberId);
    }
    challenge._updatedAt = new Date();

    const feedId = ctf.guild_channels.feed;
    if (feedId) {
      await this.activityFeed
        ?.onWorkerIdle(feedId, challenge.name, challenge.category, memberId)
        .catch(() => {});
    }

    return Ok(true);
  }

  /**
   * 휴식 → 활성: idleWorkers에서 제거하고 players에 추가
   */
  async reactivateWorker(
    ctf: CTF,
    challengeId: string,
    memberId: string,
    silent = false,
  ): Promise<Result<boolean, ServiceError>> {
    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      return Err(ServiceError.notFound('Challenge', challengeId));
    }

    const removeResult = await this.repo.removeIdleWorker(ctf.name, challengeId, memberId);
    if (isErr(removeResult)) return removeResult;

    const addResult = await this.repo.addWorker(ctf.name, challengeId, memberId);
    if (isErr(addResult)) return addResult;

    challenge.idleWorkers = challenge.idleWorkers.filter((id) => id !== memberId);
    if (!challenge.players.includes(memberId)) {
      challenge.players.push(memberId);
    }
    challenge._updatedAt = new Date();

    if (!silent) {
      const feedId = ctf.guild_channels.feed;
      if (feedId) {
        await this.activityFeed
          ?.onWorkerJoin(feedId, challenge.name, challenge.category, memberId)
          .catch(() => {});
      }
    }

    return Ok(true);
  }

  findByName(ctf: CTF, name: string): Challenge | null {
    for (const challenge of ctf.challenges.values()) {
      if (challenge.name.trim().toLowerCase() === name.trim().toLowerCase()) {
        return challenge;
      }
    }
    return null;
  }

  findBySlug(ctf: CTF, slug: string): Challenge | null {
    for (const challenge of ctf.challenges.values()) {
      if (challenge.slug === slug) {
        return challenge;
      }
    }
    return null;
  }

  findByThread(ctf: CTF, threadId: string): Challenge | null {
    for (const challenge of ctf.challenges.values()) {
      if (challenge.thread === threadId) {
        return challenge;
      }
    }
    return null;
  }

  findChallenge(
    ctf: CTF,
    query: Partial<Pick<IChallenge, 'name' | 'category' | 'thread' | 'solved' | '_id' | 'platform_id'>>,
  ): Challenge | null {
    for (const challenge of ctf.challenges.values()) {
      const matches = Object.entries(query).every(([key, value]) => {
        if (value === undefined) return true;

        const challValue = challenge[key as keyof Challenge];
        if ((key === 'name' || key === 'category') && typeof value === 'string') {
          return String(challValue).trim().toLowerCase() === value.trim().toLowerCase();
        }
        return challValue === value;
      });

      if (matches) return challenge;
    }
    return null;
  }

  getChallengeList(ctf: CTF): Challenge[] {
    return Array.from(ctf.challenges.values());
  }
}
