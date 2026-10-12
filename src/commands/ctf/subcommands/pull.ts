import {
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { ActivatedCTFName } from '@discordutils/ctf/autocomplete';
import { Ok, Err, isErr, isOk } from '@discordtypes/result';
import { findCtfByInteraction, fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { createLogger } from '@discordutils/logger';
import { VertinClient, VERTIN_COLOR } from '@discordutils/vertinclient';
import { buildScoreboardEmbed } from './scoreboard';
import { getScoreboardSnapshot } from '@discordutils/ctf/scoreboardcache';
import { CTF } from '@core/models/CTF';

const log = createLogger('Cmd:Pull');

// 스코어보드 고정 메시지 ID 추적 (ctfName → messageId)
const scoreboardMessageIds = new Map<string, string>();

/**
 * 특정 CTF에 대해 autopull job을 등록한다.
 * 봇 시작 시 + /ctf pull autopull:true 시 호출.
 */
export const registerAutoPull = (client: VertinClient, ctf: CTF): void => {
  const jobName = `hitcon-pull-${ctf.name}`;
  client.scheduleHandler.registerJob(jobName, '*/2 * * * *', async () => {
    const freshCtfResult = await client.ctfService.getCTF({ name: ctf.name });
    if (isErr(freshCtfResult) || !freshCtfResult.value) return;
    const freshCtf = freshCtfResult.value;

    if (freshCtf.archived || freshCtf.ended) {
      client.scheduleHandler.cancelJob(jobName);
      return;
    }

    const dc = await client.pullService.createPlatformClient(freshCtf);
    if (!dc) return;

    const autoPullResult = await client.pullService.pullChallenges(client, freshCtf, dc);
    if (isOk(autoPullResult) && autoPullResult.value.created.length > 0) {
      const feedId = freshCtf.guild_channels.feed;
      if (feedId) {
        const feedRes = await fetchTextChannelFromClient(client, feedId, 'feed');
        if (isOk(feedRes)) {
          const msg = `📡 ${t('cmd.ctf.pull.new_challenges_feed', 'en')}: ${autoPullResult.value.created.join(', ')}`;
          await feedRes.value.send(msg).catch(() => {});
        }
      }
    }

    // Scoreboard auto-pull + 임베드 갱신
    await client.pullService.pullScoreboard(client, freshCtf, dc);
    const sbChannelId = freshCtf.guild_channels.scoreboard;
    if (sbChannelId) {
      const snapshot = getScoreboardSnapshot(freshCtf.name);
      if (snapshot) {
        const sbRes = await fetchTextChannelFromClient(client, sbChannelId, 'scoreboard');
        if (isOk(sbRes)) {
          const sbEmbed = buildScoreboardEmbed(snapshot, freshCtf, 'en');
          const existingMsgId = scoreboardMessageIds.get(freshCtf.name);

          if (existingMsgId) {
            try {
              const sbMsg = await sbRes.value.messages.fetch(existingMsgId);
              await sbMsg.edit({ embeds: [sbEmbed] });
            } catch {
              const newMsg = await sbRes.value.send({ embeds: [sbEmbed] });
              scoreboardMessageIds.set(freshCtf.name, newMsg.id);
            }
          } else {
            const newMsg = await sbRes.value.send({ embeds: [sbEmbed] });
            scoreboardMessageIds.set(freshCtf.name, newMsg.id);
          }
        }
      }
    }
  });

  log.info('Auto-pull registered for "%s"', ctf.name);
};

const Pull: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('pull')
    .setDescription('Fetch challenges and scoreboard from the platform.')
    .setDescriptionLocalizations({
      ko: '플랫폼에서 문제와 스코어보드를 가져와.',
      ja: 'プラットフォームから問題とスコアボードを取得する。',
      fi: 'Hae haasteet ja tulostaulu alustalta.',
    })
    .addStringOption((opt) =>
      opt
        .setName('ctfname')
        .setDescription('CTF name. Defaults to current channel.')
        .setDescriptionLocalizations({
          ko: 'CTF 이름. 기본값은 현재 채널.',
          ja: 'CTF名。デフォルトは現在のチャンネル。',
          fi: 'CTF:n nimi. Oletuksena nykyinen kanava.',
        })
        .setAutocomplete(true),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('autopull')
        .setDescription('Enable auto-polling every 3 minutes.')
        .setDescriptionLocalizations({
          ko: '3분마다 자동 폴링을 켜.',
          ja: '3分ごとの自動ポーリングを有効にする。',
          fi: 'Ota käyttöön automaattinen kysely 3 minuutin välein.',
        }),
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString('ctfname') || null;
    const autopull = interaction.options.getBoolean('autopull') ?? false;

    let ctf;
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
      return Err(new SlashCommandError(t('cmd.ctf.showcreds.error_need_context', lang)));
    }

    if (ctf.archived) {
      return Err(new SlashCommandError(t('error.archived_ctf', lang)));
    }

    const platformClient = await client.pullService.createPlatformClient(ctf);
    if (!platformClient) {
      return Err(new SlashCommandError(t('cmd.ctf.pull.no_cookie', lang)));
    }

    await interaction.deferReply();

    // Pull challenges
    const pullResult = await client.pullService.pullChallenges(client, ctf, platformClient);
    if (isErr(pullResult)) {
      return Err(new SlashCommandError(pullResult.error.message));
    }
    const { created, skipped, errors } = pullResult.value;

    // Pull scoreboard
    const scoreResult = await client.pullService.pullScoreboard(client, ctf, platformClient);
    const scoreData = isOk(scoreResult) ? scoreResult.value : null;

    // Build embed (공개 메시지 → 영어)
    const embed = new EmbedBuilder()
      .setTitle(t('cmd.ctf.pull.result_title', 'en'))
      .setColor(VERTIN_COLOR)
      .setTimestamp();

    const challengeLines: string[] = [];
    if (created.length > 0) {
      challengeLines.push(`✅ ${t('cmd.ctf.pull.created', 'en')}: ${created.length}`);
      challengeLines.push(created.map((n) => `  + ${n}`).join('\n'));
    }
    challengeLines.push(`⏭️ ${t('cmd.ctf.pull.skipped', 'en')}: ${skipped.length}`);
    if (errors.length > 0) {
      challengeLines.push(`❌ ${t('cmd.ctf.pull.errors', 'en')}: ${errors.length}`);
      challengeLines.push(errors.map((e) => `  - ${e}`).join('\n'));
    }

    embed.addFields({
      name: t('cmd.ctf.pull.challenges_section', 'en'),
      value: challengeLines.join('\n').slice(0, 1024) || '-',
    });

    if (scoreData) {
      const scoreLines: string[] = [];
      scoreLines.push(`${t('cmd.ctf.pull.teams_count', 'en')}: ${scoreData.teamCount}`);
      if (scoreData.myTeam) {
        scoreLines.push(`${t('cmd.ctf.pull.my_team', 'en')}: ${scoreData.myTeam.name} (${scoreData.myTeam.score ?? 0}pts)`);
      }
      if (scoreData.deltaMessage) {
        scoreLines.push(scoreData.deltaMessage);
      }

      embed.addFields({
        name: t('cmd.ctf.pull.scoreboard_section', 'en'),
        value: scoreLines.join('\n').slice(0, 1024) || '-',
      });
    }

    await interaction.editReply({ embeds: [embed] });

    // Notify feed channel if new challenges were created
    if (created.length > 0) {
      const feedChannelId = ctf.guild_channels.feed;
      if (feedChannelId) {
        const feedResult = await fetchTextChannelFromClient(client, feedChannelId, 'feed');
        if (isOk(feedResult)) {
          const feedMsg = `📡 ${t('cmd.ctf.pull.new_challenges_feed', 'en')}: ${created.join(', ')}`;
          await feedResult.value.send(feedMsg).catch(() => {});
        }
      }
    }

    // Auto-pull setup
    if (autopull) {
      registerAutoPull(client, ctf);
      await interaction.followUp({
        content: t('cmd.ctf.pull.autopull_started', 'en'),
      });
    }

    return Ok(void 0);
  },
};

export default Pull;
