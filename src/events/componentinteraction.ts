import { DiscordEvent } from '@discordtypes/event';
import { Events } from 'discord.js';

const componentInteractionEvent: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction): Promise<void> {
    if (
      interaction.isButton() ||
      interaction.isAnySelectMenu() ||
      interaction.isModalSubmit()
    ) {
      await client.componentRegistry.dispatch(interaction);
    }
  },
};

export default componentInteractionEvent;
