import { Component, ComponentInit } from '@discordutils/components/component';
import { CTF } from '@core/models/CTF';
import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { deleteCtfChannels } from '@discordutils/ctf/deletectfchannels';
import { createLogger } from '@discordutils/logger';
import { t, resolveLocale } from '@i18n/index';

const audit = createLogger('Audit:CTF');

export class CTFDeleteChannelsButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_delete_channels';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.button_delete_channels', 'en'))
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const lang = resolveLocale(interaction.locale);

    const guild = interaction.guild;
    if (!guild) return;

    await interaction.editReply({
      content: t('config.deleting_channels', lang),
      components: [],
    });

    const result = await deleteCtfChannels(guild, this.ctf);

    audit.info(
      '%s (%s) deleted channels for "%s" (%d channels)',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      result.deletedChannels,
    );

    if (result.success) {
      await interaction.editReply({
        content: t('config.channels_deleted', lang)
          .replace('{name}', this.ctf.name)
          .replace('{count}', String(result.deletedChannels)),
      });
    } else {
      const failedText = result.failedChannels.length > 0
        ? `\n⚠️ ${result.failedChannels.join(', ')}`
        : '';
      await interaction.editReply({
        content: t('config.delete_channels_partial', lang).replace('{details}', failedText),
      });
    }
  }
}
