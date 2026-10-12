import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { CTF } from '@core/models/CTF';
import { ActivatedCTFName } from '@discordutils/ctf/autocomplete';
import { Ok, Err, isErr, isOk } from '@discordtypes/result';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { getScoreboardSnapshot } from '@discordutils/ctf/scoreboardcache';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { SupportedLang } from '@i18n/index';

const Scoreboard: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('scoreboard')
    .setDescription('View the scoreboard.')
    .setDescriptionLocalizations({ ko: '스코어보드를 확인해.', ja: 'スコアボードを確認する。', fi: 'Näytä tulostaulu.' })
    .addStringOption((opt) =>
      opt
        .setName('ctfname')
        .setDescription('CTF name. Defaults to current channel.')
        .setDescriptionLocalizations({ ko: 'CTF 이름. 기본값은 현재 채널.', ja: 'CTF名。デフォルトは現在のチャンネル。', fi: 'CTF:n nimi. Oletuksena nykyinen kanava.' })
        .setAutocomplete(true),
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString('ctfname') || null;

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

    await interaction.deferReply();

    // 캐시에서 스냅샷 확인
    const snapshot = getScoreboardSnapshot(ctf.name);

    // 캐시가 없으면 라이브 pull 시도
    if (!snapshot) {
      const platformClient = await client.pullService.createPlatformClient(ctf);
      if (!platformClient) {
        await interaction.editReply({
          content: t('cmd.ctf.scoreboard.unavailable', 'en'),
        });
        return Ok(void 0);
      }

      const pullResult = await client.pullService.pullScoreboard(client, ctf, platformClient);
      if (isErr(pullResult) || pullResult.value.teamCount === 0) {
        await interaction.editReply({
          content: t('cmd.ctf.scoreboard.unavailable', 'en'),
        });
        return Ok(void 0);
      }

      const freshSnapshot = getScoreboardSnapshot(ctf.name);
      if (!freshSnapshot) {
        await interaction.editReply({
          content: t('cmd.ctf.scoreboard.unavailable', 'en'),
        });
        return Ok(void 0);
      }

      await interaction.editReply({ embeds: [buildScoreboardEmbed(freshSnapshot, ctf, 'en')] });
      return Ok(void 0);
    }

    await interaction.editReply({ embeds: [buildScoreboardEmbed(snapshot, ctf, 'en')] });
    return Ok(void 0);
  },
};

export interface ScoreboardSnapshot {
  teams: { name: string; score: number | null }[];
  myTeam: { name: string; score: number | null } | null;
  fetchedAt: number;
}

export const buildScoreboardEmbed = (
  snapshot: ScoreboardSnapshot,
  ctf: CTF,
  lang: SupportedLang,
): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setTitle(`📈 ${ctf.name} — ${t('cmd.ctf.scoreboard.title', lang)}`)
    .setColor(VERTIN_COLOR)
    .setFooter({ text: `Updated <t:${Math.floor(snapshot.fetchedAt / 1000)}:R>` });

  const top = snapshot.teams.slice(0, 20);
  const lines = top.map((team, idx) => {
    const rank = idx + 1;
    const prefix = snapshot.myTeam?.name === team.name ? '→' : ' ';
    return `${prefix}${String(rank).padStart(3, ' ')}. ${team.name} — ${team.score ?? 0}pts`;
  });

  embed.setDescription(`\`\`\`\n${lines.join('\n')}\n\`\`\``);

  if (snapshot.myTeam) {
    const myRank = snapshot.teams.findIndex((t) => t.name === snapshot.myTeam!.name) + 1;
    const rankText = myRank > 0 ? `#${myRank}` : '?';
    embed.addFields({
      name: t('cmd.ctf.scoreboard.my_team', lang),
      value: `**${snapshot.myTeam.name}** — ${snapshot.myTeam.score ?? 0}pts (${rankText})`,
    });
  }

  return embed;
};

export default Scoreboard;
