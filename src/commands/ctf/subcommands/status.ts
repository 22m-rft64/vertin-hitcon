import {
  Colors,
  EmbedBuilder,
  MessageFlags,
  SlashCommandSubcommandBuilder,
  GuildMember,
  Collection,
} from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { CTF } from "@core/models/CTF";
import { ActivatedCTFName } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { findCtfByInteraction } from "@discordutils/ctf/safefetch";

// 상태 모드 열거형
enum StatusMode {
  active = "active",
  all = "all",
}

const Status: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("status")
    .setDescription("Check the CTF progress.")
    .setDescriptionLocalizations({ ko: 'CTF 진행 상황을 확인해.', ja: 'CTFの進行状況を確認する。', fi: 'Tarkista CTF:n edistyminen.' })
    .addStringOption((opt) =>
      opt
        .setName("ctfname")
        .setDescription("CTF name. Defaults to current channel.")
        .setDescriptionLocalizations({ ko: 'CTF 이름. 기본값은 현재 채널.', ja: 'CTF名。デフォルトは現在のチャンネル。', fi: 'CTF:n nimi. Oletuksena nykyinen kanava.' })
        .setAutocomplete(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription(
          "Show all or only unsolved challenges. Default: active.",
        )
        .setDescriptionLocalizations({ ko: '전체 또는 미해결 문제만 표시. 기본값: active.', ja: '全体または未解決のみ表示。デフォルト: active。', fi: 'Näytä kaikki vai vain ratkaisemattomat haasteet.' })
        .addChoices(
          { name: "active", value: StatusMode.active },
          { name: "all", value: StatusMode.all },
        ),
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    await interaction.deferReply();

    const name = interaction.options.getString("ctfname") || null;
    const mode =
      (interaction.options.getString("mode") as StatusMode) ||
      StatusMode.active;

    let ctfs: CTF[] = [];
    const ctfResult = await findCtfByInteraction(interaction, client.ctfService);
    if (isErr(ctfResult)) {
      return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
    }
    let ctf: CTF | null = ctfResult.value;

    // CTF 이름이 제공되지 않고, CTF 카테고리 채널 밖에 있는 경우,
    // 모든 진행 중인 CTF 상태를 표시합니다.
    if (ctf === null && name === null) {
      ctfs = client.ctfService
        .listActiveCTFs()
        .filter((c) => !c.archived && !c.ended);

      if (ctfs.length === 0) {
        await interaction.followUp({
          content: t('cmd.ctf.status.no_active', lang),
          flags: MessageFlags.Ephemeral,
        });
        return Ok(void 0);
      }
    }
    // CTF 이름이 제공되지 않고, CTF 카테고리 채널 안에 있는 경우,
    // 이 카테고리 채널과 관련된 CTF의 상태를 표시합니다.
    else if (name === null) {
      if (ctf) {
        ctfs = [ctf];
      }
    }
    // CTF 이름이 제공되었을 경우, 해당 CTF의 상태만 표시합니다.
    else {
      const namedCtfResult = await client.ctfService.getCTF({
        name,
        archived: false,
        ended: false,
      });

      if (isErr(namedCtfResult)) {
        return Err(new SlashCommandError(t('error.fetch_ctf', lang)));
      }

      const namedCtf = namedCtfResult.value;
      if (!namedCtf) {
        await interaction.followUp({
          content: t('error.ctf_not_found', lang),
          flags: MessageFlags.Ephemeral,
        });
        return Ok(void 0);
      }

      ctfs = [namedCtf];
    }

    let noRunningCtfs = true;

    for (const currentCtf of ctfs) {
      noRunningCtfs = false;

      // 명령어가 CTF 채널 외부에서 실행된 경우
      if (currentCtf.guild_category !== interaction.channel.parentId) {
        const embed = new EmbedBuilder()
          .setTitle(`${currentCtf.name} status`)
          .setColor(Colors.Blue)
          .setDescription(
            t('error.not_in_ctf_channel', lang),
          );

        await interaction.followUp({ embeds: [embed] });
        continue;
      }

      // 챌린지가 없는 경우
      const challenges = Array.from(currentCtf.challenges.values());
      if (challenges.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(`${currentCtf.name} status`)
          .setDescription(t('cmd.ctf.status.no_challenges', lang))
          .setColor(Colors.Blue);

        await interaction.followUp({ embeds: [embed] });
        return Ok(void 0);
      }

      let embed: EmbedBuilder | null = null;
      let numFields = 0;

      // 모든 멤버 ID 수집 - 해결자와 작업자 ID를 모두 포함
      const allMemberIds = new Set<string>();
      challenges.forEach((challenge) => {
        challenge.players.forEach((id) => allMemberIds.add(id));
        if (challenge.solvers) {
          challenge.solvers.forEach((id) => allMemberIds.add(id));
        }
      });

      // 서버의 모든 멤버를 한 번에 가져옵니다
      const guild = interaction.guild;
      const members = await guild.members.fetch();

      // ID를 표시 이름으로 변환하는 함수
      const getDisplayName = (id: string) => {
        const member = members.get(id);
        return member ? member.displayName : id;
      };

      for (let idx = 0; idx < challenges.length; idx++) {
        // Discord의 임베드당 최대 필드 수에 도달하면 이전 임베드를 보내고 새 임베드를 생성합니다.
        if (numFields % 25 === 0) {
          if (numFields !== 0) {
            await interaction.followUp({ embeds: [embed!] });
            embed = null;
          }

          if (embed === null) {
            embed = new EmbedBuilder()
              .setTitle(`${currentCtf.name} status`)
              .setColor(Colors.Blue);
          }
        }

        const challenge = challenges[idx];

        // 해결된 챌린지이고 모드가 'all'인 경우
        if (challenge.solved && mode === StatusMode.all) {
          const icon = challenge.blooded ? "🩸" : "✅";
          const solveTime = challenge.solve_time
            ? new Date(challenge.solve_time).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "알 수 없음";

          // 해결자 ID를 표시 이름으로 변환
          const solverNames = challenge.solvers.map(getDisplayName);

          embed!.addFields({
            name: `${icon} ${challenge.name} (${challenge.category || "분류 없음"})`,
            value:
              "```diff\n" +
              `+ Solver${solverNames.length > 1 ? "s" : ""}: ${solverNames.join(", ") || "N/A"}\n` +
              `+ Date: ${solveTime}\n` +
              "```",
            inline: false,
          });

          numFields++;
        }
        // 해결되지 않은 챌린지
        else if (!challenge.solved) {
          // 작업자 ID를 표시 이름으로 변환
          const workerNames = challenge.players.map(getDisplayName);

          const workers =
            workerNames.length === 0
              ? "```diff\n- No workers.\n```"
              : "```fix\n" +
                `! Worker${workerNames.length > 1 ? "s" : ""}: ${workerNames.join(", ")}\n` +
                "```";

          embed!.addFields({
            name: `❌ ${idx + 1}  - ${challenge.name} (${challenge.category || "분류 없음"})`,
            value: workers,
            inline: false,
          });

          numFields++;
        }
      }

      // 남은 임베드 전송
      if (embed) {
        await interaction.followUp({ embeds: [embed] });
      }
    }

    if (noRunningCtfs) {
      if (name === null) {
        await interaction.followUp({
          content: t('cmd.ctf.status.no_active', lang),
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.followUp({
          content: t('error.ctf_not_found', lang),
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    return Ok(void 0);
  },
};

export default Status;
