import { Component, ComponentInit } from '@discordutils/components/component';
import { VERTIN_CTF_NOTICE_CHANNEL } from '@discordutils/vertinclient';
import { wait } from '@discordutils/wait';
import { CTF } from '@core/models/CTF';
import { isErr, isOk } from '@discordtypes/result';
import { createLogger } from '@discordutils/logger';

const log = createLogger('CTFDelete');
const audit = createLogger('Audit:CTF');
import {
  fetchCategoryChannel,
  fetchRole,
  fetchTextChannel,
} from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';

export class CTFDeleteButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_delete';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.button_delete', 'en'))
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalId = `ctf_rename_modal_${interaction.id}`;

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(t('config.delete_confirm_title', lang));

    const newNameInput = new TextInputBuilder()
      .setCustomId(`delete::${this.ctf.name}`)
      .setLabel(t('config.delete_confirm_label', lang))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(`${this.ctf.name}`)
      .setRequired(true);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      newNameInput,
    );

    modal.addComponents(firstRow);

    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) => i.customId === modalId;
    const submission = await interaction
      .awaitModalSubmit({ filter, time: 60000 })
      .catch(() => null);

    if (!submission) return;

    const name = submission.fields.getTextInputValue(
      `delete::${this.ctf.name}`,
    );

    if (name !== this.ctf.name) {
      await submission.reply({
        content: t('config.delete_name_mismatch', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await submission.deferReply();

    const failedChannels: string[] = [];

    // 채널 삭제
    try {
      const channels = await interaction.guild.channels.fetch();
      const toDelete = channels.filter(
        (channel) =>
          channel.parentId === this.ctf.guild_category &&
          interaction.channel.id !== channel.id,
      );
      const results = await Promise.allSettled(
        toDelete.map((channel) => channel?.delete()),
      );
      toDelete.forEach((ch, _key, _map) => {
        const idx = [...toDelete.values()].indexOf(ch);
        if (results[idx]?.status === 'rejected') {
          failedChannels.push(`<#${ch.id}>`);
        }
      });
    } catch (e) {
      warnUnexpectedError('ctf-delete: channel cleanup', e);
    }

    // 버튼 정리
    try {
      for (const challenge of this.ctf.challenges.values()) {
        await Component.unpersistByAction('workon', challenge._id);
        await Component.unpersistByAction('workon_idle', challenge._id);
      }
      if (this.ctf.join_msg) {
        await Component.unpersistByAction('ctfannounce_join', this.ctf.name);
      }
    } catch (e) {
      warnUnexpectedError('ctf-delete: button cleanup', e);
    }

    // 스케줄 이벤트 삭제
    try {
      const events = await this.client.guild.scheduledEvents.fetch();
      await events.find((ev) => ev.name === this.ctf.name)?.delete();
    } catch (e) {
      warnUnexpectedError('ctf-delete: scheduled event', e);
    }

    // 카테고리 삭제
    const categoryResult = await fetchCategoryChannel(
      interaction.guild,
      this.ctf.guild_category,
      'CTF 카테고리',
    );
    if (isOk(categoryResult)) {
      try { await categoryResult.value.delete(); }
      catch (e) { warnUnexpectedError('ctf-delete: category', e); }
    }

    // 역할 삭제
    const roleResult = await fetchRole(
      interaction.guild,
      this.ctf.guild_role,
      'CTF 역할',
    );
    if (isOk(roleResult)) {
      try { await roleResult.value.delete(); }
      catch (e) { warnUnexpectedError('ctf-delete: role', e); }
    }

    // 공지 메시지 삭제
    if (this.ctf.join_msg) {
      try {
        const noticeResult = await fetchTextChannel(
          this.client.guild,
          VERTIN_CTF_NOTICE_CHANNEL,
          'announcements channel',
        );
        if (isOk(noticeResult)) {
          const msg = await noticeResult.value.messages.fetch(this.ctf.join_msg);
          await msg?.delete();
        }
      } catch (e) {
        warnUnexpectedError('ctf-delete: join message', e);
      }
    }

    // DB 삭제
    const deleteResult = await this.client.ctfService.deleteCTF(this.ctf.name);
    if (isErr(deleteResult)) {
      log.error('Error deleting CTF: %s', deleteResult.error.message);
    }

    audit.info(
      '%s (%s) deleted "%s" (challenges: %d)',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      this.ctf.challenges.size,
    );

    const statusMsg = failedChannels.length > 0
      ? t('config.delete_with_failures', lang)
          .replace('{name}', this.ctf.name)
          .replace('{channels}', failedChannels.join('\n'))
      : t('config.delete_success', lang).replace('{name}', this.ctf.name);

    try {
      await submission.editReply({ content: statusMsg });
    } catch (e) {
      warnUnexpectedError('ctf-delete: reply', e);
    }

    await wait(5e3);

    try {
      const channels = await interaction.guild.channels.fetch();
      const leftChannel = channels.find((ch) => interaction.channel.id === ch.id);
      if (leftChannel) await leftChannel.delete();
    } catch (e) {
      warnUnexpectedError('ctf-delete: final channel', e);
    }
  }
}
