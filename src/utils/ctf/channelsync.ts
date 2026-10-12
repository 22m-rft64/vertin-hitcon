import {
  CategoryChannel,
  ChannelType,
  Guild,
  OverwriteResolvable,
  PermissionResolvable,
  Role,
} from 'discord.js';
import { CTF, ICTF } from '@core/models/CTF';
import { VertinClient } from '@discordutils/vertinclient';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { isErr } from '@discordtypes/result';

const CHANNEL_SPEC: {
  key: string;
  patterns: string[];
  createName: string;
  readOnly: boolean;
}[] = [
  { key: 'general', patterns: ['general'], createName: 'general', readOnly: false },
  { key: 'botCmds', patterns: ['🤖-bot-cmds', 'bot-cmds'], createName: '🤖-bot-cmds', readOnly: false },
  { key: 'credentials', patterns: ['🔑-credentials', 'credentials'], createName: '🔑-credentials', readOnly: true },
  { key: 'notes', patterns: ['📝-notes', 'notes'], createName: '📝-notes', readOnly: true },
  { key: 'announcements', patterns: ['📣-announcements', 'announcements'], createName: '📣-announcements', readOnly: true },
  { key: 'solves', patterns: ['🎉-solves', 'solves'], createName: '🎉-solves', readOnly: true },
  { key: 'scoreboard', patterns: ['📈-scoreboard', 'scoreboard'], createName: '📈-scoreboard', readOnly: true },
  { key: 'feed', patterns: ['📡-feed', 'feed'], createName: '📡-feed', readOnly: true },
];

export interface SyncResult {
  success: boolean;
  results: string[];
}

/**
 * CTF 카테고리 아래 채널을 스캔하고, 없으면 생성해서 DB와 동기화.
 */
export async function syncChannels(
  client: VertinClient,
  ctf: CTF,
  guild: Guild,
  categoryChannel: CategoryChannel,
): Promise<SyncResult> {
  const role = guild.roles.cache.get(ctf.guild_role) as Role | undefined;
  const children = categoryChannel.children.cache;
  const newChannels: Partial<ICTF['guild_channels']> = {};
  const results: string[] = [];

  for (const spec of CHANNEL_SPEC) {
    const found = children.find((ch) =>
      ch.type === ChannelType.GuildText &&
      spec.patterns.some((p) => ch.name.toLowerCase().includes(p.toLowerCase())),
    );

    if (found) {
      newChannels[spec.key] = found.id;
      const changed = ctf.guild_channels[spec.key as keyof typeof ctf.guild_channels] !== found.id;
      results.push(`${changed ? '🔄' : '✅'} ${spec.key}: <#${found.id}>`);
    } else {
      try {
        const overwrites: OverwriteResolvable[] = [
          { id: guild.roles.everyone.id, deny: ['ViewChannel'] as PermissionResolvable[] },
        ];

        if (role) {
          if (spec.readOnly) {
            overwrites.push({
              id: role.id,
              allow: ['ViewChannel', 'ReadMessageHistory'] as PermissionResolvable[],
              deny: ['SendMessages'] as PermissionResolvable[],
            });
          } else {
            overwrites.push({
              id: role.id,
              allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages'] as PermissionResolvable[],
            });
          }
        }

        const created = await guild.channels.create({
          name: spec.createName,
          type: ChannelType.GuildText,
          parent: categoryChannel.id,
          permissionOverwrites: overwrites,
        });
        newChannels[spec.key] = created.id;
        results.push(`🆕 ${spec.key}: <#${created.id}> (생성됨)`);
      } catch (e) {
        warnUnexpectedError(`channel-sync: create ${spec.key}`, e);
        newChannels[spec.key] = null;
        results.push(`❌ ${spec.key}: 생성 실패`);
      }
    }
  }

  // 채널 순서 정렬
  try {
    const positionUpdates: { channel: string; position: number }[] = [];
    let pos = 1;
    for (const spec of CHANNEL_SPEC) {
      const chId = newChannels[spec.key];
      if (chId) {
        positionUpdates.push({ channel: chId, position: pos++ });
      }
    }
    await guild.channels.setPositions(positionUpdates);
  } catch (e) {
    warnUnexpectedError('channel-sync: reorder', e);
  }

  // DB 업데이트
  const updateResult = await client.ctfService.updateCTF(ctf.name, {
    guild_category: categoryChannel.id,
    guild_channels: newChannels as ICTF['guild_channels'],
  });

  if (isErr(updateResult)) {
    return { success: false, results };
  }

  ctf.guild_category = categoryChannel.id;
  Object.assign(ctf.guild_channels, newChannels);

  return { success: true, results };
}
