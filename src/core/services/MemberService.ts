import { Result, Ok, Err, isErr } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { CTFMember, ICTFMember } from '@core/models/CTFMember';

type MemberSearchQuery = Record<string, unknown>;

interface IMemberRepository {
  findByQuery(query: MemberSearchQuery): Promise<Result<CTFMember[], ServiceError>>;
  findAll(): Promise<Result<CTFMember[], ServiceError>>;
  create(data: Partial<ICTFMember>): Promise<Result<CTFMember, ServiceError>>;
  update(id: string, data: Partial<ICTFMember>): Promise<Result<boolean, ServiceError>>;
}

export class MemberService {
  private readonly members: Map<string, CTFMember> = new Map();
  private readonly repo: IMemberRepository;

  constructor(repo: IMemberRepository) {
    this.repo = repo;
  }

  getMember(id: string): CTFMember | null {
    return this.members.get(id) ?? null;
  }

  getAllMembers(): CTFMember[] {
    return Array.from(this.members.values());
  }

  getMemberCount(): number {
    return this.members.size;
  }

  setMember(id: string, member: CTFMember): void {
    this.members.set(id, member);
  }

  async createMember(
    data: Partial<ICTFMember>,
  ): Promise<Result<CTFMember, ServiceError>> {
    const dbResult = await this.repo.create(data);
    if (isErr(dbResult)) {
      return dbResult;
    }

    const member = dbResult.value;
    this.members.set(member.id, member);
    return Ok(member);
  }

  async updateMember(
    id: string,
    data: Partial<ICTFMember>,
  ): Promise<Result<CTFMember, ServiceError>> {
    const member = this.members.get(id);
    if (!member) {
      return Err(ServiceError.notFound('Member', id));
    }

    const dbResult = await this.repo.update(id, data);
    if (isErr(dbResult)) {
      return dbResult;
    }

    Object.assign(member, data);
    member.updated_at = new Date();
    return Ok(member);
  }

  async searchMembers(
    query: MemberSearchQuery,
  ): Promise<Result<CTFMember[], ServiceError>> {
    return this.repo.findByQuery(query);
  }
}
