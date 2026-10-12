import { SlashCommandSubcommandBuilder } from "discord.js";
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from "@discordtypes/slashcommand";
import { normalizeCategory } from "@core/models/Category";
import { createChallengeChannel } from "@discordutils/ctf/discordutil";
import { ChallengeCategoryAutocompletion } from "@discordutils/ctf/autocomplete";
import { Ok, Err, isErr } from "@discordtypes/result";
import { findCtfByInteraction } from "@discordutils/ctf/safefetch";
import { BatchCreateChallengeModal } from "@discordutils/components/modals/batchchallenge";
import { createLogger } from "@discordutils/logger";

const audit = createLogger('Audit:CTF');

const CreateChallenge: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName("createchallenge")
    .setDescription("Add a new challenge.")
    .setDescriptionLocalizations({ ko: '새 문제를 추가해.', ja: '新しい問題を追加する。', fi: 'Lisää uusi haaste.' })
    .addStringOption(
      (opt) =>
        opt
          .setName("category")
          .setDescription("Category.")
          .setDescriptionLocalizations({ ko: '카테고리.', ja: 'カテゴリ。', fi: 'Kategoria.' })
          .setRequired(true)
          .setAutocomplete(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("name")
        .setDescription("Name. Leave blank to open the batch creation modal.")
        .setDescriptionLocalizations({ ko: '이름. 비워두면 배치 생성 모달이 열려.', ja: '名前。空欄ならバッチ作成モーダルが開く。', fi: 'Nimi. Jätä tyhjäksi avataksesi joukkoluonnin.' })
        .setRequired(false),
    ),
  autocomplete: ChallengeCategoryAutocompletion,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const name = interaction.options.getString("name");
    const challCategory: string = interaction.options.getString("category", true);

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

    // name 없으면 배치 생성 모달
    if (!name) {
      const modal = new BatchCreateChallengeModal(
        { client, attachId: `batch_${Date.now()}`, timeout: 300 },
        { category: challCategory, ctfName: ctf.name },
      );
      await interaction.showModal(modal.build());
      return Ok(void 0);
    }

    // 단건 생성 (기존 로직)
    await interaction.deferReply();

    const normalizedCategory = normalizeCategory(challCategory);

    const existing = client.challengeService.findChallenge(ctf, {
      name,
      category: normalizedCategory,
    });
    if (existing) {
      return Err(new SlashCommandError(t('cmd.ctf.createchallenge.error_exists', lang)));
    }

    const channelResult = await createChallengeChannel(
      client,
      ctf,
      interaction.guild,
      name,
      challCategory,
    );

    if (isErr(channelResult)) {
      return Err(new SlashCommandError(channelResult.error.message));
    }

    audit.info(
      '%s (%s) created challenge "%s" [%s] in "%s"',
      interaction.user.username,
      interaction.user.id,
      name,
      normalizedCategory,
      ctf.name,
    );

    await interaction.editReply({
      content: t('cmd.ctf.createchallenge.success', lang).replace('{name}', name),
    });

    return Ok(void 0);
  },
};

export default CreateChallenge;
