import { ComponentInit } from '@discordutils/components/component';
import { Component } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTF } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { createLogger } from '@discordutils/logger';
import { t } from '@i18n/index';

const audit = createLogger('Audit:CTF');
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  CredentialsAddButton,
  CredentialsRegisterButton,
} from '../assign/ctfcredentialsbutton';

export async function CredentialsManageMenu(
  init: ComponentInit,
  ctf: CTF,
): Promise<[EmbedBuilder, ActionRowBuilder<ButtonBuilder>]> {
  let embedDescription = t('config.creds_no_creds', 'en');

  if (ctf.credentials.url) {
    embedDescription = `CTF URL: ${ctf.credentials.url}`;

    const embed = new EmbedBuilder()
      .setColor(VERTIN_COLOR)
      .setTitle(`🔑 ${t('config.creds_title', 'en')}`)
      .setDescription(embedDescription)
      .addFields({
        name: t('config.creds_field_existing', 'en'),
        value: t('config.creds_field_existing_value', 'en'),
        inline: false,
      })
      .addFields({
        name: t('config.creds_field_new', 'en'),
        value: t('config.creds_field_new_value', 'en'),
        inline: false,
      })
      .setFooter({ text: t('config.footer_10m', 'en') });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new CredentialsUrlAddButton(init, ctf).build(),
      new CredentialsAddButton(init, ctf, ctf.credentials.url).build(),
      new CredentialsRegisterButton(init, ctf, ctf.credentials.url).build(),
    );

    return [embed, row1];
  }

  const embed = new EmbedBuilder()
    .setColor(VERTIN_COLOR)
    .setTitle(`🔑 ${t('config.creds_title', 'en')}`)
    .setDescription(
      `${embedDescription}\n${t('config.creds_need_url', 'en')}`,
    )
    .setFooter({ text: t('config.footer_10m', 'en') });
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new CredentialsUrlAddButton(init, ctf).build(),
  );

  return [embed, row];
}

class CredentialsUrlAddButton extends Component<ButtonInteraction> {
  static override actionName = 'credentials_url_add';

  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setEmoji('🔗')
      .setLabel('Register CTF URL')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const modalId = `credentials_url_modal_${interaction.id}`;
    const modal = new ModalBuilder()
      .setTitle(t('config.creds_url_modal_title', 'en'))
      .setCustomId(modalId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('ctfurl')
            .setPlaceholder('https://ctflink...')
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setLabel('CTF URL'),
        ),
      );

    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) => i.customId === modalId;
    const submission = await interaction
      .awaitModalSubmit({ filter, time: 300_000 })
      .catch(() => null);
    if (!submission) return;

    await submission.deferUpdate();
    const urlRegex =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    const ctfUrlInput = submission.fields.getTextInputValue('ctfurl');

    if (!urlRegex.test(ctfUrlInput)) {
      await submission.followUp({
        content: t('config.url_format_error', 'en'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const updateResult = await this.client.ctfService.updateCTF(this.ctf.name, {
      credentials: {
        ...this.ctf.credentials,
        url: ctfUrlInput,
      },
    });

    audit.info(
      '%s (%s) registered URL for "%s": %s',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      ctfUrlInput,
    );

    if (isErr(updateResult)) {
      await submission.followUp({
        content: t('config.creds_url_error', 'en').replace('{error}', updateResult.error.message),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const init: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 600,
    };

    const [credentialsManageEmbed, credentialsManageButtonActionRow] =
      await CredentialsManageMenu(init, this.ctf);

    try {
      await submission.editReply({
        embeds: [credentialsManageEmbed],
        components: [credentialsManageButtonActionRow],
      });
    } catch (e) {
      warnUnexpectedError('credentials: editReply', e);
    }

    await submission.followUp({
      content: t('config.url_registered', 'en'),
      flags: MessageFlags.Ephemeral,
    });
  }
}
