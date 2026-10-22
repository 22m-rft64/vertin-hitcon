import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMemberRoleManager,
  MessageFlags,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import { Component, ComponentInit } from '@discordutils/components/component';
import { ComponentRegistry } from '@handlers/componentregistry';
import { createLogger } from '@discordutils/logger';

const log = createLogger('JoinButton');
const audit = createLogger('Audit:Member');
import { CTF } from '@core/models/CTF';
import { isErr, isOk } from '@discordtypes/result';
import { fetchRole, fetchTextChannel } from '@discordutils/ctf/safefetch';

type FeedKey = 'msg.feed.participant_joined' | 'msg.feed.participant_left';

export class CTFJoinButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfannounce_join';

  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setLabel('Join / Leave')
      .setEmoji('🎯')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const roleResult = await fetchRole(
      this.client.guild,
      this.ctf.guild_role,
      'CTF 역할',
    );
    if (isErr(roleResult)) {
      await interaction.reply({
        content: `❌ ${t('error.ctf_role_not_found', lang)}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const ctfRole = roleResult.value;

    const memberRoles = interaction.member.roles as GuildMemberRoleManager;

    if (memberRoles.cache.has(ctfRole.id)) {
      await memberRoles.remove(ctfRole);
      audit.info('%s (%s) left "%s"', interaction.user.username, interaction.user.id, this.ctf.name);

      await interaction.reply({
        content: t('cmd.ctf.join.left', lang).replace('{ctfName}', this.ctf.name),
        flags: MessageFlags.Ephemeral,
      });
      await this.logToFeed(interaction, 'msg.feed.participant_left');
      return;
    }

    await memberRoles.add(ctfRole);
    audit.info('%s (%s) joined "%s"', interaction.user.username, interaction.user.id, this.ctf.name);

    await interaction.reply({
      content: t('cmd.ctf.join.success', lang).replace('{ctfName}', this.ctf.name),
      flags: MessageFlags.Ephemeral,
    });

    const generalResult = await fetchTextChannel(
      interaction.guild,
      this.ctf.guild_channels.general,
      'general channel',
    );

    if (isOk(generalResult)) {
      await generalResult.value.send(t('msg.user_joined', 'en').replace('{user}', `${interaction.user}`));
    }

    await this.logToFeed(interaction, 'msg.feed.participant_joined');
  }

  /**
   * 참가/퇴장 기록을 CTF feed 채널에 남긴다. feed가 없거나 실패해도 참가 처리는 유지.
   */
  private async logToFeed(interaction: ButtonInteraction, key: FeedKey): Promise<void> {
    const ctfResult = await this.client.ctfService.getCTF({ name: this.ctf.name });
    const feedId = isOk(ctfResult) ? ctfResult.value?.guild_channels.feed : null;
    if (!feedId) {
      return;
    }

    const feedResult = await fetchTextChannel(interaction.guild, feedId, 'feed channel');
    if (isErr(feedResult)) {
      return;
    }

    const timestamp = `<t:${Math.floor(Date.now() / 1000)}:T>`;
    const line = t(key, 'en').replace('{user}', `${interaction.user}`);
    await feedResult.value.send({
      content: `${timestamp} · ${line}`,
      allowedMentions: { parse: [] },
    }).catch((error) => log.error('Failed to log participation to feed', error));
  }
}

export function registerJoinFactory(registry: ComponentRegistry): void {
  registry.registerFactory('ctfannounce_join', async (client, attachId) => {
    const allCTFs = client.ctfService.listActiveCTFs();
    const ctf = allCTFs.find((c) => c.name === attachId);

    if (ctf) {
      new CTFJoinButton({ client, attachId, timeout: null }, ctf);
      log.debug('Restored CTF join button: %s', ctf.name);
      return true;
    }

    return false;
  });
}
