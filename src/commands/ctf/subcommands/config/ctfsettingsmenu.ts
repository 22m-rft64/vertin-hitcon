import { ComponentInit } from '@discordutils/components/component';
import { Component } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTF, ICTF } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import { dateToString, stringToDate } from '@discordutils/ctf/discordutil';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { CTFBackButton } from './ctfbackbutton';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { createLogger } from '@discordutils/logger';
import { t, resolveLocale, SupportedLang } from '@i18n/index';

const audit = createLogger('Audit:CTF');

export const CTFSettingsMenu = (
  init: ComponentInit,
  ctf: CTF,
  lang: SupportedLang = 'en',
): [EmbedBuilder, ActionRowBuilder<ButtonBuilder>[]] => {
  const notSet = t('config.settings_not_set', lang);
  const flagDisplay = ctf.flag_format ?? notSet;
  const startDisplay = ctf.start_at ? dateToString(ctf.start_at) : notSet;
  const endDisplay = ctf.ended_at ? dateToString(ctf.ended_at) : notSet;
  const eventIdDisplay = ctf.event_id || notSet;

  const embed = new EmbedBuilder()
    .setColor(VERTIN_COLOR)
    .setTitle(`⚙️ ${t('config.settings_title', lang)}`)
    .setDescription(`-# ${t('config.settings_description', lang)}`)
    .addFields(
      { name: `🚩 ${t('config.settings_field_flag', lang)}`, value: `\`${flagDisplay}\``, inline: true },
      { name: `🆔 ${t('config.settings_field_event_id', lang)}`, value: `\`${eventIdDisplay}\``, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
      { name: `🕐 ${t('config.settings_field_start', lang)}`, value: `\`${startDisplay}\``, inline: true },
      { name: `🕐 ${t('config.settings_field_end', lang)}`, value: `\`${endDisplay}\``, inline: true },
    )
    .setFooter({ text: t('config.footer_10m', lang) });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new FlagFormatButton(init, ctf).build(),
    new ScheduleButton(init, ctf).build(),
    new EventIdButton(init, ctf).build(),
    new ChannelSyncButton(init, ctf).build(),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new CTFBackButton(init).build(),
  );

  return [embed, [row1, row2]];
};

// --- Flag Format Button ---

class FlagFormatButton extends Component<ButtonInteraction> {
  static override actionName = 'settings_flag_format';
  private ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(`🚩 ${t('config.settings_flag_button', 'en')}`)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalId = `flag_format_modal_${interaction.id}`;
    const modal = new ModalBuilder()
      .setTitle(t('config.settings_flag_modal_title', lang))
      .setCustomId(modalId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('flag_format')
            .setLabel(t('config.settings_flag_modal_label', lang))
            .setPlaceholder('codegate{}')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(this.ctf.flag_format ?? ''),
        ),
      );

    await interaction.showModal(modal);

    const submission = await interaction
      .awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 120_000 })
      .catch(() => null);
    if (!submission) return;

    await submission.deferUpdate();

    const value = submission.fields.getTextInputValue('flag_format').trim();
    const flagFormat = value || null;

    const result = await this.client.ctfService.updateCTF(this.ctf.name, {
      flag_format: flagFormat,
    });

    if (isErr(result)) {
      await submission.followUp({
        content: t('config.settings_flag_error', lang).replace('{error}', result.error.message),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    audit.info(
      '%s (%s) changed flag format for "%s": "%s"',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      flagFormat ?? '',
    );

    this.ctf.flag_format = flagFormat;

    const [embed, rows] = CTFSettingsMenu(
      { client: this.client, attachId: this.attachId, timeout: 600 },
      this.ctf,
      lang,
    );
    await submission.editReply({ embeds: [embed], components: [...rows] });
    await submission.followUp({
      content: t('config.flag_format_success', lang).replace('{value}', flagFormat ?? 'none'),
      flags: MessageFlags.Ephemeral,
    });
  }
}

// --- Schedule (Start/End Time) Button ---

class ScheduleButton extends Component<ButtonInteraction> {
  static override actionName = 'settings_schedule';
  private ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(`🕐 ${t('config.settings_schedule_button', 'en')}`)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalId = `schedule_modal_${interaction.id}`;
    const modal = new ModalBuilder()
      .setTitle(t('config.settings_schedule_modal_title', lang))
      .setCustomId(modalId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('start_at')
            .setLabel(t('config.settings_start_label', lang))
            .setPlaceholder('2026-04-01T09:00')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(this.ctf.start_at ? dateToString(this.ctf.start_at) : ''),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('ended_at')
            .setLabel(t('config.settings_end_label', lang))
            .setPlaceholder('2026-04-03T09:00')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(this.ctf.ended_at ? dateToString(this.ctf.ended_at) : ''),
        ),
      );

    await interaction.showModal(modal);

    const submission = await interaction
      .awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 120_000 })
      .catch(() => null);
    if (!submission) return;

    await submission.deferUpdate();

    const startInput = submission.fields.getTextInputValue('start_at').trim();
    const endInput = submission.fields.getTextInputValue('ended_at').trim();

    const updateData: Record<string, Date | null> = {};
    let markEnded = false;

    if (startInput) {
      const parsed = stringToDate(startInput);
      if (!parsed) {
        await submission.followUp({
          content: t('config.settings_start_error', lang),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      updateData.start_at = parsed;
    }

    if (endInput) {
      const parsed = stringToDate(endInput);
      if (!parsed) {
        await submission.followUp({
          content: t('config.settings_end_error', lang),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      updateData.ended_at = parsed;
      if (parsed.getTime() <= Date.now()) {
        markEnded = true;
      }
    }

    if (Object.keys(updateData).length === 0) {
      await submission.followUp({
        content: t('config.settings_no_changes', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await this.client.ctfService.updateCTF(this.ctf.name, updateData);
    if (isErr(result)) {
      await submission.followUp({
        content: t('config.settings_schedule_error', lang).replace('{error}', result.error.message),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    audit.info(
      '%s (%s) changed schedule for "%s" (start: %s, end: %s)',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      startInput || 'unchanged',
      endInput || 'unchanged',
    );

    if (markEnded) {
      await this.client.ctfService.updateCTF(this.ctf.name, { ended: true });
    }

    if (updateData.start_at) this.ctf.start_at = updateData.start_at;
    if (updateData.ended_at) this.ctf.ended_at = updateData.ended_at;

    const [embed, rows] = CTFSettingsMenu(
      { client: this.client, attachId: this.attachId, timeout: 600 },
      this.ctf,
      lang,
    );
    await submission.editReply({ embeds: [embed], components: [...rows] });
    await submission.followUp({
      content: t('config.schedule_success', lang),
      flags: MessageFlags.Ephemeral,
    });
  }
}

// --- Event ID Button ---

class EventIdButton extends Component<ButtonInteraction> {
  static override actionName = 'settings_event_id';
  private ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(`🆔 ${t('config.settings_event_id_button', 'en')}`)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalId = `event_id_modal_${interaction.id}`;
    const modal = new ModalBuilder()
      .setTitle(t('config.settings_event_id_modal_title', lang))
      .setCustomId(modalId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('event_id')
            .setLabel(t('config.settings_event_id_label', lang))
            .setPlaceholder('ctf-event-slug')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(this.ctf.event_id || ''),
        ),
      );

    await interaction.showModal(modal);

    const submission = await interaction
      .awaitModalSubmit({ filter: (i) => i.customId === modalId, time: 120_000 })
      .catch(() => null);
    if (!submission) return;

    await submission.deferUpdate();

    const value = submission.fields.getTextInputValue('event_id').trim();

    const result = await this.client.ctfService.updateCTF(this.ctf.name, {
      event_id: value,
    });

    if (isErr(result)) {
      await submission.followUp({
        content: t('config.settings_event_id_error', lang).replace('{error}', result.error.message),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    audit.info(
      '%s (%s) changed event ID for "%s": "%s"',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
      value,
    );

    this.ctf.event_id = value;

    const [embed, rows] = CTFSettingsMenu(
      { client: this.client, attachId: this.attachId, timeout: 600 },
      this.ctf,
      lang,
    );
    await submission.editReply({ embeds: [embed], components: [...rows] });
    await submission.followUp({
      content: t('config.event_id_success', lang).replace('{value}', value || 'none'),
      flags: MessageFlags.Ephemeral,
    });
  }
}

// --- Channel Sync Button ---

/**
 * 채널 이름 패턴 → guild_channels 키 매핑 (순서 = 디스코드 채널 정렬 순서)
 * CTF 카테고리 아래 실제 채널을 스캔, 없으면 생성해서 DB와 동기화
 */
const CHANNEL_SPEC: {
  key: string;
  patterns: string[];
  createName: string;
  readOnly: boolean;  // true면 SendMessages deny
}[] = [
  { key: 'general', patterns: ['general'], createName: 'general', readOnly: false },
  { key: 'botCmds', patterns: ['🤖-bot-cmds', 'bot-cmds'], createName: '🤖-bot-cmds', readOnly: false },
  { key: 'credentials', patterns: ['🔑-credentials', 'credentials'], createName: '🔑-credentials', readOnly: true },
  { key: 'notes', patterns: ['📝-notes', 'notes'], createName: '📝-notes', readOnly: true },
  { key: 'announcements', patterns: ['📣-announcements', 'announcements'], createName: '📣-announcements', readOnly: true },
  { key: 'solves', patterns: ['🎉-solves', 'solves'], createName: '🎉-solves', readOnly: true },
  { key: 'scoreboard', patterns: ['📈-scoreboard', 'scoreboard'], createName: '📈-scoreboard', readOnly: true },
  { key: 'feed', patterns: ['📡-feed', 'feed'], createName: '📡-feed', readOnly: true },
];

class ChannelSyncButton extends Component<ButtonInteraction> {
  static override actionName = 'settings_channel_sync';
  private ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(`🔄 ${t('config.settings_sync_button', 'en')}`)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const lang = resolveLocale(interaction.locale);

    const guild = interaction.guild;
    if (!guild) return;

    // 카테고리 채널 찾기
    let categoryChannel: CategoryChannel | null = null;

    const cached = guild.channels.cache.get(this.ctf.guild_category);
    if (cached?.type === ChannelType.GuildCategory) {
      categoryChannel = cached as CategoryChannel;
    }

    if (!categoryChannel) {
      const current = interaction.channel;
      if (current && 'parentId' in current && current.parentId) {
        const parent = guild.channels.cache.get(current.parentId);
        if (parent?.type === ChannelType.GuildCategory) {
          categoryChannel = parent as CategoryChannel;
        } else if (parent && 'parentId' in parent && parent.parentId) {
          const grandparent = guild.channels.cache.get(parent.parentId);
          if (grandparent?.type === ChannelType.GuildCategory) {
            categoryChannel = grandparent as CategoryChannel;
          }
        }
      }
    }

    if (!categoryChannel) {
      await interaction.followUp({
        content: t('config.settings_sync_category_error', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 역할 가져오기 (채널 생성 시 퍼미션 설정용)
    const role = guild.roles.cache.get(this.ctf.guild_role);

    // 채널 스캔 + 없으면 생성
    const children = categoryChannel.children.cache;
    const newChannels: Partial<ICTF['guild_channels']> = {};
    const results: string[] = [];

    for (const spec of CHANNEL_SPEC) {
      // 이름 패턴으로 기존 채널 찾기 (텍스트 채널만)
      const found = children.find((ch) =>
        ch.type === ChannelType.GuildText &&
        spec.patterns.some((p) => ch.name.toLowerCase().includes(p.toLowerCase())),
      );

      if (found) {
        newChannels[spec.key] = found.id;
        const changed = this.ctf.guild_channels[spec.key as keyof typeof this.ctf.guild_channels] !== found.id;
        results.push(`${changed ? '🔄' : '✅'} ${spec.key}: <#${found.id}>`);
      } else {
        // 채널 생성
        try {
          const overwrites: import('discord.js').OverwriteResolvable[] = [
            {
              id: guild.roles.everyone.id,
              deny: ['ViewChannel'] as import('discord.js').PermissionResolvable[],
            },
          ];

          if (role) {
            if (spec.readOnly) {
              overwrites.push({
                id: role.id,
                allow: ['ViewChannel', 'ReadMessageHistory'] as import('discord.js').PermissionResolvable[],
                deny: ['SendMessages'] as import('discord.js').PermissionResolvable[],
              });
            } else {
              overwrites.push({
                id: role.id,
                allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages'] as import('discord.js').PermissionResolvable[],
              });
            }
          }

          const created = await guild.channels.create({
            name: spec.createName,
            type: ChannelType.GuildText,
            parent: categoryChannel.id,
            permissionOverwrites: overwrites,
          });
          newChannels[spec.key] = created.id;
          results.push(`🆕 ${spec.key}: <#${created.id}> (${t('config.settings_sync_created', lang)})`);
        } catch (e) {
          warnUnexpectedError(`channel-sync: create ${spec.key}`, e);
          newChannels[spec.key] = null;
          results.push(`❌ ${spec.key}: ${t('config.settings_sync_create_failed', lang)}`);
        }
      }
    }

    // 채널 순서 정렬 (CHANNEL_SPEC 순서대로)
    try {
      const positionUpdates: { channel: string; position: number }[] = [];
      let pos = 1; // 0은 보통 voice general
      for (const spec of CHANNEL_SPEC) {
        const chId = newChannels[spec.key];
        if (chId) {
          positionUpdates.push({ channel: chId, position: pos++ });
        }
      }
      await guild.channels.setPositions(positionUpdates);
    } catch (e) {
      warnUnexpectedError('channel-sync: reorder', e);
    }

    // DB 업데이트
    const updateResult = await this.client.ctfService.updateCTF(this.ctf.name, {
      guild_category: categoryChannel.id,
      guild_channels: newChannels as ICTF['guild_channels'],
    });

    if (isErr(updateResult)) {
      await interaction.followUp({
        content: t('config.settings_sync_error', lang).replace('{error}', updateResult.error.message),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    audit.info(
      '%s (%s) synced channels for "%s"',
      interaction.user.username,
      interaction.user.id,
      this.ctf.name,
    );

    this.ctf.guild_category = categoryChannel.id;
    Object.assign(this.ctf.guild_channels, newChannels);

    const [embed, rows] = CTFSettingsMenu(
      { client: this.client, attachId: this.attachId, timeout: 600 },
      this.ctf,
    );
    await interaction.editReply({ embeds: [embed], components: [...rows] });
    await interaction.followUp({
      content: t('config.settings_sync_complete', lang).replace('{categoryId}', categoryChannel.id).replace('{results}', results.join('\n')),
      flags: MessageFlags.Ephemeral,
    });
  }
}
