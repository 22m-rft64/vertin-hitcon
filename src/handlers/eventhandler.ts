// handlers/eventHandler.ts
import { ClientEvents } from "discord.js";
import { VertinClient } from "@discordutils/vertinclient";
import { DiscordEvent } from "@discordtypes/event";
import { createLogger } from "@discordutils/logger";
import { isEventInScope } from "@discordutils/guildscope";
import fs from "fs";
import path from "path";

const log = createLogger('EventHandler');

export const registerEventHandlers = async (client: VertinClient): Promise<void> => {
  const eventsPath = path.join(__dirname, "../events");

  const files = fs.readdirSync(eventsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of files) {
    const { default: event }: { default: DiscordEvent<keyof ClientEvents> } =
      await import(path.join(eventsPath, file));

    if (event.once) {
      client.once(event.name, async (...args) => {
        if (!isEventInScope(args, process.env.GUILD_ID)) return;
        try {
          await event.execute(client, ...args);
        } catch (error) {
          log.error('%s: %O', event.name, error);
        }
      });
    } else {
      client.on(event.name, async (...args) => {
        if (!isEventInScope(args, process.env.GUILD_ID)) return;
        try {
          await event.execute(client, ...args);
        } catch (error) {
          log.error('%s: %O', event.name, error);
        }
      });
    }
  }
};
