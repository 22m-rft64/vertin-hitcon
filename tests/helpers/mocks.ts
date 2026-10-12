import {
  Achievement,
  AchievementCategory,
  AchievementConditionOptions,
  AchievementTrigger,
  BoolAchievement,
} from '@core/models/Achievement';
import { MemberAchievement } from '@core/models/MemberAchievement';
import { Challenge } from '@core/models/Challenge';
import { CTFMember } from '@core/models/CTFMember';
import { CTF } from '@core/models/CTF';
// --- Challenge ---

export function mockChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return new Challenge({
    name: "test-chall",
    category: "web",
    solved: false,
    blooded: false,
    solvers: [],
    ...overrides,
  });
}

// --- CTF (lightweight stub, no ChallengeManager dependency) ---

interface MockCTFOptions {
  name?: string;
  challenges?: Challenge[];
  ended_at?: Date | null;
  start_at?: Date | null;
}

export function mockCTF(options: MockCTFOptions = {}): CTF {
  const challs = new Map<string, Challenge>();
  for (const ch of options.challenges ?? []) {
    challs.set(ch.name, ch);
  }

  return {
    name: options.name ?? "TestCTF",
    challenges: challs,
    ended_at: "ended_at" in options ? options.ended_at : new Date(),
    start_at: "start_at" in options ? options.start_at : new Date(),
  } as CTF;
}

// --- CTFMember ---

export function mockCTFMember(overrides: Partial<CTFMember> = {}): CTFMember {
  return new CTFMember({
    id: overrides.id ?? "user1",
    username: overrides.username ?? "testuser",
    globalname: overrides.globalname ?? "Test User",
    achievements: overrides.achievements ?? [],
  });
}

// --- MemberAchievement ---

interface MockMemberAchievementOptions {
  achievement?: Achievement;
  memberId?: string;
  achievedAt?: Date | null;
  progressCount?: number;
  achievedCtfs?: string[];
  achievedMsg?: string | null;
}

export function mockMemberAchievement(
  options: MockMemberAchievementOptions = {},
): MemberAchievement {
  const achievement =
    options.achievement ??
    new BoolAchievement({
      id: "stub",
      title: "Stub",
      trigger_type: AchievementTrigger.ON_END,
      category: AchievementCategory.GENERAL,
    });

  return new MemberAchievement({
    id: `${options.memberId ?? "user1"}${achievement.id}`,
    member_id: options.memberId ?? "user1",
    achievement_id: achievement.id,
    achievement,
    achieved_at: options.achievedAt ?? null,
    achieved_ctfs: options.achievedCtfs ?? [],
    achieved_msg: options.achievedMsg ?? null,
    progress_count: options.progressCount ?? 0,
  });
}

// --- AchievementConditionOptions ---

interface MockConditionOptions {
  challenge?: Challenge;
  ctf?: CTF;
  member?: CTFMember;
  memberAchievement?: MemberAchievement;
}

export function mockConditionOptions(
  options: MockConditionOptions = {},
): AchievementConditionOptions {
  const member = options.member ?? mockCTFMember();
  const memberAchievement =
    options.memberAchievement ?? mockMemberAchievement({ memberId: member.id });
  const ctf = options.ctf ?? mockCTF();
  const challenge = options.challenge;

  return {
    memberAchievement,
    member,
    ctf,
    challenge,
  };
}
