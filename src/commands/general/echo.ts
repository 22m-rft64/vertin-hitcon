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
    .setName("echo")
    .setDescription("I'll pass it along as-is.")
    .setDescriptionLocalizations({ ko: '그대로 전달해줄게', ja: 'そのまま伝える。', fi: 'Välitän sen sellaisenaan.' })
    .addStringOption((opt) =>
      opt.setName("content").setRequired(true).setDescription("Content to relay.")
        .setDescriptionLocalizations({ ko: '전달할 내용', ja: '伝える内容。', fi: 'Välitettävä sisältö.' }),
    ),
  commandType: SlashCommandType.General,
  execute: async (
    client,
    interaction,
  ): Promise<Result<void, SlashCommandError>> => {
    try {
      const content = interaction.options.getString("content", true);

      await interaction.reply(content);

      return Ok(void 0);
    } catch (error) {
      log.error('echo command error', error);
      return Err(new SlashCommandError(t('error.unexpected', resolveLocale(interaction.locale))));
    }
  },
};

export default ping;
