import { ChannelType, Events } from 'discord.js';
import { DiscordEvent } from '@discordtypes/event';
import { createLogger } from '@discordutils/logger';

const log = createLogger('ChannelDelete');
import { Component } from '@discordutils/components/component';
import { rebuildCategoryAnnouncement } from '@discordutils/ctf/discordutil';
import { isErr } from '@discordtypes/result';
import { fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';

const channelDelete: DiscordEvent<Events.ChannelDelete> = {
  name: Events.ChannelDelete,
  once: false,
  async execute(client, channel): Promise<void> {
    if (channel.type !== ChannelType.GuildText) return;

    const categoryId = channel.parentId;
    if (!categoryId) return;

    const ctfResult = await client.ctfService.getCTF({ guild_category: categoryId });
    if (isErr(ctfResult) || !ctfResult.value) return;
    const ctf = ctfResult.value;

    // archived CTF는 채널 삭제 시 challenges 보존
    if (ctf.archived) return;

    // 이 텍스트 채널 아래 스레드에 속한 챌린지들 찾기
    const challengesToRemove = [...ctf.challenges.values()]
      .filter((ch) => ch.thread && channel.threads?.cache.has(ch.thread));

    if (challengesToRemove.length === 0) return;

    const annResult = await fetchTextChannelFromClient(
      client,
      ctf.guild_channels.announcements,
      'announcements channel',
    );

    // 1. 삭제 전에 카테고리별 remaining 계산
    const removeIds = new Set(challengesToRemove.map((ch) => ch._id));
    const categoryGroups = new Map<string, { announcementId: string | null; remaining: number }>();
    for (const ch of challengesToRemove) {
      if (!categoryGroups.has(ch.category)) {
        const remaining = [...ctf.challenges.values()]
          .filter((c) => c.category === ch.category && !removeIds.has(c._id));
        const announcementId = [...ctf.challenges.values()]
          .find((c) => c.category === ch.category && c.announcement)?.announcement ?? null;
        categoryGroups.set(ch.category, { announcementId, remaining: remaining.length });
      }
    }

    // 2. removeChallenge 실행
    for (const ch of challengesToRemove) {
      await Component.unpersistByAction('workon', ch._id);
      await Component.unpersistByAction('workon_idle', ch._id);
      await client.challengeService.removeChallenge(ctf, ch._id);
    }

    // 3. 카테고리별 announcement 처리 (remaining 기반)
    for (const [cat, { announcementId, remaining }] of categoryGroups) {
      await Component.unpersistByAction('catworkon', `${ctf.name}::${cat}`);

      if (!isErr(annResult) && announcementId) {
        if (remaining > 0) {
          await rebuildCategoryAnnouncement(client, ctf, cat, annResult.value);
        } else {
          try {
            const msg = await annResult.value.messages.fetch(announcementId);
            await msg.delete();
          } catch (error) { warnUnexpectedError('channelDelete: delete announcement', error); }
        }
      }
    }

    log.info('Cleaned up %d challenge(s)', challengesToRemove.length);
  },
};

export default channelDelete;
