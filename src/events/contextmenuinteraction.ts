import { DiscordEvent } from '@discordtypes/event';
import { Events } from 'discord.js';

const contextMenuInteractionEvent: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction): Promise<void> {
    if (!interaction.isMessageContextMenuCommand()) return;
    await client.commandHandler.handleContextMenuCommand(interaction, client);
  },
};

export default contextMenuInteractionEvent;
