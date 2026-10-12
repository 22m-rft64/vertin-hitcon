import { Component, ComponentInit } from '@discordutils/components/component';
import { CTF } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import {
  fetchCategoryChannel,
  fetchRole,
} from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { createLogger } from '@discordutils/logger';

const audit = createLogger('Audit:CTF');
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

export class CTFRenameButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_rename';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.button_rename', 'en'))
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✏️');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalId = `ctf_rename_modal_${interaction.id}`;

    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(t('config.rename_modal_title', lang).replace('{name}', this.ctf.name));

    const newNameInput = new TextInputBuilder()
      .setCustomId('newName')
      .setLabel(t('config.rename_modal_label', lang))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex) HITCON CTF 2026... CTFTime name..')
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

    await submission.deferReply({ flags: MessageFlags.Ephemeral });

    const oldName = this.ctf.name;
    const newName = submission.fields.getTextInputValue('newName');

    // 스케줄 이벤트 이름 변경
    try {
      const events = await this.client.guild.scheduledEvents.fetch();
      await events.find((ev) => ev.name === oldName)?.edit({ name: newName });
    } catch (e) {
      warnUnexpectedError('rename: scheduled event', e);
    }

    // DB 업데이트
    const updateResult = await this.client.ctfService.updateCTF(this.ctf.name, { name: newName });
    if (isErr(updateResult)) {
      await submission.editReply({
        content: t('config.rename_error', lang).replace('{error}', updateResult.error.message),
      });
      return;
    }

    audit.info(
      '%s (%s) renamed CTF "%s" → "%s"',
      interaction.user.username,
      interaction.user.id,
      oldName,
      newName,
    );

    // 카테고리 채널 + 역할 이름 변경 (Discord 쪽)
    const discordFailures: string[] = [];

    const categoryResult = await fetchCategoryChannel(
      interaction.guild,
      this.ctf.guild_category,
      'CTF category',
    );
    if (isErr(categoryResult)) {
      discordFailures.push('category channel not found');
    } else {
      try {
        await categoryResult.value.edit({
          name: categoryResult.value.name.replace(oldName, newName),
        });
      } catch (e) {
        warnUnexpectedError('rename: category edit', e);
        discordFailures.push('category channel rename failed');
      }
    }

    const roleResult = await fetchRole(
      interaction.guild,
      this.ctf.guild_role,
      'CTF role',
    );
    if (!isErr(roleResult)) {
      try { await roleResult.value.edit({ name: newName }); }
      catch (e) {
        warnUnexpectedError('rename: role edit', e);
        discordFailures.push('role rename failed');
      }
    }

    if (discordFailures.length > 0) {
      await submission.editReply({
        content: t('config.rename_discord_warning', lang)
          .replace('{name}', newName)
          .replace('{failures}', discordFailures.map((f) => `- ${f}`).join('\n')),
      });
    } else {
      await submission.editReply({
        content: t('config.rename_success', lang).replace('{name}', newName),
      });
    }
  }
}
