import { Component, ComponentInit } from '@discordutils/components/component';
import { normalizeCategory, CATEGORY_DISPLAY, ChallengeCategory } from '@core/models/Category';
import { createChallengeChannel } from '@discordutils/ctf/discordutil';
import { isErr } from '@discordtypes/result';
import { findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { createLogger } from '@discordutils/logger';
import { t, resolveLocale } from '@i18n/index';

const audit = createLogger('Audit:CTF');
import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

interface BatchCreateOptions {
  category: string;
  ctfName: string;
}

export class BatchCreateChallengeModal extends Component<ModalSubmitInteraction> {
  static override actionName = 'batch_createchall';
  private category: string;
  private ctfName: string;

  constructor(init: ComponentInit, options: BatchCreateOptions) {
    super(init);
    this.category = options.category;
    this.ctfName = options.ctfName;
  }

  build(): ModalBuilder {
    const normalized = normalizeCategory(this.category);
    const display = CATEGORY_DISPLAY[normalized as ChallengeCategory];
    const label = display ? `${display.emoji} ${display.label}` : normalized;

    return new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle(`${label} Batch Create`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`${this.customId}_names`)
            .setLabel('Challenge names (one per line)')
            .setPlaceholder('sql-injection\nxss\nssrf')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000),
        ),
      );
  }

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    await interaction.deferReply();

    const raw = interaction.fields.getTextInputValue(`${this.customId}_names`);
    const names = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const lang = resolveLocale(interaction.locale);

    if (names.length === 0) {
      await interaction.editReply({ content: t('batch.error_no_names', lang) });
      return;
    }

    const ctfResult = await this.client.ctfService.getCTF({ name: this.ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.editReply({ content: t('error.fetch_ctf', lang) });
      return;
    }
    const ctf = ctfResult.value;

    const normalizedCategory = normalizeCategory(this.category);
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: t('batch.error_server', lang) });
      return;
    }

    const created: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    for (const name of names) {
      const existing = this.client.challengeService.findChallenge(ctf, {
        name,
        category: normalizedCategory,
      });
      if (existing) {
        skipped.push(name);
        continue;
      }

      const result = await createChallengeChannel(
        this.client,
        ctf,
        guild,
        name,
        this.category,
      );

      if (isErr(result)) {
        failed.push(name);
      } else {
        created.push(name);
      }
    }

    audit.info(
      '%s (%s) batch created challenges in "%s" [%s] (created: %d, skipped: %d, failed: %d): %s',
      interaction.user.username,
      interaction.user.id,
      ctf.name,
      normalizedCategory,
      created.length,
      skipped.length,
      failed.length,
      names.join(', '),
    );

    // 결과 리포트
    const lines: string[] = [];
    if (created.length > 0) {
      lines.push(`${t('batch.created', lang).replace('{count}', String(created.length))}: ${created.map((n) => `\`${n}\``).join(', ')}`);
    }
    if (skipped.length > 0) {
      lines.push(`${t('batch.skipped', lang).replace('{count}', String(skipped.length))}: ${skipped.map((n) => `\`${n}\``).join(', ')}`);
    }
    if (failed.length > 0) {
      lines.push(`${t('batch.failed', lang).replace('{count}', String(failed.length))}: ${failed.map((n) => `\`${n}\``).join(', ')}`);
    }

    await interaction.editReply({ content: lines.join('\n') });
  }
}
