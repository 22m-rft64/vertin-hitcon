import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import { Component, ComponentInit } from '@discordutils/components/component';
import { CTF } from '@core/models/CTF';
import { CredentialsForm } from '@discordutils/components/modals/credentials';
import { createLogger } from '@discordutils/logger';

const log = createLogger('Credentials');

export class CredentialsAddButton extends Component<ButtonInteraction> {
  static override actionName = 'credentials_add';

  ctf: CTF;
  url: string;

  constructor(init: ComponentInit, ctf: CTF, url: string) {
    super(init);
    this.ctf = ctf;
    this.url = url;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setEmoji('🔑')
      .setLabel('Add existing credentials')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const { url } = this;
    try {
      const modalForm = new CredentialsForm(
        { client: this.client, attachId: `${Date.now()}::login`, timeout: 300 },
        {
          url,
          ctfName: this.ctf.name,
        },
      );

      await interaction.showModal(modalForm.build());
    } catch (error) {
      await interaction.deferUpdate();
      let errmsg: string;
      if (error instanceof Error) {
        if (error.message.includes('Invalid URL')) {
          errmsg = t('config.url_format_error', lang);
        } else if (
          error.name === 'ClientError' ||
          error.message.includes('Could not communicate')
        ) {
          errmsg = t('error.unexpected', lang);
        }
      } else {
        errmsg = 'unexpected error on addcreds';
      }

      log.error(errmsg, error);

      await interaction.editReply({
        content: errmsg,
        embeds: [],
        components: [],
      });
    }
  }
}

export class CredentialsRegisterButton extends Component<ButtonInteraction> {
  static override actionName = 'credentials_register';

  ctf: CTF;
  url: string;

  constructor(init: ComponentInit, ctf: CTF, url: string) {
    super(init);
    this.ctf = ctf;
    this.url = url;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setEmoji('➕')
      .setLabel('Register new credentials')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const { url } = this;
    try {
      const modalForm = new CredentialsForm(
        { client: this.client, attachId: `${Date.now()}::register`, timeout: 300 },
        {
          url,
          ctfName: this.ctf.name,
        },
      );

      await interaction.showModal(modalForm.build());
    } catch (error) {
      await interaction.deferUpdate();
      let errmsg: string;
      if (error instanceof Error) {
        if (error.message.includes('Invalid URL')) {
          errmsg = t('config.url_format_error', lang);
        } else if (
          error.name === 'ClientError' ||
          error.message.includes('Could not communicate')
        ) {
          errmsg = t('error.unexpected', lang);
        }
      } else {
        errmsg = 'unexpected error on addcreds';
      }

      log.error(errmsg, error);

      await interaction.editReply({
        content: errmsg,
        embeds: [],
        components: [],
      });
    }
  }
}
