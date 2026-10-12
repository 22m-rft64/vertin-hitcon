import {
  SlashCommandSubcommandBuilder,
  MessageFlags,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { Ok, Err, isErr } from '@discordtypes/result';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { SolvePanel } from '@discordutils/components/solve/solvepanel';

const Solve: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('solve')
    .setDescription('Submit a solve.')
    .setDescriptionLocalizations({ ko: '풀이를 등록해.', ja: '解答を登録する。', fi: 'Lähetä ratkaisu.' })
    .addUserOption((opt) =>
      opt
        .setName('solver')
        .setDescription('Main solver. Defaults to you.')
        .setDescriptionLocalizations({ ko: '메인 솔버. 기본값은 나.', ja: 'メインソルバー。デフォルトは自分。', fi: 'Pääratkaisija. Oletuksena sinä.' })
        .setRequired(false),
    ),
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const ctfResult = await findCtfByInteraction(interaction, client.ctfService);
    if (isErr(ctfResult)) {
      return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
    }
    const ctf = ctfResult.value;
    if (!ctf) {
      return Err(new SlashCommandError(t('error.not_in_ctf_channel', lang)));
    }
    if (ctf.archived) {
      return Err(new SlashCommandError(t('error.archived_ctf', lang)));
    }

    const challenge = client.challengeService.findChallenge(ctf, {
      thread: interaction.channelId,
    });
    if (!challenge) {
      return Err(
        new SlashCommandError(t('cmd.ctf.solve.error_need_thread', lang)),
      );
    }

    // 이미 풀린 챌린지: main solver 또는 관리자만 다시 편집 가능
    const isAdmin = interaction.memberPermissions?.has('ManageChannels') ?? false;
    if (challenge.solved && challenge.solver !== interaction.user.id && !isAdmin) {
      return Err(new SlashCommandError(t('cmd.ctf.solve.error_permission', lang)));
    }

    const solver = interaction.options.getUser('solver');
    const mainSolverId = solver?.id ?? interaction.user.id;

    const panel = new SolvePanel(
      { client, attachId: `solve_${challenge._id}_${Date.now()}`, timeout: 600 },
      { challengeId: challenge._id, ctfName: ctf.name, mainSolverId },
    );

    await interaction.reply({
      ...panel.render(challenge),
      flags: MessageFlags.Ephemeral,
    });

    return Ok(void 0);
  },
};

export default Solve;
