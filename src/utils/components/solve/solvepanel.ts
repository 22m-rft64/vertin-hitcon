import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  InteractionEditReplyOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from 'discord.js';
import { Component, ComponentInit } from '@discordutils/components/component';
import { Challenge } from '@core/models/Challenge';
import {
  markIfMaxed,
  rebuildCategoryAnnouncement,
  buildWorkonEmbed,
} from '@discordutils/ctf/discordutil';
import { WorkonButton, WorkonIdleButton } from '@discordutils/components/buttons/ctfworkon';
import { isErr } from '@discordtypes/result';
import { fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { createLogger } from '@discordutils/logger';
import { t, resolveLocale } from '@i18n/index';

const audit = createLogger('Audit:CTF');

interface SolvePanelOptions {
  challengeId: string;
  ctfName: string;
  mainSolverId: string;
}

export class SolvePanel extends Component<ButtonInteraction> {
  static override actionName = 'solve_panel';
  private options: SolvePanelOptions;
  // 편집 중인 상태 (submit 전)
  private pendingContributors: string[] = [];
  private pendingFlag: string | null = null;

  constructor(init: ComponentInit, options: SolvePanelOptions) {
    super(init);
    this.options = options;

    // 이미 풀린 챌린지면 기존 값 로드
    const ctf = this.client.ctfService.listActiveCTFs()
      .find((c) => c.name === options.ctfName);
    if (ctf) {
      const ch = ctf.challenges.get(options.challengeId);
      if (ch?.solved) {
        this.pendingContributors = [...ch.contributors];
        this.pendingFlag = ch.flag;
      }
    }

    // 하위 컴포넌트 등록
    new SolveContributorsSelect(
      { client: this.client, attachId: this.attachId, timeout: null },
      this,
    );
    new SolveFlagButton(
      { client: this.client, attachId: this.attachId, timeout: null },
      this,
    );
    new SolveSubmitButton(
      { client: this.client, attachId: this.attachId, timeout: null },
      this,
    );
    new SolveUnsolveButton(
      { client: this.client, attachId: this.attachId, timeout: null },
      this,
    );
    new SolveChangeSolverButton(
      { client: this.client, attachId: this.attachId, timeout: null },
      this,
    );
  }

  render(challenge?: Challenge): InteractionEditReplyOptions {
    const ctf = this.client.ctfService.listActiveCTFs()
      .find((c) => c.name === this.options.ctfName);
    const ch = challenge ?? ctf?.challenges.get(this.options.challengeId);
    const isSubmitted = ch?.solved ?? false;

    const embed = new EmbedBuilder()
      .setTitle(`${isSubmitted ? '✅' : '🔧'} ${ch?.name ?? 'Challenge'} — Solve`)
      .setColor(isSubmitted ? Colors.Green : Colors.Aqua);

    const lines: string[] = [
      `**Main Solver:** <@${this.options.mainSolverId}>`,
      `**Contributors:** ${this.pendingContributors.length > 0
        ? this.pendingContributors.map((id) => `<@${id}>`).join(', ')
        : t('solve.no_contributors', 'en')}`,
      `**Flag:** ${this.pendingFlag ? `\`${this.pendingFlag}\`` : t('solve.no_flag', 'en')}`,
    ];

    if (isSubmitted) {
      lines.push('', t('solve.status_submitted', 'en'));
    }

    embed.setDescription(lines.join('\n'));

    const contribMenu = new UserSelectMenuBuilder()
      .setCustomId(`solve_contributors::${this.attachId}`)
      .setPlaceholder('Select contributors')
      .setMinValues(0)
      .setMaxValues(25);
    if (this.pendingContributors.length > 0) {
      contribMenu.setDefaultUsers(this.pendingContributors);
    }
    const row1 = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(contribMenu);

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`solve_flag::${this.attachId}`)
        .setLabel('🚩 Flag')
        .setStyle(ButtonStyle.Secondary),
      ...(isSubmitted
        ? [
            new ButtonBuilder()
              .setCustomId(`solve_change_solver::${this.attachId}`)
              .setLabel('👤 Change Solver')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`solve_submit::${this.attachId}`)
              .setLabel('💾 Save')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`solve_unsolve::${this.attachId}`)
              .setLabel('🔄 Unsolve')
              .setStyle(ButtonStyle.Danger),
          ]
        : [
            new ButtonBuilder()
              .setCustomId(`solve_submit::${this.attachId}`)
              .setLabel('📤 Submit')
              .setStyle(ButtonStyle.Success),
          ]),
    );

    return { embeds: [embed], components: [row1, row2] };
  }

  // 패널 자체는 사용되지 않지만 Component 상속 필요
  async execute(_interaction: ButtonInteraction): Promise<void> {}

  // --- 하위 컴포넌트에서 호출하는 메서드들 ---

  setContributors(ids: string[]): void {
    // main solver는 contributor에서 제외
    this.pendingContributors = ids.filter((id) => id !== this.options.mainSolverId);
  }

  setFlag(flag: string | null): void {
    this.pendingFlag = flag;
  }

  getOptions(): SolvePanelOptions {
    return this.options;
  }

  getPendingContributors(): string[] {
    return this.pendingContributors;
  }

  getPendingFlag(): string | null {
    return this.pendingFlag;
  }

  setMainSolver(id: string): void {
    this.options.mainSolverId = id;
    // 새 solver가 contributor에 있었으면 제거
    this.pendingContributors = this.pendingContributors.filter((cid) => cid !== id);
  }
}

// --- Contributors Select ---

class SolveContributorsSelect extends Component<UserSelectMenuInteraction> {
  static override actionName = 'solve_contributors';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: UserSelectMenuInteraction): Promise<void> {
    const ids = interaction.values;
    this.panel.setContributors(ids);
    await interaction.update(this.panel.render());
  }
}

// --- Flag Button → Modal ---

class SolveFlagButton extends Component<ButtonInteraction> {
  static override actionName = 'solve_flag';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const modal = new SolveFlagModal(
      { client: this.client, attachId: this.attachId, timeout: 120 },
      this.panel,
    );
    await interaction.showModal(modal.build());
  }
}

class SolveFlagModal extends Component<ModalSubmitInteraction> {
  static override actionName = 'solve_flag_modal';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  private getFlagPlaceholder(): string {
    const ctf = this.client.ctfService.listActiveCTFs()
      .find((c) => c.name === this.panel.getOptions().ctfName);
    return ctf?.flag_format ? `${ctf.flag_format}...` : t('solve.modal_flag_placeholder', 'en');
  }

  build(): ModalBuilder {
    return new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle('Flag')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`${this.customId}_flag`)
            .setLabel('Flag')
            .setPlaceholder(this.getFlagPlaceholder())
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(this.panel.getPendingFlag() ?? ''),
        ),
      );
  }

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    const flag = interaction.fields.getTextInputValue(`${this.customId}_flag`).trim();
    this.panel.setFlag(flag || null);
    await interaction.deferUpdate();
    await interaction.editReply(this.panel.render());
  }
}

// --- Submit Button ---

class SolveSubmitButton extends Component<ButtonInteraction> {
  static override actionName = 'solve_submit';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const lang = resolveLocale(interaction.locale);

    const opts = this.panel.getOptions();
    const ctfResult = await this.client.ctfService.getCTF({ name: opts.ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.followUp({ content: t('solve.error_ctf_not_found', lang), flags: MessageFlags.Ephemeral });
      return;
    }
    const ctf = ctfResult.value;
    const challenge = ctf.challenges.get(opts.challengeId);
    if (!challenge) {
      await interaction.followUp({ content: t('solve.error_challenge_not_found', lang), flags: MessageFlags.Ephemeral });
      return;
    }

    const contributors = this.panel.getPendingContributors();
    const flag = this.panel.getPendingFlag();

    if (challenge.solved) {
      // 이미 submit된 상태 → 수정만
      const updateResult = await this.client.challengeService.updateSolveInfo(
        ctf, challenge._id, { solver: opts.mainSolverId, contributors, flag },
      );
      if (isErr(updateResult)) {
        await interaction.followUp({ content: `❌ ${updateResult.error.message}`, flags: MessageFlags.Ephemeral });
        return;
      }

      audit.info(
        '%s (%s) updated solve info for "%s" in "%s" (solver: %s, contributors: %d)',
        interaction.user.username,
        interaction.user.id,
        challenge.name,
        ctf.name,
        opts.mainSolverId,
        contributors.length,
      );
    } else {
      // 첫 submit
      const solveResult = await this.client.challengeService.solveChallenge(
        ctf, challenge._id, opts.mainSolverId, contributors, flag,
      );
      if (isErr(solveResult)) {
        await interaction.followUp({ content: `❌ ${solveResult.error.message}`, flags: MessageFlags.Ephemeral });
        return;
      }

      audit.info(
        '%s (%s) solved "%s" in "%s" (solver: %s, contributors: %d)',
        interaction.user.username,
        interaction.user.id,
        challenge.name,
        ctf.name,
        opts.mainSolverId,
        contributors.length,
      );

      // solves 채널에 공개 임베드
      const solvesResult = await fetchTextChannelFromClient(this.client, ctf.guild_channels.solves, 'solves channel');
      if (!isErr(solvesResult)) {
        const solverMember = await this.client.guild.members.fetch(opts.mainSolverId).catch(() => null);
        const solveEmbed = new EmbedBuilder()
          .setTitle('🎉 Challenge solved!')
          .setDescription(
            `**${challenge.name}** [${challenge.category}]\n\n` +
            `**Flag found by** <@${opts.mainSolverId}>\n` +
            (contributors.length > 0
              ? `**Contributors:** ${contributors.map((id) => `<@${id}>`).join(', ')}`
              : ''),
          )
          .setColor(Colors.DarkGold)
          .setTimestamp();
        if (solverMember) {
          solveEmbed.setThumbnail(solverMember.displayAvatarURL());
        }

        const msg = await solvesResult.value.send({ embeds: [solveEmbed] });
        await this.client.challengeService.updateChallenge(ctf, challenge._id, {
          solve_announcement: msg.id,
        });
      }

      // 스레드 이름 변경
      try {
        const thread = await this.client.channels.fetch(challenge.thread);
        if (thread?.isThread()) {
          const cleaned = thread.name.replace(/^[❌✅🩸]\s*-?\s*/, '');
          await thread.edit({ name: `✅-${cleaned}` });
        }
      } catch (e) { warnUnexpectedError('solve: rename thread', e); }

      // announcements 업데이트
      const annResult = await fetchTextChannelFromClient(this.client, ctf.guild_channels.announcements, 'announcements channel');
      if (!isErr(annResult)) {
        await rebuildCategoryAnnouncement(this.client, ctf, challenge.category, annResult.value);
      }

      // workon 메시지 업데이트
      if (challenge.workon_message && challenge.thread) {
        try {
          const thread = await this.client.channels.fetch(challenge.thread);
          const parentChannel = thread?.isThread() ? thread.parent : null;
          if (parentChannel?.isTextBased()) {
            const workonMsg = await (parentChannel as TextChannel).messages.fetch(challenge.workon_message);
            const workonButton =
              (this.client.componentRegistry.get(`workon::${challenge._id}`) as WorkonButton) ??
              new WorkonButton(
                { client: this.client, attachId: challenge._id, timeout: null },
                challenge,
                ctf.name,
              );
            const idleButton =
              (this.client.componentRegistry.get(`workon_idle::${challenge._id}`) as WorkonIdleButton) ??
              new WorkonIdleButton(
                { client: this.client, attachId: challenge._id, timeout: null },
                challenge,
                ctf.name,
              );
            await workonMsg.edit({
              embeds: [buildWorkonEmbed(challenge)],
              components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                workonButton.build(),
                idleButton.build(),
              )],
            });
          }
        } catch (e) { warnUnexpectedError('solve: edit workon_message', e); }
      }

      // 카테고리 채널 상태
      try {
        const thread = await this.client.channels.fetch(challenge.thread);
        const parentChannel = thread?.isThread() ? thread.parent : null;
        if (parentChannel?.isTextBased() && 'name' in parentChannel) {
          await markIfMaxed(ctf.challenges, parentChannel as TextChannel, challenge.category);
        }
      } catch (e) { warnUnexpectedError('solve: markIfMaxed', e); }

    }

    // 패널 업데이트
    await interaction.editReply(this.panel.render(challenge));
  }
}

// --- Change Solver Button → Select ---

class SolveChangeSolverButton extends Component<ButtonInteraction> {
  static override actionName = 'solve_change_solver';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const selectRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`solve_change_solver_select::${this.attachId}`)
        .setPlaceholder('Select main solver')
        .setMinValues(1)
        .setMaxValues(1),
    );

    new SolveChangeSolverSelect(
      { client: this.client, attachId: this.attachId, timeout: 60 },
      this.panel,
    );

    await interaction.reply({
      content: t('solve.select_solver', lang),
      components: [selectRow],
      flags: MessageFlags.Ephemeral,
    });
  }
}

class SolveChangeSolverSelect extends Component<UserSelectMenuInteraction> {
  static override actionName = 'solve_change_solver_select';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: UserSelectMenuInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const newSolverId = interaction.values[0];
    this.panel.setMainSolver(newSolverId);
    await interaction.update({
      content: t('solve.solver_changed', lang),
      components: [],
    });

    // 원래 패널도 업데이트
    const originalInteraction = interaction.message.interaction;
    try {
      await interaction.message.edit(this.panel.render());
    } catch {
      // ephemeral이라 원본 수정 불가할 수 있음
    }
  }
}

// --- Unsolve Button ---

class SolveUnsolveButton extends Component<ButtonInteraction> {
  static override actionName = 'solve_unsolve';
  private panel: SolvePanel;

  constructor(init: ComponentInit, panel: SolvePanel) {
    super(init);
    this.panel = panel;
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();

    const lang = resolveLocale(interaction.locale);
    const opts = this.panel.getOptions();
    const ctfResult = await this.client.ctfService.getCTF({ name: opts.ctfName });
    if (isErr(ctfResult) || !ctfResult.value) {
      await interaction.followUp({ content: t('solve.error_ctf_not_found', lang), flags: MessageFlags.Ephemeral });
      return;
    }
    const ctf = ctfResult.value;
    const challenge = ctf.challenges.get(opts.challengeId);
    if (!challenge) {
      await interaction.followUp({ content: t('solve.error_challenge_not_found', lang), flags: MessageFlags.Ephemeral });
      return;
    }

    // solves 채널에서 공지 삭제
    if (challenge.solve_announcement) {
      const solvesResult = await fetchTextChannelFromClient(this.client, ctf.guild_channels.solves, 'solves channel');
      if (!isErr(solvesResult)) {
        try {
          const msg = await solvesResult.value.messages.fetch(challenge.solve_announcement);
          await msg.delete();
        } catch (e) { /* already deleted */ }
      }
    }

    // unsolve 처리
    const unsolveResult = await this.client.challengeService.unsolveChallenge(ctf, challenge._id);
    if (isErr(unsolveResult)) {
      await interaction.followUp({ content: `❌ ${unsolveResult.error.message}`, flags: MessageFlags.Ephemeral });
      return;
    }

    audit.info(
      '%s (%s) unsolved "%s" in "%s"',
      interaction.user.username,
      interaction.user.id,
      challenge.name,
      ctf.name,
    );

    // 패널 상태 초기화
    this.panel.setContributors([]);
    this.panel.setFlag(null);

    // 스레드 이름 복구
    try {
      const thread = await this.client.channels.fetch(challenge.thread);
      if (thread?.isThread()) {
        const cleaned = thread.name.replace(/^[❌✅🩸]\s*-?\s*/, '');
        await thread.edit({ name: `❌-${cleaned}` });
      }
    } catch (e) { warnUnexpectedError('unsolve: rename thread', e); }

    // announcements 업데이트
    const annResult = await fetchTextChannelFromClient(this.client, ctf.guild_channels.announcements, 'announcements channel');
    if (!isErr(annResult)) {
      await rebuildCategoryAnnouncement(this.client, ctf, challenge.category, annResult.value);
    }

    // workon 메시지 복구
    if (challenge.workon_message && challenge.thread) {
      try {
        const thread = await this.client.channels.fetch(challenge.thread);
        const parentChannel = thread?.isThread() ? thread.parent : null;
        if (parentChannel?.isTextBased()) {
          const workonMsg = await (parentChannel as TextChannel).messages.fetch(challenge.workon_message);
          const workonButton =
            (this.client.componentRegistry.get(`workon::${challenge._id}`) as WorkonButton) ??
            new WorkonButton(
              { client: this.client, attachId: challenge._id, timeout: null },
              challenge,
              ctf.name,
            );
          const idleButton =
            (this.client.componentRegistry.get(`workon_idle::${challenge._id}`) as WorkonIdleButton) ??
            new WorkonIdleButton(
              { client: this.client, attachId: challenge._id, timeout: null },
              challenge,
              ctf.name,
            );
          await workonMsg.edit({
            embeds: [buildWorkonEmbed(challenge)],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
              workonButton.build(),
              idleButton.build(),
            )],
          });
        }
      } catch (e) { warnUnexpectedError('unsolve: edit workon_message', e); }
    }

    // 카테고리 채널 이름 복구
    try {
      const thread = await this.client.channels.fetch(challenge.thread);
      const parentChannel = thread?.isThread() ? thread.parent : null;
      if (parentChannel && 'name' in parentChannel && parentChannel.name.startsWith('🎯')) {
        await (parentChannel as TextChannel).edit({
          name: parentChannel.name.replace('🎯', '🔄'),
        });
      }
    } catch (e) { warnUnexpectedError('unsolve: category channel name', e); }

    // 패널 업데이트 (미풀이 상태로)
    await interaction.editReply(this.panel.render(challenge));
  }
}
