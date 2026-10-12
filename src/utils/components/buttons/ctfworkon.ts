import {
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  GuildMember,
  Role,
  Collection,
  MessageFlags,
} from 'discord.js';
import { Component, ComponentInit } from '@discordutils/components/component';
import { createLogger } from '@discordutils/logger';

const log = createLogger('WorkonButton');
import { ComponentRegistry } from '@handlers/componentregistry';
import { Challenge } from '@core/models/Challenge';
import { buildWorkonEmbed, debouncedRebuildCategoryAnnouncement } from '@discordutils/ctf/discordutil';
import { isErr } from '@discordtypes/result';
import { fetchTextChannelFromClient, fetchThreadChannel } from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { t, resolveLocale } from '@i18n/index';

export class WorkonButton extends Component<ButtonInteraction> {
  static override actionName = 'workon';

  challenge: Challenge;
  ctfName: string;

  constructor(
    init: ComponentInit,
    challenge: Challenge,
    ctfName: string,
  ) {
    super(init);
    this.challenge = challenge;
    this.ctfName = ctfName;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel('Jump in')
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const { challenge } = this;

    if (!challenge) {
      await interaction.reply({
        content: t('error.challenge_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userId = interaction.user.id;

    // 이미 활성 상태면 안내
    if (challenge.players.includes(userId)) {
      await interaction.reply({
        content: t('error.already_working', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ctfResult = await this.client.ctfService.getCTF({ name: this.ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.reply({
        content: t('error.ctf_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const ctf = ctfResult.value;

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

      await this.refreshEmbeds(interaction, ctf);
      await interaction.reply({
        content: t('reply.reactivated_challenge', lang).replace('{name}', challenge.name),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // tryout 제한
    const roles = interaction.member.roles.valueOf() as Collection<string, Role>;
    if (challenge.solved && roles.values().some((r) => r.name === 'tryout')) {
      await interaction.reply({
        content: t('error.tryout_solved', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 신규 참여
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

    await this.refreshEmbeds(interaction, ctf);
    await interaction.reply({
      content: t('reply.joined_challenge', lang).replace('{name}', challenge.name),
      flags: MessageFlags.Ephemeral,
    });
  }

  private async refreshEmbeds(
    interaction: ButtonInteraction,
    ctf: ReturnType<typeof Object.create>,
  ): Promise<void> {
    const { challenge } = this;

    // workon 메시지 임베드 업데이트
    if (challenge.workon_message) {
      try {
        const workonMsg = await interaction.channel.messages.fetch(challenge.workon_message);
        await workonMsg.edit({ embeds: [buildWorkonEmbed(challenge)] });
      } catch (error) { warnUnexpectedError('ctfworkon: edit workon_message', error); }
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
  }
}

export class WorkonIdleButton extends Component<ButtonInteraction> {
  static override actionName = 'workon_idle';

  challenge: Challenge;
  ctfName: string;

  constructor(
    init: ComponentInit,
    challenge: Challenge,
    ctfName: string,
  ) {
    super(init);
    this.challenge = challenge;
    this.ctfName = ctfName;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel('Take a break')
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const { challenge } = this;

    if (!challenge) {
      await interaction.reply({
        content: t('error.challenge_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userId = interaction.user.id;

    // 활성 상태가 아니면 쉴 수 없음
    if (!challenge.players.includes(userId)) {
      if (challenge.idleWorkers.includes(userId)) {
        await interaction.reply({
          content: t('error.already_idle', lang),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: t('error.not_working', lang),
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    const ctfResult = await this.client.ctfService.getCTF({ name: this.ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.reply({
        content: t('error.ctf_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const ctf = ctfResult.value;

    const deactivateResult = await this.client.challengeService.deactivateWorker(
      ctf,
      challenge._id,
      userId,
    );
    if (isErr(deactivateResult)) {
      await interaction.reply({
        content: `❌ ${deactivateResult.error.message}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // workon 메시지 임베드 업데이트
    if (challenge.workon_message) {
      try {
        const workonMsg = await interaction.channel.messages.fetch(challenge.workon_message);
        await workonMsg.edit({ embeds: [buildWorkonEmbed(challenge)] });
      } catch (error) { warnUnexpectedError('ctfworkon_idle: edit workon_message', error); }
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
      content: t('reply.deactivated_challenge', lang).replace('{name}', challenge.name),
      flags: MessageFlags.Ephemeral,
    });
  }
}

export function registerWorkonFactory(registry: ComponentRegistry): void {
  registry.registerFactory('workon', async (client, attachId) => {
    const allCTFs = client.ctfService.listActiveCTFs();

    for (const ctf of allCTFs) {
      const challenge = ctf.challenges.get(attachId);

      if (challenge) {
        new WorkonButton(
          { client, attachId, timeout: null },
          challenge,
          ctf.name,
        );
        log.debug('Restored workon button: %s', challenge.name);
        return true;
      }
    }

    return false;
  });
}

export function registerWorkonIdleFactory(registry: ComponentRegistry): void {
  registry.registerFactory('workon_idle', async (client, attachId) => {
    const allCTFs = client.ctfService.listActiveCTFs();

    for (const ctf of allCTFs) {
      const challenge = ctf.challenges.get(attachId);

      if (challenge) {
        new WorkonIdleButton(
          { client, attachId, timeout: null },
          challenge,
          ctf.name,
        );
        log.debug('Restored workon_idle button: %s', challenge.name);
        return true;
      }
    }

    return false;
  });
}
