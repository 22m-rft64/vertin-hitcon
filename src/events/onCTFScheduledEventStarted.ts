import { DiscordEvent } from "@discordtypes/event";
import {
  Events,
  GuildScheduledEventStatus,
} from "discord.js";
import { isErr, isOk } from "@discordtypes/result";
import {
  fetchCategoryChannel,
  fetchRole,
  fetchTextChannel,
} from "@discordutils/ctf/safefetch";
import { createLogger } from "@discordutils/logger";
import { t } from '@i18n/index';

const log = createLogger('CTFEvent');

const onCTFScheduledEventStarted: DiscordEvent<Events.GuildScheduledEventUpdate> =
  {
    name: Events.GuildScheduledEventUpdate,
    once: false,
    async execute(client, before, after): Promise<void> {
      if (
        !(
          before.status === GuildScheduledEventStatus.Scheduled &&
          after.status === GuildScheduledEventStatus.Active
        )
      )
        return;

      const eventName = after.name;
      log.info('CTF %s has started', eventName);

      const ctfResult = await client.ctfService.getCTF({ name: eventName });

      if (isErr(ctfResult)) {
        log.error('Error fetching CTF: %s', ctfResult.error.message);
        return;
      }

      const ctf = ctfResult.value;
      if (!ctf) {
        log.warn('Could not find CTF with name: %s', eventName);
        return;
      }

      const generalResult = await fetchTextChannel(
        client.guild,
        ctf.guild_channels.general,
        'general channel',
      );
      if (isErr(generalResult)) {
        log.error(generalResult.error.message);
        return;
      }

      const roleResult = await fetchRole(
        client.guild,
        ctf.guild_role,
        'CTF role',
      );

      const roleMention = isOk(roleResult) ? `${roleResult.value}` : '@CTF';
      await generalResult.value.send(
        t('event.ctf_started', 'en').replace('{role}', roleMention),
      );

      await client.ctfService.updateCTF(ctf.name, { start_at: new Date() });

      const categoryResult = await fetchCategoryChannel(
        client.guild,
        ctf.guild_category,
        'CTF category',
      );
      if (isOk(categoryResult)) {
        await categoryResult.value.edit({
          name: categoryResult.value.name.replace("⏰", "🔴"),
        });
      }
    },
  };

export default onCTFScheduledEventStarted;
