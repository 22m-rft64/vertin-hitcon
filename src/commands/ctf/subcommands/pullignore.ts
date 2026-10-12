import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import {
  SlashCommandSubCommand,
  SlashCommandError,
} from '@discordtypes/slashcommand';
import { ActivatedCTFName } from '@discordutils/ctf/autocomplete';
import { Ok, Err, isErr } from '@discordtypes/result';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTF } from '@core/models/CTF';

const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, ' ').trim();

const PullIgnore: SlashCommandSubCommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName('pullignore')
    .setDescription('Manage the pull ignore list.')
    .setDescriptionLocalizations({
      ko: 'pull 무시 목록을 관리해.',
      ja: 'pull無視リストを管理する。',
      fi: 'Hallitse pull-ohituslistaa.',
    })
    .addStringOption((opt) =>
      opt
        .setName('action')
        .setDescription('add / remove / list')
        .setDescriptionLocalizations({
          ko: 'add / remove / list',
          ja: 'add / remove / list',
          fi: 'add / remove / list',
        })
        .setRequired(true)
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' },
          { name: 'list', value: 'list' },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName('name')
        .setDescription('Challenge name to add/remove.')
        .setDescriptionLocalizations({
          ko: '추가/제거할 챌린지 이름.',
          ja: '追加/削除するチャレンジ名。',
          fi: 'Lisättävän/poistettavan haasteen nimi.',
        }),
    )
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
    ),
  autocomplete: ActivatedCTFName,
  execute: async (client, interaction) => {
    const lang = resolveLocale(interaction.locale);
    const action = interaction.options.getString('action', true);
    const challengeName = interaction.options.getString('name');
    const ctfName = interaction.options.getString('ctfname') || null;

    let ctf: CTF | null;
    if (ctfName) {
      const ctfResult = await client.ctfService.getCTF({ name: ctfName });
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

    if (action === 'list') {
      const items = ctf.pull_ignore;
      const embed = new EmbedBuilder()
        .setTitle(t('cmd.ctf.pullignore.list_title', lang))
        .setColor(VERTIN_COLOR)
        .setDescription(
          items.length > 0
            ? items.map((n) => `• ${n}`).join('\n')
            : t('cmd.ctf.pullignore.list_empty', lang),
        );

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return Ok(void 0);
    }

    if (!challengeName) {
      return Err(new SlashCommandError('Challenge name is required for add/remove.'));
    }

    const normalized = normalizeName(challengeName);
    const existingIndex = ctf.pull_ignore.findIndex(
      (n) => normalizeName(n) === normalized,
    );

    if (action === 'add') {
      if (existingIndex >= 0) {
        await interaction.reply({
          content: t('cmd.ctf.pullignore.already', lang).replace('{name}', challengeName),
          flags: MessageFlags.Ephemeral,
        });
        return Ok(void 0);
      }

      ctf.pull_ignore.push(challengeName);
      await client.ctfService.updateCTF(ctf.name, { pull_ignore: ctf.pull_ignore });

      await interaction.reply({
        content: t('cmd.ctf.pullignore.added', lang).replace('{name}', challengeName),
        flags: MessageFlags.Ephemeral,
      });
      return Ok(void 0);
    }

    if (action === 'remove') {
      if (existingIndex < 0) {
        await interaction.reply({
          content: t('cmd.ctf.pullignore.not_found', lang).replace('{name}', challengeName),
          flags: MessageFlags.Ephemeral,
        });
        return Ok(void 0);
      }

      ctf.pull_ignore.splice(existingIndex, 1);
      await client.ctfService.updateCTF(ctf.name, { pull_ignore: ctf.pull_ignore });

      await interaction.reply({
        content: t('cmd.ctf.pullignore.removed', lang).replace('{name}', challengeName),
        flags: MessageFlags.Ephemeral,
      });
      return Ok(void 0);
    }

    return Ok(void 0);
  },
};

export default PullIgnore;
