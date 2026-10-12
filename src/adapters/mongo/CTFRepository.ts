import { Result, Ok, Err, tryAsyncWith } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTF, CTFCredentials, ICTF } from '@core/models/CTF';
import { Challenge, IChallenge } from '@core/models/Challenge';
import { ICTFRepository, CTFSearchQuery } from '@ports/repositories';
import { escapeRegex } from '@discordutils/escaperegex';
import { CTFModel, CTFDocument } from './schemas/ctf';
import { FilterQuery } from 'mongoose';

export class MongoCTFRepository implements ICTFRepository {
  async findByQuery(query: CTFSearchQuery): Promise<Result<CTF | null, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const mongoQuery = this.buildSearchQuery(query);
        const doc = await CTFModel.findOne(mongoQuery);
        return doc ? this.docToCTF(doc) : null;
      },
      (e) => ServiceError.dbError('find CTF', e),
    );
  }

  async findActive(): Promise<Result<CTF[], ServiceError>> {
    return tryAsyncWith(
      async () => {
        const docs = await CTFModel.find({ archived: false });
        return docs.map((doc) => this.docToCTF(doc));
      },
      (e) => ServiceError.dbError('find active CTFs', e),
    );
  }

  async findAll(): Promise<Result<CTF[], ServiceError>> {
    return tryAsyncWith(
      async () => {
        const docs = await CTFModel.find({});
        return docs.map((doc) => this.docToCTF(doc));
      },
      (e) => ServiceError.dbError('find all CTFs', e),
    );
  }

  async create(data: Partial<ICTF>): Promise<Result<CTF, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const doc = new CTFModel({
          name: data.name,
          archived: data.archived ?? false,
          ended: data.ended ?? false,
          private: data.private ?? false,
          credentials: data.credentials,
          challenges: [],
          guild_role: data.guild_role || '',
          guild_category: data.guild_category || '',
          guild_channels: data.guild_channels,
          start_at: data.start_at || new Date(),
          ended_at: data.ended_at || null,
          event_id: data.event_id || data.name?.toLowerCase().replace(/\s+/g, '-'),
          join_msg: data.join_msg || '',
        });
        await doc.save();
        return this.docToCTF(doc);
      },
      (e) => ServiceError.dbError('create CTF', e),
    );
  }

  async update(name: string, data: Partial<ICTF>): Promise<Result<boolean, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const { challenges, ...updateData } = data;
        const result = await CTFModel.updateOne(
          { name },
          { $set: updateData },
        );
        return result.modifiedCount > 0;
      },
      (e) => ServiceError.dbError('update CTF', e),
    );
  }

  async delete(name: string): Promise<Result<boolean, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const result = await CTFModel.deleteOne({ name });
        return result.deletedCount > 0;
      },
      (e) => ServiceError.dbError('delete CTF', e),
    );
  }

  async updateCredentials(
    name: string,
    credentials: CTFCredentials,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne({ name }, { $set: { credentials } });
      },
      (e) => ServiceError.dbError('update credentials', e),
    );
  }

  async addChallenge(
    ctfName: string,
    challenge: IChallenge,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne(
          { name: ctfName },
          { $push: { challenges: challenge } },
        );
      },
      (e) => ServiceError.dbError('add challenge', e),
    );
  }

  async updateChallenge(
    ctfName: string,
    challengeId: string,
    data: Partial<IChallenge>,
  ): Promise<Result<boolean, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const updateFields: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          updateFields[`challenges.$.${key}`] = value;
        }
        updateFields['challenges.$._updatedAt'] = new Date();

        const result = await CTFModel.updateOne(
          { name: ctfName, 'challenges._id': challengeId },
          { $set: updateFields },
        );
        return result.modifiedCount > 0;
      },
      (e) => ServiceError.dbError('update challenge', e),
    );
  }

  async removeChallenge(
    ctfName: string,
    challengeId: string,
  ): Promise<Result<boolean, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const result = await CTFModel.updateOne(
          { name: ctfName },
          { $pull: { challenges: { _id: challengeId } } },
        );
        return result.modifiedCount > 0;
      },
      (e) => ServiceError.dbError('remove challenge', e),
    );
  }

  async addWorker(
    ctfName: string,
    challengeId: string,
    memberId: string,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne(
          { name: ctfName, 'challenges._id': challengeId },
          {
            $addToSet: { 'challenges.$.players': memberId },
            $set: { 'challenges.$._updatedAt': new Date() },
          },
        );
      },
      (e) => ServiceError.dbError('add worker', e),
    );
  }

  async removeWorker(
    ctfName: string,
    challengeId: string,
    memberId: string,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne(
          { name: ctfName, 'challenges._id': challengeId },
          {
            $pull: { 'challenges.$.players': memberId },
            $set: { 'challenges.$._updatedAt': new Date() },
          },
        );
      },
      (e) => ServiceError.dbError('remove worker', e),
    );
  }

  async addIdleWorker(
    ctfName: string,
    challengeId: string,
    memberId: string,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne(
          { name: ctfName, 'challenges._id': challengeId },
          {
            $addToSet: { 'challenges.$.idleWorkers': memberId },
            $set: { 'challenges.$._updatedAt': new Date() },
          },
        );
      },
      (e) => ServiceError.dbError('add idle worker', e),
    );
  }

  async removeIdleWorker(
    ctfName: string,
    challengeId: string,
    memberId: string,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        await CTFModel.updateOne(
          { name: ctfName, 'challenges._id': challengeId },
          {
            $pull: { 'challenges.$.idleWorkers': memberId },
            $set: { 'challenges.$._updatedAt': new Date() },
          },
        );
      },
      (e) => ServiceError.dbError('remove idle worker', e),
    );
  }

  private buildSearchQuery(searchFields: CTFSearchQuery): FilterQuery<ICTF> {
    const query: FilterQuery<ICTF> = {};

    for (const [key, value] of Object.entries(searchFields)) {
      if (value === undefined) continue;

      if (key === 'name' && typeof value === 'string') {
        query[key] = new RegExp(`^${escapeRegex(value.trim())}$`, 'i');
      } else {
        query[key] = value;
      }
    }

    return query;
  }

  private docToCTF(doc: CTFDocument): CTF {
    const ctf = new CTF({
      name: doc.name,
      archived: doc.archived,
      ended: doc.ended,
      private: doc.private,
      credentials: {
        url: doc.credentials.url ?? null,
        username: doc.credentials.username ?? null,
        password: doc.credentials.password ?? null,
        email: doc.credentials.email ?? null,
        invite: doc.credentials.invite ?? null,
        teamToken: doc.credentials.teamToken ?? null,
        _message: doc.credentials._message ?? null,
      },
      guild_role: doc.guild_role,
      guild_category: doc.guild_category,
      guild_channels: {
        general: doc.guild_channels.general,
        announcements: doc.guild_channels.announcements,
        credentials: doc.guild_channels.credentials,
        scoreboard: doc.guild_channels.scoreboard,
        solves: doc.guild_channels.solves,
        notes: doc.guild_channels.notes,
        botCmds: doc.guild_channels.botCmds,
        feed: doc.guild_channels.feed ?? null,
      },
      pull_ignore: doc.pull_ignore ?? [],
      start_at: doc.start_at,
      ended_at: doc.ended_at,
      event_id: doc.event_id,
      join_msg: doc.join_msg,
      _createdAt: doc.createdAt,
      _updatedAt: doc.updatedAt,
    });

    if (doc.challenges && Array.isArray(doc.challenges)) {
      for (const challDoc of doc.challenges) {
        const challenge = new Challenge({
          _id: challDoc._id?.toString(),
          slug: challDoc.slug ?? null,
          platform_id: challDoc.platform_id ?? null,
          name: challDoc.name,
          category: challDoc.category,
          raw_category: challDoc.raw_category ?? null,
          thread: challDoc.thread,
          players: challDoc.players,
          announcement: challDoc.announcement,
          workon_message: challDoc.workon_message ?? null,
          solved: challDoc.solved,
          blooded: challDoc.blooded,
          solve_time: challDoc.solve_time,
          solve_announcement: challDoc.solve_announcement,
          solver: challDoc.solver ?? null,
          contributors: challDoc.contributors ?? [],
          solvers: challDoc.solvers,
          flag: challDoc.flag,
          _createdAt: challDoc._createdAt,
          _updatedAt: challDoc._updatedAt,
        });

        ctf.challenges.set(challenge._id, challenge);
      }
    }

    return ctf;
  }
}
