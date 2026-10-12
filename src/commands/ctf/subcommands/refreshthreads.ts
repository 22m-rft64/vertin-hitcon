import {
  MessageFlags,
  PermissionsBitField,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { Ok, Err, isErr } from '@discordtypes/result';
import { findCtfByInteraction, fetchRole } from '@discordutils/ctf/safefetch';
import { createLogger } from '@discordutils/logger';

const log = createLogger('RefreshThreads');

const RefreshThreadsCommand: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('refreshthreads')
    .setDescription('Make all challenge threads visible to everyone.')
    .setDescriptionLocalizations({
      ko: '모든 챌린지 스레드를 전원에게 보이게 해.',
      ja: '全チャレンジスレッドを全員に表示する。',
      fi: 'Tee kaikki haasteketjut näkyviksi kaikille.',
    }),

  permissions: new PermissionsBitField(['Administrator']),

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

    const challenges = Array.from(ctf.challenges.values())
      .filter((ch) => ch.thread);

    if (challenges.length === 0) {
      return Err(new SlashCommandError(t('cmd.ctf.status.no_challenges', lang)));
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // CTF 역할 멤버 멘션 문자열 생성
    const roleResult = await fetchRole(interaction.guild, ctf.guild_role, 'CTF role');
    const membersMention = !isErr(roleResult)
      ? roleResult.value.members.map((gm) => `<@${gm.id}>`).join(', ')
      : '';

    if (!membersMention) {
      await interaction.editReply({ content: '❌ No members found with CTF role.' });
      return Ok(void 0);
    }

    let refreshed = 0;
    let failed = 0;

    // 순차 처리 — rate limit 방지
    for (const challenge of challenges) {
      try {
        const threadChannel = await client.channels.fetch(challenge.thread);
        if (!threadChannel || !threadChannel.isThread()) {
          failed += 1;
          continue;
        }

        const tempMsg = await threadChannel.send({
          content: '...',
          flags: MessageFlags.SuppressNotifications,
        });
        await tempMsg.edit(membersMention);
        await tempMsg.delete();
        refreshed += 1;
      } catch (error) {
        log.error('Failed to refresh thread for %s: %O', challenge.name, error);
        failed += 1;
      }
    }

    const result = t('cmd.ctf.refreshthreads.success', lang)
      .replace('{refreshed}', String(refreshed))
      .replace('{failed}', String(failed));

    await interaction.editReply({ content: result });

    log.info(
      '%s refreshed threads in "%s": %d ok, %d failed',
      interaction.user.username,
      ctf.name,
      refreshed,
      failed,
    );

    return Ok(void 0);
  },
};

export default RefreshThreadsCommand;
