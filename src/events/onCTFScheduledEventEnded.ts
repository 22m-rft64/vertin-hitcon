import { DiscordEvent } from "@discordtypes/event";
import {
  Events,
  GuildScheduledEventStatus,
  MessageFlags,
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

const onCTFScheduledEventEnded: DiscordEvent<Events.GuildScheduledEventUpdate> =
  {
    name: Events.GuildScheduledEventUpdate,
    once: false,
    async execute(client, before, after): Promise<void> {
      if (
        !(
          before.status === GuildScheduledEventStatus.Active &&
          after.status === GuildScheduledEventStatus.Completed
        )
      )
        return;

      const eventName = after.name;
      log.info('CTF %s has ended', eventName);

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
        t('event.ctf_ended', 'en').replace('{role}', roleMention),
      );

      const categoryResult = await fetchCategoryChannel(
        client.guild,
        ctf.guild_category,
        'CTF category',
      );
      if (isOk(categoryResult)) {
        await categoryResult.value.edit({
          name: categoryResult.value.name.replace("🔴", "🏁"),
        });
      }

      await client.ctfService.updateCTF(ctf.name, { ended: true, ended_at: new Date() });

      log.info('Refreshing thread visibility in CTF %s', eventName);
      const validChallenges = Array.from(ctf.challenges.values())
        .filter((challenge) => challenge.thread);

      const membersMention = isOk(roleResult)
        ? Array.from(roleResult.value.members.values())
          .map((gm) => `<@${gm.id}>`)
          .join(', ')
        : '';

      if (membersMention) {
        for (const challenge of validChallenges) {
          try {
            const threadChannel = await client.channels.fetch(challenge.thread);
            if (!threadChannel || !threadChannel.isThread()) {
              log.warn('Could not find thread for challenge %s', challenge.name);
              continue;
            }

            const tempmsg = await threadChannel.send({
              content: t('event.ctf_ended_thread', 'en'),
              flags: MessageFlags.SuppressNotifications,
            });
            await tempmsg.edit(membersMention);
            await tempmsg.delete();
          } catch (error) {
            log.error('Error refreshing thread for challenge %s', challenge.name, error);
          }
        }
      }

    },
  };

export default onCTFScheduledEventEnded;
