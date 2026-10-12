import {
  GuildMemberRoleManager,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import { createLogger } from "@discordutils/logger";

const audit = createLogger('Audit:Member');
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { ActivatedCTFName } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { fetchTextChannel } from "@discordutils/ctf/safefetch";

const JoinCTF: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("join")
    .setDescription("Get notified for a CTF.")
    .setDescriptionLocalizations({ ko: 'CTF 알림을 받아.', ja: 'CTFの通知を受け取る。', fi: 'Saa CTF-ilmoituksia.' })
    .addStringOption((opt) =>
      opt
        .setName("ctfname")
        .setDescription("Name of the CTF to get notified for.")
        .setDescriptionLocalizations({ ko: '알림 받을 CTF 이름.', ja: '通知を受けるCTF名。', fi: 'CTF:n nimi josta ilmoitetaan.' })
        .setRequired(true)
        .setAutocomplete(true),
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString("ctfname", true);

    const ctfResult = await client.ctfService.getCTF({ name });
    if (isErr(ctfResult)) {
      return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
    }
    const ctf = ctfResult.value;

    if (!ctf) {
      await interaction.reply({
        content: t('error.ctf_not_found', lang),
        flags: MessageFlags.Ephemeral,
      });
      return Ok(void 0);
    }
    if (ctf.archived) {
      return Err(new SlashCommandError(t('error.archived_ctf', lang)));
    }

    const role = await interaction.guild.roles.fetch(ctf.guild_role);
    if (!role) {
      return Err(
        new SlashCommandError(t('error.ctf_role_not_found', lang)),
      );
    }

    //already joined exception
    if (role.members.get(interaction.user.id)) {
      return Err(new SlashCommandError(t('error.already_joined', lang)));
    }

    await interaction.deferReply();

    const generalResult = await fetchTextChannel(
      interaction.guild,
      ctf.guild_channels.general,
      'general channel',
    );
    if (isErr(generalResult)) {
      return Err(new SlashCommandError(generalResult.error.message));
    }
    const ctfGeneralChannel = generalResult.value;

    //assume types are GuildMember, not APIInteractionGuildMember.
    await (interaction.member.roles as GuildMemberRoleManager).add(role);

    audit.info(
      '%s (%s) joined "%s"',
      interaction.user.username,
      interaction.user.id,
      ctf.name,
    );

    await interaction.editReply({
      content: t('cmd.ctf.join.success', lang).replace('{ctfName}', ctf.name),
    });

    await ctfGeneralChannel.send(t('msg.user_joined', 'en').replace('{user}', `${interaction.user}`));

    return Ok(void 0);
  },
};

export default JoinCTF;
