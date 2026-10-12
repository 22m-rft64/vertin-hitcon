import { Events } from 'discord.js';
import { DiscordEvent } from '@discordtypes/event';
import { Component } from '@discordutils/components/component';
import { rebuildCategoryAnnouncement } from '@discordutils/ctf/discordutil';
import { isErr } from '@discordtypes/result';
import { fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { createLogger } from '@discordutils/logger';

const log = createLogger('ThreadDelete');

const threadDelete: DiscordEvent<Events.ThreadDelete> = {
  name: Events.ThreadDelete,
  once: false,
  async execute(client, thread): Promise<void> {
    const categoryId = thread.parent?.parentId;
    if (!categoryId) return;

    const ctfResult = await client.ctfService.getCTF({ guild_category: categoryId });
    if (isErr(ctfResult) || !ctfResult.value) return;
    const ctf = ctfResult.value;

    // archived CTF는 스레드 삭제 시 challenges 보존
    if (ctf.archived) return;

    const challenge = client.challengeService.findChallenge(ctf, {
      thread: thread.id,
    });
    if (!challenge) return;

    await Component.unpersistByAction('workon', challenge._id);
    await Component.unpersistByAction('workon_idle', challenge._id);

    const removeResult = await client.challengeService.removeChallenge(ctf, challenge._id);
    if (isErr(removeResult)) {
      log.error('Failed to remove challenge %s: %s', challenge.name, removeResult.error.message);
      return;
    }

    // 공지 임베드 rebuild
    if (challenge.announcement) {
      const annResult = await fetchTextChannelFromClient(
        client,
        ctf.guild_channels.announcements,
        'announcements channel',
      );
      if (isErr(annResult)) return;
      const announcementChannel = annResult.value;

      const sameCategoryOthers = [...ctf.challenges.values()]
        .filter((c) => c.category === challenge.category);

      if (sameCategoryOthers.length > 0) {
        await rebuildCategoryAnnouncement(client, ctf, challenge.category, announcementChannel);
      } else {
        try {
          const msg = await announcementChannel.messages.fetch(challenge.announcement);
          await msg.delete();
        } catch (error) { warnUnexpectedError('threadDelete: delete announcement', error); }
        await Component.unpersistByAction('catworkon', `${ctf.name}::${challenge.category}`);
      }
    }

    // 해당 카테고리에 남은 챌린지가 없으면 카테고리 텍스트 채널도 삭제
    const remainingInCategory = [...ctf.challenges.values()]
      .filter((c) => c.category === challenge.category);

    if (remainingInCategory.length === 0 && thread.parent) {
      try {
        await thread.parent.delete();
        log.info('Deleted empty category channel "%s"', thread.parent.name);
      } catch (error) {
        log.error('Failed to delete category channel', error);
      }
    }

    log.info('Cleaned up challenge "%s"', challenge.name);
  },
};

export default threadDelete;
