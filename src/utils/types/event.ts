import { ClientEvents } from "discord.js";
import { VertinClient } from "@discordutils/vertinclient";

export interface DiscordEvent<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (
    client: VertinClient,
    ...args: ClientEvents[K]
  ) => Promise<void> | void;
}

// 나중에 ctfTime Event Handling type도 추가
