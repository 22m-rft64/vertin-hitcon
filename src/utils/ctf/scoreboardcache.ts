export interface Team {
  name: string;
  score: number | null;
}

interface ScoreboardSnapshot {
  teams: Team[];
  myTeam: Team | null;
  fetchedAt: number;
}

const cache = new Map<string, ScoreboardSnapshot>();

/**
 * 스코어보드 스냅샷 저장 (CTF 이름 기준)
 */
export function setScoreboardSnapshot(
  ctfName: string,
  teams: Team[],
  myTeam: Team | null,
): void {
  cache.set(ctfName, { teams, myTeam, fetchedAt: Date.now() });
}

/**
 * 이전 스냅샷 조회
 */
export function getScoreboardSnapshot(ctfName: string): ScoreboardSnapshot | null {
  return cache.get(ctfName) ?? null;
}

/**
 * 팀의 순위 조회 (1-based, 없으면 null)
 */
function findRank(teams: Team[], teamName: string): number | null {
  const idx = teams.findIndex((t) => t.name === teamName);
  return idx >= 0 ? idx + 1 : null;
}

export interface ScoreDelta {
  teamName: string;
  prevScore: number | null;
  currScore: number;
  prevRank: number | null;
  currRank: number | null;
  scoreDiff: number | null;
  rankDiff: number | null;  // 음수 = 순위 상승
}

/**
 * 이전 스냅샷 대비 현재 스코어 변화 계산
 */
export function computeScoreDelta(
  ctfName: string,
  currentTeams: Team[],
  myTeam: Team | null,
): ScoreDelta | null {
  if (!myTeam) return null;

  const prev = cache.get(ctfName);
  const currRank = findRank(currentTeams, myTeam.name);

  if (!prev || !prev.myTeam) {
    return {
      teamName: myTeam.name,
      prevScore: null,
      currScore: myTeam.score ?? 0,
      prevRank: null,
      currRank,
      scoreDiff: null,
      rankDiff: null,
    };
  }

  const prevRank = findRank(prev.teams, myTeam.name);
  const prevScore = prev.myTeam.score ?? 0;
  const currScore = myTeam.score ?? 0;

  return {
    teamName: myTeam.name,
    prevScore,
    currScore,
    prevRank,
    currRank,
    scoreDiff: currScore - prevScore,
    rankDiff: prevRank != null && currRank != null ? prevRank - currRank : null,
  };
}

/**
 * ScoreDelta를 사람이 읽을 수 있는 문자열로 변환
 */
export function formatScoreDelta(delta: ScoreDelta): string {
  const parts: string[] = [];

  // 점수
  if (delta.prevScore != null && delta.scoreDiff != null) {
    const sign = delta.scoreDiff >= 0 ? '+' : '';
    parts.push(`${delta.prevScore}pts → ${delta.currScore}pts (${sign}${delta.scoreDiff})`);
  } else {
    parts.push(`${delta.currScore}pts`);
  }

  // 순위
  if (delta.prevRank != null && delta.currRank != null && delta.rankDiff != null) {
    if (delta.rankDiff > 0) {
      parts.push(`#${delta.prevRank} → #${delta.currRank} (▲${delta.rankDiff})`);
    } else if (delta.rankDiff < 0) {
      parts.push(`#${delta.prevRank} → #${delta.currRank} (▼${Math.abs(delta.rankDiff)})`);
    } else {
      parts.push(`#${delta.currRank}`);
    }
  } else if (delta.currRank != null) {
    parts.push(`#${delta.currRank}`);
  }

  return `📈 ${delta.teamName}: ${parts.join(' | ')}`;
}

/**
 * 캐시 정리 (CTF 제거 시)
 */
export function clearScoreboardCache(ctfName: string): void {
  cache.delete(ctfName);
}
