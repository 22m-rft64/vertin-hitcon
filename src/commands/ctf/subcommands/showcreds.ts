import { SlashCommandSubcommandBuilder } from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { CTF } from "@core/models/CTF";
import { ActivatedCTFName } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { findCtfByInteraction } from "@discordutils/ctf/safefetch";

const ShowCreds: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("showcreds")
    .setDescription("View the credentials.")
    .setDescriptionLocalizations({ ko: '접속 정보를 확인해.', ja: '接続情報を確認する。', fi: 'Näytä kirjautumistiedot.' })
    .addStringOption((opt) =>
      opt
        .setName("ctfname")
        .setDescription("CTF name. Defaults to current channel.")
        .setDescriptionLocalizations({ ko: 'CTF 이름. 기본값은 현재 채널.', ja: 'CTF名。デフォルトは現在のチャンネル。', fi: 'CTF:n nimi. Oletuksena nykyinen kanava.' })
        .setAutocomplete(true),
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString("ctfname") || null;

    let ctf: CTF | null;
    if (name) {
      const ctfResult = await client.ctfService.getCTF({ name });
      if (isErr(ctfResult)) {
        return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
      }
      ctf = ctfResult.value;
    } else {
      const ctfResult = await findCtfByInteraction(interaction, client.ctfService);
      if (isErr(ctfResult)) {
        return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
      }
      ctf = ctfResult.value;
    }

    if (!ctf) {
      return Err(
        new SlashCommandError(t('cmd.ctf.showcreds.error_need_context', lang)),
      );
    }

    await interaction.reply({ content: ctf.credentials._message });

    return Ok(void 0);
  },
};

export default ShowCreds;
