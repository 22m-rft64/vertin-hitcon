import { DiscordEvent } from "@discordtypes/event";
import { Events } from "discord.js";

const autocompleteInteractionEvent: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction): Promise<void> {
    if (!interaction.isAutocomplete()) return;
    await client.commandHandler.handleAutocompletion(interaction, client);
  },
};

export default autocompleteInteractionEvent;
