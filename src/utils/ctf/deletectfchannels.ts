import {
  CategoryChannel,
  ChannelType,
  Guild,
} from 'discord.js';
import createDebug from 'debug';

import { CTF } from '@core/models/CTF';
import { warnUnexpectedError } from '@discordutils/discorderror';

const debug = createDebug('vertin:deletectfchannels');

export interface DeleteChannelsResult {
  success: boolean;
  deletedChannels: number;
  failedChannels: string[];
}

/**
 * CTF의 Discord 채널 전부 삭제 (카테고리 + 하위 채널 + role).
 * DB는 보존.
 */
export async function deleteCtfChannels(
  guild: Guild,
  ctf: CTF,
): Promise<DeleteChannelsResult> {
  const result: DeleteChannelsResult = {
    success: false,
    deletedChannels: 0,
    failedChannels: [],
  };

  const category = guild.channels.cache.get(ctf.guild_category);

  if (!category || category.type !== ChannelType.GuildCategory) {
    debug('category not found for %s, skipping channel deletion', ctf.name);
    result.success = true;
    return result;
  }

  const children = (category as CategoryChannel).children.cache;

  // 하위 채널 삭제
  for (const [, ch] of children) {
    try {
      await ch.delete();
      result.deletedChannels += 1;
      debug('deleted channel: %s (%s)', ch.name, ch.id);
    } catch (e) {
      warnUnexpectedError(`deletectfchannels: ${ch.name}`, e);
      result.failedChannels.push(ch.name);
    }
  }

  // 카테고리 삭제
  try {
    await category.delete();
    result.deletedChannels += 1;
    debug('deleted category: %s (%s)', category.name, category.id);
  } catch (e) {
    warnUnexpectedError('deletectfchannels: category', e);
    result.failedChannels.push(category.name);
  }

  // role 삭제 (아직 남아있다면)
  const role = guild.roles.cache.get(ctf.guild_role);
  if (role) {
    try {
      await role.delete();
      debug('deleted role: %s', role.name);
    } catch (e) {
      warnUnexpectedError('deletectfchannels: role', e);
    }
  }

  result.success = result.failedChannels.length === 0;
  return result;
}
