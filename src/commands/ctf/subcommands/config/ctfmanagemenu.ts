import { ComponentInit } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import { CTF } from '@core/models/CTF';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { CTFRenameButton } from './ctfrenamebutton';
import { CTFDeleteButton } from './ctfdeletebutton';
import { CTFBackButton } from './ctfbackbutton';
import { CTFPrivacyButton } from './ctfprivacybutton';
import { t, SupportedLang } from '@i18n/index';

export const CTFManageMenu = (
  init: ComponentInit,
  ctf: CTF,
  lang: SupportedLang = 'en',
): [EmbedBuilder, ActionRowBuilder<ButtonBuilder>[]] => {
  const embed = new EmbedBuilder()
    .setColor(VERTIN_COLOR)
    .setTitle(t('config.manage_title', lang))
    .setDescription(`-# ${t('config.manage_description', lang)}`)
    .addFields(
      {
        name: t('config.manage_field_rename', lang),
        value: t('config.manage_field_rename_value', lang),
        inline: false,
      },
      {
        name: t('config.manage_field_privacy', lang),
        value: t('config.manage_field_privacy_value', lang),
        inline: false,
      },
      {
        name: t('config.manage_field_delete', lang),
        value: t('config.manage_field_delete_value', lang),
        inline: false,
      },
    )
    .setFooter({ text: t('config.footer_10m', lang) });

  const renameButton = new CTFRenameButton(init, ctf).build();
  const privacyButton = new CTFPrivacyButton(init, ctf).build();
  const deleteButton = new CTFDeleteButton(init, ctf).build();
  const backButton = new CTFBackButton(init).build();

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    renameButton,
    privacyButton,
    deleteButton,
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

  return [embed, [row1, row2]];
};
