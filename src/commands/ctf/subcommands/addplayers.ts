import {
  GuildMember,
  GuildMemberRoleManager,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { CTF } from "@core/models/CTF";
import { ActivatedCTFName } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { fetchTextChannel, findCtfByInteraction } from "@discordutils/ctf/safefetch";
import { createLogger } from "@discordutils/logger";

const audit = createLogger('Audit:Member');

const AddplayersCTF: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("addplayers")
    .setDescription("Add a member to the CTF directly.")
    .setDescriptionLocalizations({ ko: '멤버를 CTF에 직접 추가해.', ja: 'メンバーをCTFに直接追加する。', fi: 'Lisää jäsen CTF:ään suoraan.' })
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Member to add.")
        .setDescriptionLocalizations({ ko: '추가할 멤버.', ja: '追加するメンバー。', fi: 'Lisättävä jäsen.' })
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("ctfname")
        .setDescription("CTF name.")
        .setDescriptionLocalizations({ ko: 'CTF 이름.', ja: 'CTF名。', fi: 'CTF:n nimi.' })
        .setAutocomplete(true),
    ),
  permissions: new PermissionsBitField(["ManageChannels", "ManageRoles"]),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString("ctfname");
    const member = interaction.options.getMember("user");
    if (!member) {
      return Err(
        new SlashCommandError(t('cmd.ctf.addplayers.error_member_not_found', lang)),
      );
    }

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

    if (ctf.archived) {
      return Err(new SlashCommandError(t('error.archived_ctf', lang)));
    }

    const role = await interaction.guild.roles.fetch(ctf.guild_role);
    if (!role) {
      return Err(
        new SlashCommandError(t('error.ctf_role_not_found', lang)),
      );
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

    const targetMember = member as GuildMember;
    audit.info(
      '%s (%s) added %s (%s) to "%s"',
      interaction.user.username,
      interaction.user.id,
      targetMember.user.username,
      targetMember.user.id,
      ctf.name,
    );

    await interaction.editReply({
      content: t('cmd.ctf.addplayers.success', lang).replace('{member}', `${member}`),
    });

    await ctfGeneralChannel.send(t('msg.user_joined', 'en').replace('{user}', `${member}`));

    return Ok(void 0);
  },
};

export default AddplayersCTF;
