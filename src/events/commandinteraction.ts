import { DiscordEvent } from "@discordtypes/event";
import { Events } from "discord.js";

const commandInteractionEvent: DiscordEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    await client.commandHandler.handleCommand(interaction, client);
  },
};

export default commandInteractionEvent;
