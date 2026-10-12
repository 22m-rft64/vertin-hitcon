export interface PlatformChallenge {
  id: string;
  name: string;
  category: string;
  description: string;
  points: number;
  solves: number;
  files: string[];
  authors: string[];
}

export interface PlatformTeam {
  id: number;
  name: string;
  rank: number | null;
  score: number | null;
  lastSolve: string | null;
}

export interface PlatformTeamSelf {
  id: number | null;
  name: string | null;
  score: number | null;
}

/**
 * Jeopardy CTF 플랫폼 포트.
 * 대회마다 플랫폼이 다르므로 PullService는 이 인터페이스에만 의존한다.
 */
export interface CTFPlatformClient {
  readonly url: string;
  isSessionValid(): Promise<boolean>;
  listChallenges(): Promise<PlatformChallenge[]>;
  getScoreboard(): Promise<PlatformTeam[]>;
  getSelf(): Promise<PlatformTeamSelf | null>;
}
