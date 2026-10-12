import {
  SlashCommand,
  SlashCommandType,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { Ok } from '@discordtypes/result';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { Component, ComponentInit } from '@discordutils/components/component';
import { reactionpages } from '@discordutils/components/buttons/pagenavigation';
import { t, resolveLocale, type SupportedLang } from '@i18n/index';
import {
  introEmbed, joinEmbed, workonEmbed,
  solveEmbed, profileEmbed, tipsEmbed,
} from '@commands/general/help';

const about: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('A bit about me.')
    .setDescriptionLocalizations({ ko: '나에 대해 알려줄게', ja: '自分のことを少し。', fi: 'Hieman minusta.' }),
  commandType: SlashCommandType.General,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const embed = vertinEmbed(lang);
    embed.setThumbnail(client.user?.displayAvatarURL() ?? null);

    const init: ComponentInit = {
      client,
      attachId: interaction.id,
      timeout: 300,
    };
    const helpButton = new HelpButton(init, lang).build();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(helpButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
    return Ok(void 0);
  },
};

const vertinEmbed = (lang: SupportedLang): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('cmd.about.title', lang))
    .setColor(VERTIN_COLOR)
    .setDescription(t('cmd.about.body', lang));

class HelpButton extends Component<ButtonInteraction> {
  static override actionName = 'about_help';
  private lang: SupportedLang;

  constructor(init: ComponentInit, lang: SupportedLang) {
    super(init);
    this.lang = lang;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel('Help')
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const embeds = [
      introEmbed(lang),
      joinEmbed(lang),
      workonEmbed(lang),
      solveEmbed(lang),
      profileEmbed(lang),
      tipsEmbed(lang),
    ];

    await reactionpages(this.client, interaction, embeds, false, true, 600);
  }
}

export default about;
