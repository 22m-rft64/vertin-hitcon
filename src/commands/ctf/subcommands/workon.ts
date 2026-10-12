import {
  Collection,
  MessageFlags,
  Role,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { ChallengeAutocompletion } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import {
  fetchTextChannel,
  findCtfByInteraction,
} from "@discordutils/ctf/safefetch";
import { createLogger } from "@discordutils/logger";

const audit = createLogger('Audit:CTF');

const WorkonChallenge: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("workon")
    .setDescription("Join a challenge thread.")
    .setDescriptionLocalizations({ ko: '문제 스레드에 참여해.', ja: '問題スレッドに参加する。', fi: 'Liity haasteketjuun.' })
    .addStringOption((opt) =>
      opt
        .setName("challname")
        .setDescription("Challenge name. Case-insensitive.")
        .setDescriptionLocalizations({ ko: '문제 이름. 대소문자 무관.', ja: '問題名。大文字小文字は問わない。', fi: 'Haasteen nimi. Ei kirjainkokoherkkä.' })
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addBooleanOption((opt) =>
      opt
        .setName("all")
        .setDescription("Whether to join all challenges.")
        .setDescriptionLocalizations({ ko: '전체 문제에 참여할지 여부.', ja: '全問題に参加するかどうか。', fi: 'Liitytäänkö kaikkiin haasteisiin.' }),
    ),
  autocomplete: ChallengeAutocompletion,
  //나중에 CTF 구조에 categorys: string[] 추가해서 이거에 Autocompletion 지원하게끔
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString("challname", true);
    const all = interaction.options.getBoolean("all", false) ?? false;

    const ctfResult = await findCtfByInteraction(interaction, client.ctfService);
    if (isErr(ctfResult)) {
      return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
    }
    const ctf = ctfResult.value;
    if (!ctf) {
      return Err(
        new SlashCommandError(t('error.not_in_ctf_channel', lang)),
      );
    }
    if (ctf.archived) {
      return Err(new SlashCommandError(t('error.archived_ctf', lang)));
    }

    if (all) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const challs = Array.from(ctf.challenges.values());
      let addedCount = 0;

      for (const ch of challs) {
        if (ch.players.includes(interaction.user.id)) continue;

        // 휴식 중이면 복귀
        if (ch.idleWorkers.includes(interaction.user.id)) {
          await client.challengeService.reactivateWorker(ctf, ch._id, interaction.user.id, true);
          addedCount += 1;
          continue;
        }

        await client.challengeService.addWorker(ctf, ch._id, interaction.user.id, true);
        addedCount += 1;
      }

      if (addedCount > 0) {
        audit.info(
          '%s (%s) joined all challenges in "%s" (%d added)',
          interaction.user.username,
          interaction.user.id,
          ctf.name,
          addedCount,
        );
      }

      // feed 요약 메시지 한 번만
      if (addedCount > 0 && ctf.guild_channels.feed) {
        const feedResult = await fetchTextChannel(
          interaction.guild,
          ctf.guild_channels.feed,
          'feed channel',
        );
        if (!isErr(feedResult)) {
          await feedResult.value.send(
            t('msg.workon_all', 'en')
              .replace('{user}', `<@${interaction.user.id}>`)
              .replace('{count}', String(addedCount)),
          );
        }
      }

      await interaction.editReply({
        content: t('cmd.ctf.workon.success_all', lang).replace('{count}', String(addedCount)),
      });
      return Ok(void 0);
    }

    const challenge = client.challengeService.findByName(ctf, name);
    if (!challenge) {
      return Err(new SlashCommandError(t('error.challenge_not_found', lang)));
    }

    if (challenge.players.includes(interaction.user.id)) {
      return Err(new SlashCommandError(t('error.already_working', lang)));
    }

    // 휴식 중이면 복귀
    if (challenge.idleWorkers.includes(interaction.user.id)) {
      const reactivateResult = await client.challengeService.reactivateWorker(
        ctf,
        challenge._id,
        interaction.user.id,
      );
      if (isErr(reactivateResult)) {
        return Err(new SlashCommandError(t('cmd.ctf.workon.error_add', lang)));
      }

      audit.info(
        '%s (%s) reactivated on "%s" in "%s"',
        interaction.user.username,
        interaction.user.id,
        challenge.name,
        ctf.name,
      );

      await interaction.reply({
        content: t('reply.reactivated_challenge', lang).replace('{name}', challenge.name),
        flags: MessageFlags.Ephemeral,
      });
      return Ok(void 0);
    }

    const roles = interaction.member.roles.valueOf() as Collection<
      string,
      Role
    >;
    if (challenge.solved && roles.values().some((r) => r.name === "tryout")) {
      return Err(
        new SlashCommandError(t('cmd.ctf.workon.error_tryout', lang)),
      );
    }

    const addResult = await client.challengeService.addWorker(
      ctf,
      challenge._id,
      interaction.user.id,
    );
    if (isErr(addResult)) {
      return Err(new SlashCommandError(t('cmd.ctf.workon.error_add', lang)));
    }

    audit.info(
      '%s (%s) working on "%s" in "%s"',
      interaction.user.username,
      interaction.user.id,
      challenge.name,
      ctf.name,
    );

    await interaction.reply({
      content: t('cmd.ctf.workon.success', lang).replace('{name}', challenge.name),
      flags: MessageFlags.Ephemeral,
    });

    return Ok(void 0);
  },
};

export default WorkonChallenge;
