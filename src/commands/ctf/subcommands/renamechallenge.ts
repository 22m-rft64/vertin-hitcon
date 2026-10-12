import { SlashCommandSubcommandBuilder } from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { createLogger } from "@discordutils/logger";

const log = createLogger('Command');
const audit = createLogger('Audit:CTF');
import { sanitizeChannelName } from "@discordutils/ctf/discordutil";
import { ChallengeAutocompletion } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { fetchThreadChannel, findCtfByInteraction } from "@discordutils/ctf/safefetch";

const RenameChallenge: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("renamechallenge")
    .setDescription("Rename a challenge.")
    .setDescriptionLocalizations({ ko: '문제 이름을 변경해.', ja: '問題名を変更する。', fi: 'Nimeä haaste uudelleen.' })
    .addStringOption((opt) =>
      opt.setName("new_name").setDescription("New name.")
        .setDescriptionLocalizations({ ko: '새 이름.', ja: '新しい名前。', fi: 'Uusi nimi.' }).setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("old_name")
        .setDescription("Target challenge name.")
        .setDescriptionLocalizations({ ko: '대상 문제 이름.', ja: '対象の問題名。', fi: 'Kohdehaasteen nimi.' })
        .setAutocomplete(true),
    ),
  autocomplete: ChallengeAutocompletion,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const newName = interaction.options.getString("new_name", true);
    const oldName = interaction.options.getString("old_name");

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

    let challenge = client.challengeService.findByThread(ctf, interaction.channelId);
    if (!challenge) {
      if (!oldName) {
        return Err(
          new SlashCommandError(t('cmd.ctf.deletechallenge.error_need_target', lang)),
        );
      }

      challenge = client.challengeService.findByName(ctf, oldName);
    }

    if (!challenge) {
      return Err(new SlashCommandError(t('error.challenge_not_found', lang)));
    }

    const threadResult = await fetchThreadChannel(
      client,
      challenge.thread,
      '챌린지 스레드',
    );
    if (isErr(threadResult)) {
      return Err(new SlashCommandError(threadResult.error.message));
    }
    const challengeThreadChannel = threadResult.value;

    const newThreadName = challenge.blooded
      ? "🩸-"
      : challenge.solved
        ? "✅-"
        : `❌-${sanitizeChannelName(newName)}`;

    await interaction.reply({ content: t('cmd.ctf.renamechallenge.success', lang) });
    await challengeThreadChannel.edit({ name: newThreadName });

    const updateResult = await client.challengeService.updateChallenge(ctf, challenge._id, { name: newName });
    if (isErr(updateResult)) {
      log.error('Error updating challenge name: %s', updateResult.error.message);
    } else {
      audit.info(
        '%s (%s) renamed challenge "%s" → "%s" in "%s"',
        interaction.user.username,
        interaction.user.id,
        challenge.name,
        newName,
        ctf.name,
      );
    }

    return Ok(void 0);
  },
};

export default RenameChallenge;
