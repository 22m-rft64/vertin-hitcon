import "dotenv/config";

import { VertinClient } from "@discordutils/vertinclient";
import { createLogger } from "@discordutils/logger";

const log = createLogger('Bot');
const client = new VertinClient();

client.once("ready", async () => {
  log.info('Logged in as %s', client.user?.tag);
  await client.init();
});

client.login(process.env.DISCORD_TOKEN);
