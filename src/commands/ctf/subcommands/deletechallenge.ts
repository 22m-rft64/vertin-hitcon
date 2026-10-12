import { SlashCommandSubcommandBuilder, TextChannel } from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { ChallengeAutocompletion } from "@discordutils/ctf/autocomplete";
import { Challenge } from "@core/models/Challenge";
import { rebuildCategoryAnnouncement } from "@discordutils/ctf/discordutil";
import { Ok, Err, isErr } from "@discordtypes/result";
import {
  fetchTextChannelFromClient,
  fetchThreadChannel,
  findCtfByInteraction,
} from "@discordutils/ctf/safefetch";
import { warnUnexpectedError } from "@discordutils/discorderror";
import { createLogger } from "@discordutils/logger";

const audit = createLogger('Audit:CTF');

const DeleteChallenge: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("deletechallenge")
    .setDescription("Delete a challenge.")
    .setDescriptionLocalizations({ ko: '문제를 삭제해.', ja: '問題を削除する。', fi: 'Poista haaste.' })
    .addStringOption((opt) =>
      opt
        .setName("challname")
        .setDescription(
          "Challenge name. Defaults to current thread.",
        )
        .setDescriptionLocalizations({ ko: '삭제할 문제 이름. 기본값은 현재 스레드.', ja: '削除する問題名。デフォルトは現在のスレッド。', fi: 'Haasteen nimi. Oletuksena nykyinen ketju.' })
        .setAutocomplete(true),
    ),
  autocomplete: ChallengeAutocompletion,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const oldName = interaction.options.getString("challname");

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

    let challenge: Challenge | null;
    if (!oldName) {
      challenge = client.challengeService.findChallenge(ctf, {
        thread: interaction.channelId,
      });
      if (!challenge) {
        return Err(
          new SlashCommandError(t('cmd.ctf.deletechallenge.error_need_target', lang)),
        );
      }
    } else {
      challenge = client.challengeService.findChallenge(ctf, {
        name: oldName,
      });
      if (!challenge) {
        return Err(new SlashCommandError(t('error.challenge_not_found', lang)));
      }
    }

    await interaction.deferReply();

    const announcementResult = await fetchTextChannelFromClient(
      client,
      ctf.guild_channels.announcements,
      'announcements channel',
    );
    if (isErr(announcementResult)) {
      return Err(new SlashCommandError(announcementResult.error.message));
    }
    const announcementChannel = announcementResult.value;

    const requestedInChallengeChannel =
      interaction.channelId === challenge.thread;

    const threadResult = await fetchThreadChannel(
      client,
      challenge.thread,
      'challenge thread',
    );
    if (isErr(threadResult)) {
      return Err(new SlashCommandError(threadResult.error.message));
    }

    // workon_message 정리 (카테고리 텍스트 채널 = 스레드의 parent)
    if (challenge.workon_message && threadResult.value.parent?.isTextBased()) {
      try {
        const workonMsg = await (threadResult.value.parent as TextChannel)
          .messages.fetch(challenge.workon_message);
        await workonMsg.delete();
      } catch (error) { warnUnexpectedError('deletechallenge: delete workon_message', error); }
    }

    const sameCategoryOthers = [...ctf.challenges.values()]
      .filter((c) => c.category === challenge.category && c._id !== challenge._id);

    const removeResult = await client.challengeService.removeChallenge(ctf, challenge._id);
    if (isErr(removeResult)) {
      return Err(new SlashCommandError(t('cmd.ctf.deletechallenge.error_remove', lang)));
    }

    audit.info(
      '%s (%s) deleted challenge "%s" from "%s"',
      interaction.user.username,
      interaction.user.id,
      challenge.name,
      ctf.name,
    );

    if (sameCategoryOthers.length > 0) {
      await rebuildCategoryAnnouncement(client, ctf, challenge.category, announcementChannel);
    } else if (challenge.announcement) {
      try {
        const announcementMessage = await announcementChannel.messages.fetch(challenge.announcement);
        await announcementMessage.delete();
      } catch (error) { warnUnexpectedError('deletechallenge: delete announcement', error); }
    }

    await threadResult.value.delete();

    if (requestedInChallengeChannel) {
      await interaction.user.send({
        content: t('cmd.ctf.deletechallenge.success', lang).replace('{name}', challenge.name),
      });
    } else {
      await interaction.editReply({
        content: t('cmd.ctf.deletechallenge.success', lang).replace('{name}', challenge.name),
      });
    }
    return Ok(void 0);
  },
};

export default DeleteChallenge;
