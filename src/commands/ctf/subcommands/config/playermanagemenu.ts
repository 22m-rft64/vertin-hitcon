import { Component, AnySelectMenuBuilder, ComponentInit } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTF } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import { warnUnexpectedError } from '@discordutils/discorderror';
import { t, resolveLocale } from '@i18n/index';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
} from 'discord.js';
import { CTFBackButton } from './ctfbackbutton';

export const PlayerManageMenu = (
  init: ComponentInit,
  ctf: CTF,
): [EmbedBuilder, ActionRowBuilder<ButtonBuilder>] => {
  const embed = new EmbedBuilder()
    .setColor(VERTIN_COLOR)
    .setTitle(t('config.player_title', 'en'))
    .setDescription(
      `-# Current role: <@&${ctf.guild_role}>`,
    )
    .addFields({
      name: t('config.player_field_role', 'en'),
      value: t('config.player_field_role_value', 'en'),
      inline: false,
    })
    .setFooter({ text: t('config.footer_10m', 'en') });

  const changeRoleButton = new ChangeRoleButton(init, ctf);
  const backButton = new CTFBackButton(init);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    changeRoleButton.build(),
    backButton.build(),
  );

  return [embed, row1];
};

class ChangeRoleButton extends Component<ButtonInteraction> {
  static override actionName = 'change_role';
  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel('Change CTF role')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⬅️');
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const roleListSelectMenu = new RoleListSelectMenu(
      { client: this.client, attachId: this.attachId, timeout: 300 },
      this.ctf,
    );
    const lang = resolveLocale(interaction.locale);
    await interaction.reply({
      content: t('config.select_role', lang),
      components: [roleListSelectMenu.build()],
      flags: MessageFlags.Ephemeral,
    });
  }
}

class RoleListSelectMenu extends Component<RoleSelectMenuInteraction> {
  static override actionName = 'role_list_selectmenu';

  ctf: CTF;

  constructor(init: ComponentInit, ctf: CTF) {
    super(init);
    this.ctf = ctf;
  }

  build(): ActionRowBuilder<AnySelectMenuBuilder> {
    return new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(this.customId)
        .setPlaceholder('Select a role.')
        .setMaxValues(1)
        .setMinValues(1),
    );
  }

  async execute(interaction: RoleSelectMenuInteraction): Promise<void> {
    await interaction.deferUpdate();

    const role = interaction.roles.first();
    if (!role || !('guild' in role)) {
      await interaction.editReply({
        content: t('config.role_select_error', 'en'),
      });
      return;
    }

    let migrationWarning = '';
    try {
      const prevRole = await this.client.guild.roles.fetch(this.ctf.guild_role);
      if (prevRole) {
        const members = [...prevRole.members.values()];
        const results = await Promise.allSettled(
          members.map((gm) => gm.roles.add(role)),
        );
        const failedMembers = members.filter((_, i) => results[i].status === 'rejected');
        if (failedMembers.length > 0) {
          migrationWarning = `\n${t('config.role_migration_failed', 'en').replace('{count}', String(failedMembers.length)).replace('{names}', failedMembers.map((m) => m.displayName).join(', '))}`;
        }
        try { await prevRole.delete(); }
        catch (e) {
          warnUnexpectedError('player-manage: delete prev role', e);
          migrationWarning += `\n${t('config.role_delete_failed', 'en')}`;
        }
      }
    } catch (e) {
      warnUnexpectedError('player-manage: role migration', e);
      await interaction.editReply({
        content: t('config.role_error', 'en'),
      });
      return;
    }

    const updateResult = await this.client.ctfService.updateCTF(this.ctf.name, { guild_role: role.id });
    if (isErr(updateResult)) {
      await interaction.editReply({
        content: t('config.role_update_error', 'en').replace('{error}', updateResult.error.message),
      });
      return;
    }

    await interaction.editReply({
      content: `${t('config.role_changed', 'en').replace('{name}', this.ctf.name).replace('{role}', `${role}`)}${migrationWarning}`,
    });
  }
}
