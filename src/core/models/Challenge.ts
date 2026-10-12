import { normalizeCategory } from './Category';

export interface IChallenge {
  _id: string;
  slug: string | null;
  platform_id: string | null;
  name: string;
  category: string;
  raw_category: string;
  thread: string | null;
  players: string[];
  idleWorkers: string[];
  announcement: string | null;
  workon_message: string | null;
  blooded: boolean;
  solved: boolean;
  solve_time: Date | null;
  solve_announcement: string | null;
  solver: string | null;
  contributors: string[];
  /** @deprecated 하위호환용 — 새 코드에서는 solver + contributors 사용 */
  solvers: string[];
  flag: string | null;
  _createdAt: Date;
  _updatedAt: Date;
}

export class Challenge implements IChallenge {
  _id: string;
  slug: string | null;
  platform_id: string | null;
  name: string;
  category: string;
  raw_category: string;
  thread: string | null;
  players: string[];
  idleWorkers: string[];
  announcement: string | null;
  workon_message: string | null;
  solved: boolean;
  blooded: boolean;
  solve_time: Date | null;
  solve_announcement: string | null;
  solver: string | null;
  contributors: string[];
  flag: string | null;
  _createdAt: Date;
  _updatedAt: Date;

  constructor(data: Partial<IChallenge>) {
    this._id = data._id || null;
    this.slug = data.slug ?? null;
    this.platform_id = data.platform_id ?? null;
    this.name = data.name || 'Unnamed Challenge';
    this.raw_category = data.raw_category || data.category || 'misc';
    this.category = normalizeCategory(this.raw_category);
    this.thread = data.thread || null;
    this.solved = data.solved || false;
    this.blooded = data.blooded || false;
    this.players = data.players || [];
    this.idleWorkers = data.idleWorkers || [];
    this.announcement = data.announcement || null;
    this.workon_message = data.workon_message || null;
    this.solve_time = data.solve_time || null;
    this.solve_announcement = data.solve_announcement || null;
    this.solver = data.solver ?? null;
    this.contributors = data.contributors ?? [];
    this.flag = data.flag || null;
    this._createdAt = data._createdAt || new Date();
    this._updatedAt = data._updatedAt || new Date();

    // 하위호환: 기존 DB에 solvers만 있는 경우 마이그레이션
    if (!this.solver && data.solvers?.length > 0) {
      this.solver = data.solvers[0];
      this.contributors = data.solvers.slice(1);
    }
  }

  /** solver + contributors를 합친 전체 solver 목록 (하위호환) */
  get solvers(): string[] {
    if (!this.solver) return [];
    return [this.solver, ...this.contributors];
  }

  toJSON(): IChallenge {
    return {
      _id: this._id,
      slug: this.slug,
      platform_id: this.platform_id,
      name: this.name,
      category: this.category,
      raw_category: this.raw_category,
      thread: this.thread,
      players: this.players,
      idleWorkers: this.idleWorkers,
      announcement: this.announcement,
      workon_message: this.workon_message,
      solved: this.solved,
      blooded: this.blooded,
      solve_time: this.solve_time,
      solve_announcement: this.solve_announcement,
      solver: this.solver,
      contributors: this.contributors,
      solvers: this.solvers,
      flag: this.flag,
      _createdAt: this._createdAt,
      _updatedAt: this._updatedAt,
    };
  }
}

/**
 * 챌린지 slug 생성
 * 형식: <year>:<ctfName>:<category>:<challengeName>
 */
export function buildChallengeSlug(
  ctfName: string,
  category: string,
  challengeName: string,
  year?: number,
): string {
  const y = year ?? new Date().getFullYear();
  return `${y}:${ctfName}:${normalizeCategory(category)}:${challengeName}`.toLowerCase();
}
