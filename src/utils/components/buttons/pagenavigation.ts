import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { VertinClient } from '@discordutils/vertinclient';

class PageNavigationHandler {
  private pages: EmbedBuilder[];
  private userId: string;
  private prefix: string;
  private client: VertinClient;

  private currentPage = 0;
  private maxPage: number;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    client: VertinClient,
    interaction: ButtonInteraction | CommandInteraction,
    pages: EmbedBuilder[],
    timeout: number,
  ) {
    this.client = client;
    this.pages = pages;
    this.userId = interaction.user.id;
    this.maxPage = pages.length - 1;
    this.prefix = `pagenav_${interaction.id}`;

    const actions = ['toStartPage', 'previous', 'next', 'toEndPage'];
    for (const action of actions) {
      const customId = `${this.prefix}_${action}`;
      this.client.componentRegistry.register(customId, {
        execute: (i: ButtonInteraction) => this.handleButtonPress(i),
        dispose: () => {},
      });
    }

    this.timeoutId = setTimeout(() => this.dispose(), timeout);
  }

  private createActionRow(): ActionRowBuilder<ButtonBuilder> {
    const isOnlyPage = this.maxPage === 0;
    const isFirstPage = this.currentPage === 0;
    const isLastPage = this.currentPage === this.maxPage;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${this.prefix}_toStartPage`)
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isFirstPage || isOnlyPage),
      new ButtonBuilder()
        .setCustomId(`${this.prefix}_previous`)
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isFirstPage || isOnlyPage),
      new ButtonBuilder()
        .setCustomId(`${this.prefix}_next`)
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isLastPage || isOnlyPage),
      new ButtonBuilder()
        .setCustomId(`${this.prefix}_toEndPage`)
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(isLastPage || isOnlyPage),
    );
  }

  private async handleButtonPress(interaction: ButtonInteraction): Promise<void> {
    if (interaction.user.id !== this.userId) {
      await interaction.reply({
        content: 'This isn\'t yours.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const action = interaction.customId.replace(`${this.prefix}_`, '');

    switch (action) {
      case 'toStartPage':
        this.currentPage = 0;
        break;
      case 'previous':
        this.currentPage = Math.max(0, this.currentPage - 1);
        break;
      case 'next':
        this.currentPage = Math.min(this.maxPage, this.currentPage + 1);
        break;
      case 'toEndPage':
        this.currentPage = this.maxPage;
        break;
      default:
        return;
    }

    await interaction.update({
      embeds: [this.pages[this.currentPage]],
      components: [this.createActionRow()],
    });
  }

  async start(
    interaction: ButtonInteraction | CommandInteraction,
    isDeferred: boolean,
    ephemeral: boolean,
  ): Promise<void> {
    const actionRow = this.createActionRow();

    if (isDeferred) {
      await interaction.editReply({
        embeds: [this.pages[0]],
        components: [actionRow],
      });
    } else {
      await interaction.reply({
        embeds: [this.pages[0]],
        components: [actionRow],
        flags: ephemeral ? MessageFlags.Ephemeral : undefined,
      });
    }
  }

  dispose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const actions = ['toStartPage', 'previous', 'next', 'toEndPage'];
    for (const action of actions) {
      this.client.componentRegistry.unregister(`${this.prefix}_${action}`);
    }
  }
}

export async function reactionpages(
  client: VertinClient,
  interaction: ButtonInteraction | CommandInteraction,
  pages: EmbedBuilder[],
  isDeferred: boolean = false,
  ephemeral: boolean = false,
  timeout: number = 300,
): Promise<PageNavigationHandler> {
  if (!interaction) {
    throw new ReferenceError('interaction must be defined');
  }

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    throw new SyntaxError('pages must be a non-empty array');
  }

  const handler = new PageNavigationHandler(
    client,
    interaction,
    pages,
    timeout * 1000,
  );
  await handler.start(interaction, isDeferred, ephemeral);
  return handler;
}
