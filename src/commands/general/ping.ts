import {
  SlashCommand,
  SlashCommandType,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { createLogger } from "@discordutils/logger";
import { t, resolveLocale } from '@i18n/index';

const log = createLogger('Command');
import { SlashCommandBuilder } from "discord.js";
import { Ok, Err } from "@discordtypes/result";

const ping: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether I'm still here.")
    .setDescriptionLocalizations({ ko: '살아있는지 확인해볼까', ja: '生きてるか確認する。', fi: 'Tarkista olenko vielä paikalla.' }),
  commandType: SlashCommandType.General,
  execute: async (
    client,
    interaction,
  ): Promise<Result<void, SlashCommandError>> => {
    try {
      const lang = resolveLocale(interaction.locale);
      const latency = Math.abs(Date.now() - interaction.createdTimestamp);
      await interaction.reply(t('cmd.ping.reply', lang).replace('{ms}', String(latency)));

      return Ok(void 0);
    } catch (error) {
      log.error('ping command error', error);
      return Err(
        new SlashCommandError(t('cmd.ping.error', resolveLocale(interaction.locale))),
      );
    }
  },
};

export default ping;
