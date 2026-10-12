import { Result, tryAsyncWith } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTFMember, ICTFMember } from '@core/models/CTFMember';
import { CTFMemberModel, CTFMemberDocument } from './schemas/ctfmember';

type MemberSearchQuery = Record<string, unknown>;

export class MongoMemberRepository {
  async findById(id: string): Promise<Result<CTFMember | null, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const doc = await CTFMemberModel.findOne({ id });
        return doc ? this.docToMember(doc) : null;
      },
      (e) => ServiceError.dbError('find member', e),
    );
  }

  async findByQuery(query: MemberSearchQuery): Promise<Result<CTFMember[], ServiceError>> {
    return tryAsyncWith(
      async () => {
        const docs = await CTFMemberModel.find(query);
        return docs.map((doc) => this.docToMember(doc));
      },
      (e) => ServiceError.dbError('search members', e),
    );
  }

  async findAll(): Promise<Result<CTFMember[], ServiceError>> {
    return tryAsyncWith(
      async () => {
        const docs = await CTFMemberModel.find({});
        return docs.map((doc) => this.docToMember(doc));
      },
      (e) => ServiceError.dbError('find all members', e),
    );
  }

  async create(data: Partial<ICTFMember>): Promise<Result<CTFMember, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const doc = new CTFMemberModel(data);
        await doc.save();
        return this.docToMember(doc);
      },
      (e) => ServiceError.dbError('create member', e),
    );
  }

  async update(id: string, data: Partial<ICTFMember>): Promise<Result<boolean, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const result = await CTFMemberModel.updateOne({ id }, { $set: data });
        return result.modifiedCount > 0;
      },
      (e) => ServiceError.dbError('update member', e),
    );
  }

  private docToMember(doc: CTFMemberDocument): CTFMember {
    return new CTFMember({
      id: doc.id,
      username: doc.username,
      globalname: doc.globalname,
      nickname: doc.nickname,
      avatar_url_guild: doc.avatar_url_guild,
      avatar_url: doc.avatar_url,
      joined_at: doc.joined_at,
      updated_at: doc.updated_at,
    });
  }
}
