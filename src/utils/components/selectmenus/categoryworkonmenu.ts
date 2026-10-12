import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  Collection,
  MessageFlags,
  Role,
} from 'discord.js';
import { Component, AnySelectMenuBuilder, ComponentInit } from '@discordutils/components/component';
import { ComponentRegistry } from '@handlers/componentregistry';
import { buildWorkonEmbed, debouncedRebuildCategoryAnnouncement } from '@discordutils/ctf/discordutil';
import { createLogger } from '@discordutils/logger';

const log = createLogger('WorkonMenu');
import { isErr } from '@discordtypes/result';
import { fetchTextChannelFromClient, fetchThreadChannel } from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { t, resolveLocale } from '@i18n/index';

export class CategoryWorkonMenu extends Component<StringSelectMenuInteraction> {
  static override actionName = 'catworkon';

  ctfName: string;

  constructor(init: ComponentInit, ctfName: string) {
    super(init);
    this.ctfName = ctfName;
  }

  build(): ActionRowBuilder<AnySelectMenuBuilder> {
    // Not used — select menu rows are built via buildCategorySelectMenuRow()
    throw new Error('Use buildCategorySelectMenuRow() instead');
  }

  async execute(interaction: StringSelectMenuInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const challengeId = interaction.values[0];

    // attachId format: `${ctfName}::${category}`
    const ctfName = this.attachId.slice(0, this.attachId.indexOf('::'));

    const ctfResult = await this.client.ctfService.getCTF({ name: ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.reply({
        content: t('error.ctf_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const ctf = ctfResult.value;

    const challenge = ctf.challenges.get(challengeId);
    if (!challenge) {
      await interaction.reply({
        content: t('error.challenge_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userId = interaction.user.id;

    if (challenge.players.includes(userId)) {
      await interaction.reply({
        content: t('error.already_working', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 휴식 → 활성 복귀
    if (challenge.idleWorkers.includes(userId)) {
      const reactivateResult = await this.client.challengeService.reactivateWorker(
        ctf,
        challenge._id,
        userId,
      );
      if (isErr(reactivateResult)) {
        await interaction.reply({
          content: `❌ ${reactivateResult.error.message}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // workon 메시지 임베드 업데이트
      if (challenge.workon_message) {
        try {
          const workonMsg = await interaction.channel.messages.fetch(challenge.workon_message);
          await workonMsg.edit({ embeds: [buildWorkonEmbed(challenge)] });
        } catch (error) { warnUnexpectedError('categoryworkonmenu: edit workon_message', error); }
      }

      const annResult = await fetchTextChannelFromClient(
        this.client,
        ctf.guild_channels.announcements,
        '공지 채널',
      );
      if (!isErr(annResult)) {
        debouncedRebuildCategoryAnnouncement(this.client, ctf, challenge.category, annResult.value);
      }

      await interaction.reply({
        content: t('reply.reactivated_challenge', lang).replace('{name}', challenge.name),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const roles = interaction.member.roles.valueOf() as Collection<string, Role>;
    if (challenge.solved && roles.values().some((r) => r.name === 'tryout')) {
      await interaction.reply({
        content: t('error.tryout_solved', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const addResult = await this.client.challengeService.addWorker(
      ctf,
      challenge._id,
      userId,
    );
    if (isErr(addResult)) {
      await interaction.reply({
        content: `❌ ${addResult.error.message}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 스레드에 참여 메시지
    const threadResult = await fetchThreadChannel(
      interaction.client,
      challenge.thread,
      '챌린지 스레드',
    );
    if (!isErr(threadResult)) {
      await threadResult.value.send(`${interaction.user} joined.`);
    }

    // workon 메시지 임베드 업데이트
    if (challenge.workon_message) {
      try {
        const workonMsg = await interaction.channel.messages.fetch(challenge.workon_message);
        await workonMsg.edit({ embeds: [buildWorkonEmbed(challenge)] });
      } catch (error) { warnUnexpectedError('categoryworkonmenu: edit workon_message', error); }
    }

    // 카테고리 대시보드 임베드 debounced rebuild
    const annResult = await fetchTextChannelFromClient(
      this.client,
      ctf.guild_channels.announcements,
      '공지 채널',
    );
    if (!isErr(annResult)) {
      debouncedRebuildCategoryAnnouncement(this.client, ctf, challenge.category, annResult.value);
    }

    await interaction.reply({
      content: t('reply.joined_challenge', lang).replace('{name}', challenge.name),
      flags: MessageFlags.Ephemeral,
    });
  }
}

export function registerCategoryWorkonFactory(registry: ComponentRegistry): void {
  registry.registerFactory('catworkon', async (client, attachId) => {
    // attachId format: `${ctfName}::${category}`
    const sepIdx = attachId.indexOf('::');
    const ctfName = attachId.slice(0, sepIdx);

    const allCTFs = client.ctfService.listActiveCTFs();
    const ctf = allCTFs.find((c) => c.name === ctfName);

    if (ctf) {
      new CategoryWorkonMenu(
        { client, attachId, timeout: null },
        ctfName,
      );
      log.debug('Restored catworkon menu: %s::%s', ctfName, attachId.slice(sepIdx + 2));
      return true;
    }

    return false;
  });
}
