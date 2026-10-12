import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandError,
  SlashCommandSubCommand,
} from '@discordtypes/slashcommand';
import { Component, ComponentInit } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import {
  CTFConfirmButton,
  CTFEditButton,
  ctfInfoEmbed,
  CTFRawInfo,
} from './fromctfInfobutton';
import { Ok, Err, Result } from '@discordtypes/result';

const ctfAssign: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('assign')
    .setDescription('Create a new CTF.')
    .setDescriptionLocalizations({ ko: '새 CTF를 만들어.', ja: '新しいCTFを作成する。', fi: 'Luo uusi CTF.' }),
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
    const init: ComponentInit = {
      client,
      attachId: interaction.id,
      timeout: 1800,
    };
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(t('cmd.ctf.assign.embed_title', lang))
          .setDescription(t('cmd.ctf.assign.embed_description', lang))
          .setColor(VERTIN_COLOR)
          .setFooter({ text: t('cmd.ctf.assign.footer', lang) }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new directButton(init).build(),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return Ok(void 0);
  },
};

class directButton extends Component<ButtonInteraction> {
  static override actionName = 'from_direct_button';
  constructor(init: ComponentInit) {
    super(init);
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel('Create manually')
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();

    const rawInfo: CTFRawInfo = {
      name: 'Untitled CTF',
      date: [null, null],
      location: null,
      ctftimeEvent: null,
    };

    const init: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 1800,
    };

    const [fromCTFTimeEmbed, fromCTFTimeButtons] = [
      ctfInfoEmbed(rawInfo),
      [
        new CTFEditButton(init, rawInfo).build(),
        new CTFConfirmButton(init, rawInfo).build(),
      ],
    ];

    await interaction.editReply({
      content: '',
      embeds: [fromCTFTimeEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...fromCTFTimeButtons,
        ),
      ],
    });
  }
}

export default ctfAssign;
