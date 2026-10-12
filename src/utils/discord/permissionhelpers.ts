import {
  Collection,
  Guild,
  GuildMember,
  OverwriteResolvable,
  PermissionResolvable,
  Role,
} from 'discord.js';

/**
 * 아카이브용 general 채널 퍼미션 (멤버별 ViewChannel + SendMessages)
 */
export function buildArchiveGeneralOverwrites(
  guild: Guild,
  membersWithRole: Collection<string, GuildMember>,
): OverwriteResolvable[] {
  return [
    {
      id: guild.roles.everyone.id,
      deny: ['ViewChannel'] as PermissionResolvable[],
    },
    ...membersWithRole.map((m) => ({
      id: m.id,
      allow: ['ViewChannel', 'SendMessages'] as PermissionResolvable[],
    })),
  ];
}

/**
 * 아카이브용 카테고리/기타 채널 퍼미션 (멤버별 ViewChannel only)
 */
export function buildArchiveCategoryOverwrites(
  guild: Guild,
  membersWithRole: Collection<string, GuildMember>,
): OverwriteResolvable[] {
  return [
    {
      id: guild.roles.everyone.id,
      deny: ['ViewChannel'] as PermissionResolvable[],
    },
    ...membersWithRole.map((m) => ({
      id: m.id,
      allow: ['ViewChannel'] as PermissionResolvable[],
    })),
  ];
}
