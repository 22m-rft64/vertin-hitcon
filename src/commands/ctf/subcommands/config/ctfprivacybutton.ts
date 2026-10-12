import { Component, ComponentInit } from '@discordutils/components/component';
import { CTF } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';

export class CTFPrivacyButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_privacy';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.button_privacy', 'en'))
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔒');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const { ctf } = this;
    const currentStatus = ctf.private
      ? t('config.privacy_private', lang)
      : t('config.privacy_public', lang);
    const oppositeStatus = ctf.private
      ? t('config.privacy_public', lang)
      : t('config.privacy_private', lang);
    const content = t('config.privacy_current', lang)
      .replace('{status}', currentStatus)
      .replace('{opposite}', oppositeStatus);

    const rr = new CTFPrivacyRRButton(
      { client: this.client, attachId: this.attachId, timeout: 300 },
      ctf,
    );

    await interaction.reply({
      content,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(rr.build()),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}

class CTFPrivacyRRButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_privacy_rr';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.privacy_toggle_button', 'en'))
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const lang = resolveLocale(interaction.locale);

    const updateResult = await this.client.ctfService.updateCTF(this.ctf.name, { private: !this.ctf.private });
    if (isErr(updateResult)) {
      await interaction.editReply({
        content: t('config.privacy_error', lang).replace('{error}', updateResult.error.message),
        components: [],
      });
      return;
    }
    const newStatus = this.ctf.private
      ? t('config.privacy_private', lang)
      : t('config.privacy_public', lang);
    await interaction.editReply({
      content: t('config.privacy_changed', lang)
        .replace('{name}', this.ctf.name)
        .replace('{status}', newStatus),
      components: [],
    });
  }
}
