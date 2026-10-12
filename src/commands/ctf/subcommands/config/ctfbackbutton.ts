import { Component, ComponentInit } from '@discordutils/components/component';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { configHomeEmbed } from '.';
import { CTFConfigSelectMenu } from './ctfconfigselectmenu';
import { t, resolveLocale } from '@i18n/index';

export class CTFBackButton extends Component<ButtonInteraction> {
  static override actionName = 'ctf_back';

  constructor(init: ComponentInit) {
    super(init);
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(t('config.back_button', 'en'))
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const lang = resolveLocale(interaction.locale);
    const configMenu = this.client.componentRegistry.get(
      `ctf_config_menu::${this.attachId}`,
    ) as CTFConfigSelectMenu | undefined;
    if (!configMenu) {
      await interaction.editReply({
        content: t('config.session_expired', lang),
        embeds: [],
        components: [],
      });
      return;
    }
    const configEmbed = configHomeEmbed(lang);
    await interaction.editReply({
      embeds: [configEmbed],
      components: [configMenu.build()],
    });
  }
}
