import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import {
  SlashCommandError,
  SlashCommandSubCommand,
} from '@discordtypes/slashcommand';
import { ComponentInit } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTFConfigSelectMenu } from './ctfconfigselectmenu';
import { Ok, Err, isErr, Result } from '@discordtypes/result';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { CTFDeleteButton } from './ctfdeletebutton';
import { CTFDeleteChannelsButton } from './ctfdeletechannelsbutton';
import { t, resolveLocale, SupportedLang } from '@i18n/index';

const ctfConfig: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('config')
    .setDescription(t('cmd.ctf.config.description', 'en')),
  permissions: new PermissionsBitField([
    'ManageRoles',
    'ManageChannels',
    'ManageMessages',
  ]),
  execute: async (
    client,
    interaction,
  ): Promise<Result<void, SlashCommandError>> => {
    const lang = resolveLocale(interaction.locale);
    const ctfResult = await findCtfByInteraction(interaction, client.ctfService);
    if (isErr(ctfResult)) {
      return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
    }
    const ctf = ctfResult.value;
    if (!ctf) {
      return Err(
        new SlashCommandError(t('error.not_in_ctf_channel', lang)),
      );
    }

    const configEmbed = configHomeEmbed(lang, ctf.archived);

    const init: ComponentInit = {
      client,
      attachId: interaction.id,
      timeout: 1800,
    };
    const deleteButton = new CTFDeleteButton(init, ctf).build();
    if (ctf.archived) {
      const deleteChannelsButton = new CTFDeleteChannelsButton(init, ctf).build();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        deleteChannelsButton,
        deleteButton,
      );
      await interaction.reply({
        embeds: [configEmbed],
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    } else {
      const configMenu = new CTFConfigSelectMenu(init, ctf).build();
      await interaction.reply({
        embeds: [configEmbed],
        components: [configMenu],
        flags: MessageFlags.Ephemeral,
      });
    }

    return Ok(void 0);
  },
};

export const configHomeEmbed = (lang: SupportedLang = 'en', archived: boolean = false) => {
  return archived
    ? new EmbedBuilder()
        .setColor(VERTIN_COLOR)
        .setTitle(t('config.archived_title', lang))
        .setDescription(t('config.archived_description', lang))
    : new EmbedBuilder()
        .setColor(VERTIN_COLOR)
        .setTitle(t('config.home_title', lang))
        .setDescription(t('config.home_description', lang))
        .addFields(
          {
            name: t('config.field_ctf_manage', lang),
            value: t('config.field_ctf_manage_value', lang),
            inline: false,
          },
          {
            name: t('config.field_player_manage', lang),
            value: t('config.field_player_manage_value', lang),
            inline: false,
          },
          {
            name: t('config.field_creds_manage', lang),
            value: t('config.field_creds_manage_value', lang),
            inline: false,
          },
        )
        .setFooter({ text: t('config.footer_30m', lang) });
};

export default ctfConfig;
