import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  TextChannel,
} from 'discord.js';
import { VertinClient } from '@discordutils/vertinclient';
import { t, resolveLocale } from '@i18n/index';
import { createLogger } from '@discordutils/logger';

const log = createLogger('Translate');

const CONTEXT_MESSAGE_COUNT = 5;
const COOLDOWN_MS = 5_000;

// Per-user cooldown tracker
const cooldowns = new Map<string, number>();

const checkCooldown = (userId: string): number => {
  const lastUsed = cooldowns.get(userId) ?? 0;
  const remaining = lastUsed + COOLDOWN_MS - Date.now();
  if (remaining > 0) return remaining;
  cooldowns.set(userId, Date.now());
  return 0;
};

export const translateCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Translate')
    .setNameLocalizations({ ko: '번역', ja: '翻訳', fi: 'Käännä' })
    .setType(ApplicationCommandType.Message),

  async execute(
    client: VertinClient,
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> {
    const content = interaction.targetMessage.content;
    const lang = resolveLocale(interaction.locale);

    const remaining = checkCooldown(interaction.user.id);
    if (remaining > 0) {
      await interaction.reply({
        content: t('translate.cooldown', lang).replace('{sec}', String(Math.ceil(remaining / 1000))),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!content?.trim()) {
      await interaction.reply({
        content: t('translate.empty', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const translated = await client.translationService.translate(content, lang);

      if (translated === '__SAME__') {
        await interaction.editReply({ content: t('translate.same', lang) });
        return;
      }
      if (translated === null) {
        await interaction.editReply({ content: t('translate.error', lang) });
        return;
      }

      await interaction.editReply({ content: translated });
    } catch (error) {
      log.error('Translate command error', error);
      await interaction.editReply({ content: t('translate.error', lang) });
    }
  },
};

export const translateContextCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Translate (Context)')
    .setNameLocalizations({ ko: '번역 (맥락)', ja: '翻訳 (文脈)', fi: 'Käännä (konteksti)' })
    .setType(ApplicationCommandType.Message),

  async execute(
    client: VertinClient,
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> {
    const targetMessage = interaction.targetMessage;
    const lang = resolveLocale(interaction.locale);

    const remaining = checkCooldown(interaction.user.id);
    if (remaining > 0) {
      await interaction.reply({
        content: t('translate.cooldown', lang).replace('{sec}', String(Math.ceil(remaining / 1000))),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!targetMessage.content?.trim()) {
      await interaction.reply({
        content: t('translate.empty', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const channel = interaction.channel;
      if (!channel || !('messages' in channel)) {
        await interaction.editReply({ content: t('translate.error', lang) });
        return;
      }

      // Fetch messages before and after the target
      const [beforeMsgs, afterMsgs] = await Promise.all([
        (channel as TextChannel).messages.fetch({
          before: targetMessage.id,
          limit: CONTEXT_MESSAGE_COUNT,
        }),
        (channel as TextChannel).messages.fetch({
          after: targetMessage.id,
          limit: CONTEXT_MESSAGE_COUNT,
        }),
      ]);

      // Build context: before (old→new) + target + after (old→new)
      const beforeLines = [...beforeMsgs.values()]
        .reverse()
        .filter((m) => m.content?.trim())
        .map((m) => `${m.author.displayName}: ${m.content}`);
      const afterLines = [...afterMsgs.values()]
        .reverse()
        .filter((m) => m.content?.trim())
        .map((m) => `${m.author.displayName}: ${m.content}`);

      const contextLines = [
        ...beforeLines,
        `${targetMessage.author.displayName}: ${targetMessage.content}`,
        ...afterLines,
      ];

      const contextText = contextLines.join('\n');

      const translated = await client.translationService.translateWithContext(
        contextText,
        lang,
      );

      if (translated === null) {
        await interaction.editReply({ content: t('translate.error', lang) });
        return;
      }

      await interaction.editReply({ content: translated });
    } catch (error) {
      log.error('Translate (Context) command error', error);
      await interaction.editReply({ content: t('translate.error', lang) });
    }
  },
};

export const translateUserCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Translate (User)')
    .setNameLocalizations({ ko: '번역 (이 사람)', ja: '翻訳 (この人)', fi: 'Käännä (käyttäjä)' })
    .setType(ApplicationCommandType.Message),

  async execute(
    client: VertinClient,
    interaction: MessageContextMenuCommandInteraction,
  ): Promise<void> {
    const targetMessage = interaction.targetMessage;
    const targetAuthor = targetMessage.author.id;
    const lang = resolveLocale(interaction.locale);

    const remaining = checkCooldown(interaction.user.id);
    if (remaining > 0) {
      await interaction.reply({
        content: t('translate.cooldown', lang).replace('{sec}', String(Math.ceil(remaining / 1000))),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!targetMessage.content?.trim()) {
      await interaction.reply({
        content: t('translate.empty', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const channel = interaction.channel;
      if (!channel || !('messages' in channel)) {
        await interaction.editReply({ content: t('translate.error', lang) });
        return;
      }

      const GROUP_GAP_MS = 7 * 60_000; // Discord message group = same author within 7 min

      // Fetch surrounding messages
      const [beforeMsgs, afterMsgs] = await Promise.all([
        (channel as TextChannel).messages.fetch({
          before: targetMessage.id,
          limit: 25,
        }),
        (channel as TextChannel).messages.fetch({
          after: targetMessage.id,
          limit: 25,
        }),
      ]);

      const targetTs = targetMessage.createdTimestamp;
      const isText = (m: { content?: string; attachments: { size: number } }) =>
        m.content?.trim() && m.attachments.size === 0 && !m.content.startsWith('https://');

      // Walk backwards: same author + within 7min of TARGET
      const beforeArr = [...beforeMsgs.values()]; // newest first
      const beforeLines: string[] = [];
      for (const m of beforeArr) {
        if (m.author.id !== targetAuthor) break;
        if (targetTs - m.createdTimestamp > GROUP_GAP_MS) break;
        if (isText(m)) beforeLines.unshift(m.content);
      }

      // Walk forwards: same author + within 7min of TARGET
      const afterArr = [...afterMsgs.values()].reverse(); // oldest first
      const afterLines: string[] = [];
      for (const m of afterArr) {
        if (m.author.id !== targetAuthor) break;
        if (m.createdTimestamp - targetTs > GROUP_GAP_MS) break;
        if (isText(m)) afterLines.push(m.content);
      }

      const allLines = [...beforeLines, targetMessage.content, ...afterLines];

      const translated = await client.translationService.translateUserMessages(allLines, lang);

      if (translated === null) {
        await interaction.editReply({ content: t('translate.error', lang) });
        return;
      }

      await interaction.editReply({ content: translated });
    } catch (error) {
      log.error('Translate (User) command error', error);
      await interaction.editReply({ content: t('translate.error', lang) });
    }
  },
};

export default translateCommand;
