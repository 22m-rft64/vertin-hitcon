import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { Component, AnySelectMenuBuilder, ComponentInit } from '@discordutils/components/component';
import { CTF } from '@core/models/CTF';
import { CTFManageMenu } from './ctfmanagemenu';
import { PlayerManageMenu } from './playermanagemenu';
import { CredentialsManageMenu } from './credentialsmanagemenu';
import { CTFSettingsMenu } from './ctfsettingsmenu';
import { t, resolveLocale } from '@i18n/index';

enum ConfigActionType {
  CTF_MANAGE = 'ctf_manage',
  PLAYER_MANAGE = 'player_manage',
  CREDS_MANAGE = 'creds_manage',
  CTF_SETTINGS = 'ctf_settings',
}

export class CTFConfigSelectMenu extends Component<StringSelectMenuInteraction> {
  static override actionName = 'ctf_config_menu';

  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ActionRowBuilder<AnySelectMenuBuilder> {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(this.customId)
      .setPlaceholder(t('config.menu_placeholder', 'en'))
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(t('config.menu_ctf_manage', 'en'))
          .setDescription(t('config.menu_ctf_manage_desc', 'en'))
          .setValue(ConfigActionType.CTF_MANAGE)
          .setEmoji('🛠️'),
        new StringSelectMenuOptionBuilder()
          .setLabel(t('config.menu_player_manage', 'en'))
          .setDescription(t('config.menu_player_manage_desc', 'en'))
          .setValue(ConfigActionType.PLAYER_MANAGE)
          .setEmoji('👥'),
        new StringSelectMenuOptionBuilder()
          .setLabel(t('config.menu_creds_manage', 'en'))
          .setDescription(t('config.menu_creds_manage_desc', 'en'))
          .setValue(ConfigActionType.CREDS_MANAGE)
          .setEmoji('🔑'),
        new StringSelectMenuOptionBuilder()
          .setLabel(t('config.menu_ctf_settings', 'en'))
          .setDescription(t('config.menu_ctf_settings_desc', 'en'))
          .setValue(ConfigActionType.CTF_SETTINGS)
          .setEmoji('⚙️'),
      );

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  }

  async execute(interaction: StringSelectMenuInteraction): Promise<void> {
    await interaction.deferUpdate();

    const lang = resolveLocale(interaction.locale);
    const selectedValue = interaction.values[0] as ConfigActionType;

    const init: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 600,
    };

    switch (selectedValue) {
      case ConfigActionType.CTF_MANAGE: {
        const [ctfManageEmbed, ctfManageButtonActionRows] = CTFManageMenu(
          init,
          this.ctf,
          lang,
        );
        await interaction.editReply({
          embeds: [ctfManageEmbed],
          components: [...ctfManageButtonActionRows],
        });
        break;
      }

      case ConfigActionType.PLAYER_MANAGE: {
        const [playerManageEmbed, playerManageButtonActionRow] =
          PlayerManageMenu(init, this.ctf);
        await interaction.editReply({
          embeds: [playerManageEmbed],
          components: [playerManageButtonActionRow],
        });
        break;
      }

      case ConfigActionType.CREDS_MANAGE: {
        const [credentialsManageEmbed, credentialsManageButtonActionRow] =
          await CredentialsManageMenu(init, this.ctf);
        await interaction.editReply({
          embeds: [credentialsManageEmbed],
          components: [credentialsManageButtonActionRow],
        });
        break;
      }

      case ConfigActionType.CTF_SETTINGS: {
        const [settingsEmbed, settingsRows] = CTFSettingsMenu(init, this.ctf, lang);
        await interaction.editReply({
          embeds: [settingsEmbed],
          components: [...settingsRows],
        });
        break;
      }
    }
  }
}
