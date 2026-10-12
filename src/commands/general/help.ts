import {
  SlashCommand,
  SlashCommandType,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { reactionpages } from '@discordutils/components/buttons/pagenavigation';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Ok } from '@discordtypes/result';
import { t, resolveLocale, type SupportedLang } from '@i18n/index';

const help: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription("I'll walk you through.")
    .setDescriptionLocalizations({ ko: '사용법을 안내해줄게', ja: '使い方を案内する。', fi: 'Opastan sinut läpi.' }),
  commandType: SlashCommandType.General,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const embeds = [
      introEmbed(lang),
      joinEmbed(lang),
      workonEmbed(lang),
      solveEmbed(lang),
      profileEmbed(lang),
      tipsEmbed(lang),
    ];

    await reactionpages(client, interaction, embeds, false, true, 600);
    return Ok(void 0);
  },
};

export const introEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.intro_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.intro_body', lang));

export const joinEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.join_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.join_body', lang));

export const workonEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.workon_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.workon_body', lang));

export const solveEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.solve_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.solve_body', lang));

export const profileEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.profile_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.profile_body', lang));

export const tipsEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.help.tips_title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.help.tips_body', lang));

export default help;
