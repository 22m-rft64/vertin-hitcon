import { ChannelType, Guild, TextChannel } from 'discord.js';
import { warnUnexpectedError } from '@discordutils/discorderror';

/**
 * 카테고리 아래 모든 스레드를 잠금 + invitable 설정
 */
export async function lockCategoryThreads(
  guild: Guild,
  categoryId: string,
): Promise<{ locked: number; failed: string[] }> {
  const threads = guild.channels.cache.filter(
    (ch) =>
      (ch.type === ChannelType.GuildPublicThread ||
        ch.type === ChannelType.GuildPrivateThread) &&
      ch.parent?.parentId === categoryId,
  );

  let locked = 0;
  const failed: string[] = [];

  for (const ch of threads.values()) {
    if (!ch.isThread()) continue;
    try {
      await ch.edit({ locked: true, invitable: true });
      locked++;
    } catch (e) {
      warnUnexpectedError('lockCategoryThreads', e);
      failed.push(ch.name);
    }
  }

  return { locked, failed };
}

/**
 * 카테고리 자식 채널들의 퍼미션을 카테고리에 동기화
 */
export async function syncChildPermissions(
  guild: Guild,
  categoryId: string,
  excludeChannelIds: string[] = [],
): Promise<void> {
  const category = guild.channels.cache.get(categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) return;

  for (const ch of category.children.cache.values()) {
    if (excludeChannelIds.includes(ch.id)) continue;
    try {
      await (ch as TextChannel).edit({ lockPermissions: true });
    } catch (e) {
      warnUnexpectedError('syncChildPermissions', e);
    }
  }
}
