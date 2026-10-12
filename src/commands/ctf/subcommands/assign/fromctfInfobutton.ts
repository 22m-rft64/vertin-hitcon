import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import { Component, ComponentInit } from '@discordutils/components/component';
import { VERTIN_COLOR } from '@discordutils/vertinclient';
import {
  createCTFChannels,
  createCTFScheduledEvent,
  dateToString,
  stringToDate,
} from '@discordutils/ctf/discordutil';
import { CTFAnnounceButton } from './ctfannouncebutton';
import {
  CredentialsAddButton,
  CredentialsRegisterButton,
} from './ctfcredentialsbutton';
import { isErr, isOk } from '@discordtypes/result';
import { fetchTextChannel } from '@discordutils/ctf/safefetch';
import { createLogger } from '@discordutils/logger';

const audit = createLogger('Audit:CTF');

export interface CTFTimeEvent {
  id?: number;
  name?: string;
  logo?: string;
  website?: string;
  description?: string;
  organizers?: string[];
  prizes?: string;
  format?: string;
  weight?: string;
  location?: string;
}

export interface CTFRawInfo {
  name: string;
  date: [Date, Date];
  location?: string;
  ctftimeEvent?: CTFTimeEvent;
}

export const ctfInfoEmbed = (rawInfo: CTFRawInfo): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'CTF 정보' })
    .setTitle(rawInfo.name)
    .setColor(VERTIN_COLOR)
    .addFields({
      name: '📆 **일정**',
      value: rawInfo.date[0]
        ? `<t:${Math.floor(rawInfo.date[0].valueOf() / 1000)}:f>~<t:${Math.floor(rawInfo.date[1].valueOf() / 1000)}:f>`
        : 'Schedule TBD.',
      inline: false,
    });

  const ctftimeEvent = rawInfo.ctftimeEvent;

  if (ctftimeEvent) {
    if (ctftimeEvent.id)
      embed.setAuthor({
        name: 'CTF Info',
        iconURL: 'https://ctftime.org/favicon.png',
        url: `https://ctftime.org/event/${ctftimeEvent.id}`,
      });
    if (ctftimeEvent.logo) embed.setThumbnail(ctftimeEvent.logo);
    if (ctftimeEvent.website) embed.setURL(ctftimeEvent.website);
    if (ctftimeEvent.description)
      embed.addFields({
        name: '📔 **Description**',
        value: ctftimeEvent.description.length > 1024
          ? ctftimeEvent.description.slice(0, 1021) + '...'
          : ctftimeEvent.description,
        inline: false,
      });
    if (ctftimeEvent.organizers)
      embed.addFields({
        name: '👥 **Organizers**',
        value: ctftimeEvent.organizers.join(', '),
        inline: false,
      });
    if (ctftimeEvent.prizes)
      embed.addFields({
        name: '💰 **Prizes**',
        value: ctftimeEvent.prizes.length > 1024
          ? ctftimeEvent.prizes.slice(0, 1021) + '...'
          : ctftimeEvent.prizes,
        inline: false,
      });
    if (ctftimeEvent.format)
      embed.addFields({
        name: '⚙️ **Format**',
        value: ctftimeEvent.format,
        inline: false,
      });
    if (ctftimeEvent.weight)
      embed.addFields({
        name: '🎯 **Weight**',
        value: ctftimeEvent.weight,
        inline: false,
      });
  }

  return embed;
};

export class CTFEditButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfrawInfo_edit';
  ctfRawInfo: CTFRawInfo;

  constructor(init: ComponentInit, ctfRawInfo: CTFRawInfo) {
    super(init);
    this.ctfRawInfo = ctfRawInfo;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setEmoji('✏️')
      .setLabel('Edit')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Secondary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    const modalCustomId = `ctfrawinfo_editmodal::${this.attachId}::${Date.now()}`;

    const now = new Date();
    now.setMinutes(0);
    const formattedNow = dateToString(now);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(0);
    const formattedTomorrow = dateToString(tomorrow);

    const dateStartTextInput = new TextInputBuilder()
      .setCustomId(`${modalCustomId}::datestart`)
      .setLabel('📆 CTF Start (KST, 24-hour format)')
      .setMaxLength(128)
      .setRequired(true)
      .setPlaceholder('ex) 2020-10-09T14:00')
      .setValue(formattedNow)
      .setStyle(TextInputStyle.Short);

    const dateEndTextInput = new TextInputBuilder()
      .setCustomId(`${modalCustomId}::dateend`)
      .setLabel('📆 CTF End (YYYY-MM-DDTHH:MM)')
      .setMaxLength(128)
      .setRequired(true)
      .setPlaceholder('ex) 2020-10-11T19:00')
      .setValue(formattedTomorrow)
      .setStyle(TextInputStyle.Short);

    if (this.ctfRawInfo.date[0]) {
      dateStartTextInput.setValue(dateToString(this.ctfRawInfo.date[0]));
    }

    if (this.ctfRawInfo.date[1]) {
      dateEndTextInput.setValue(dateToString(this.ctfRawInfo.date[1]));
    }

    const modal = new ModalBuilder()
      .setTitle('Edit CTF Info')
      .setCustomId(modalCustomId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`${modalCustomId}::name`)
            .setLabel('🚩 CTF Name')
            .setMaxLength(128)
            .setRequired(true)
            .setPlaceholder('ctf name...')
            .setValue(this.ctfRawInfo.name)
            .setStyle(TextInputStyle.Short),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          dateStartTextInput,
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          dateEndTextInput,
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`${modalCustomId}::location`)
            .setLabel('🌏 CTF Location')
            .setMaxLength(128)
            .setRequired(false)
            .setPlaceholder('Leave blank for online.')
            .setStyle(TextInputStyle.Short),
        ),
      );

    await interaction.showModal(modal);

    const submission = await interaction
      .awaitModalSubmit({ filter: (i) => i.customId === modalCustomId, time: 300_000 })
      .catch(() => null);

    if (!submission) return;

    await submission.deferUpdate();
    const rawInfo = this.ctfRawInfo;

    rawInfo.name = submission.fields.getTextInputValue(
      `${modalCustomId}::name`,
    );

    const dateStartStr = submission.fields.getTextInputValue(
      `${modalCustomId}::datestart`,
    );
    const dateEndStr = submission.fields.getTextInputValue(
      `${modalCustomId}::dateend`,
    );
    rawInfo.date = [stringToDate(dateStartStr), stringToDate(dateEndStr)];

    const locationStr = submission.fields.getTextInputValue(
      `${modalCustomId}::location`,
    );
    rawInfo.location = locationStr || undefined;

    let valid = true;
    let invalidMessage = '';

    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (
      !dateFormatRegex.test(dateStartStr) ||
      !dateFormatRegex.test(dateEndStr)
    ) {
      valid = false;
      invalidMessage =
        '❌ Invalid date format. Use YYYY-MM-DDTHH:MM.';
    } else if (rawInfo.date[0].getTime() >= rawInfo.date[1].getTime()) {
      valid = false;
      invalidMessage =
        '❌ Start time must be before end time.';
    } else if (
      rawInfo.date[1].getTime() - rawInfo.date[0].getTime() <
      60 * 60 * 1000
    ) {
      valid = false;
      invalidMessage =
        '❌ Duration too short. Minimum 1 hour.';
    } else if (rawInfo.date[1].getTime() - Date.now() < 60 * 60 * 1000) {
      valid = false;
      invalidMessage =
        '❌ End time must be at least 1 hour from now.';
    }

    const init: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 1800,
    };

    const [fromCTFTimeEmbed, fromCTFTimeButtons] = [
      ctfInfoEmbed(rawInfo),
      [
        new CTFEditButton(init, rawInfo).build(),
        new CTFConfirmButton(init, rawInfo, valid).build(),
      ],
    ];

    await submission.editReply({
      content: '',
      embeds: [fromCTFTimeEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...fromCTFTimeButtons,
        ),
      ],
    });

    if (invalidMessage) {
      await submission.followUp({
        content: invalidMessage,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export class CTFConfirmButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfrawInfo_confirm';
  ctfRawInfo: CTFRawInfo;
  valid: boolean;

  constructor(
    init: ComponentInit,
    ctfRawInfo: CTFRawInfo,
    valid: boolean = false,
  ) {
    super(init);
    this.ctfRawInfo = ctfRawInfo;
    this.valid = valid;
  }

  build(): ButtonBuilder {
    const button = new ButtonBuilder()
      .setEmoji('✅')
      .setLabel('Confirm')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Primary);

    if (!this.ctfRawInfo.date[0] || !this.ctfRawInfo.name || !this.valid)
      button.setDisabled(true);

    return button;
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    await interaction.deferUpdate();
    await interaction.editReply({
      content: '',
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setDescription('Creating channels...'),
      ],
      components: [],
    });

    const ctfResult = await createCTFChannels(this.client, this.ctfRawInfo);

    if (isErr(ctfResult)) {
      const rawInfo = this.ctfRawInfo;
      const init: ComponentInit = {
        client: this.client,
        attachId: this.attachId,
        timeout: 1800,
      };
      const [fromCTFTimeEmbed, fromCTFTimeButtons] = [
        ctfInfoEmbed(rawInfo).setColor(Colors.Red),
        [
          new CTFEditButton(init, rawInfo).build(),
          new CTFConfirmButton(init, rawInfo).build(),
        ],
      ];

      await interaction.editReply({
        content:
          `❌ ${t('error.unexpected', lang)}\n${ctfResult.error.message}`,
        embeds: [fromCTFTimeEmbed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...fromCTFTimeButtons,
          ),
        ],
      });
      return;
    }
    const createdCTF = ctfResult.value;

    audit.info(
      '%s (%s) created CTF "%s" (start: %s, end: %s)',
      interaction.user.username,
      interaction.user.id,
      createdCTF.name,
      this.ctfRawInfo.date[0]?.toISOString() ?? 'N/A',
      this.ctfRawInfo.date[1]?.toISOString() ?? 'N/A',
    );

    const eventResult = await createCTFScheduledEvent(this.client, this.ctfRawInfo);
    const eventUrl = isOk(eventResult) ? `\n${eventResult.value.url}` : '';
    await interaction.editReply({
      content: `✅ **${createdCTF.name}** CTF created.${eventUrl}`,
      embeds: [],
      components: [],
    });

    const noteChannelResult = await fetchTextChannel(
      this.client.guild,
      createdCTF.guild_channels.notes,
      '노트 채널',
    );

    if (isOk(noteChannelResult) && isOk(eventResult)) {
      await noteChannelResult.value.send(eventResult.value.url);
    }

    if (!this.client.config.ctf_notice_channel) return;

    const announceInit: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 1800,
    };
    const createdCTFAnnouncementButton = new CTFAnnounceButton(
      announceInit,
      this.ctfRawInfo,
      createdCTF,
    );

    await interaction.followUp({
      content: 'Send an announcement?',
      embeds: [],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          createdCTFAnnouncementButton.build(),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

    // If CTFTime event has a website, store it as the CTF URL
    if (this.ctfRawInfo.ctftimeEvent?.website) {
      await this.client.ctfService.updateCTF(createdCTF.name, {
        credentials: {
          ...createdCTF.credentials,
          url: this.ctfRawInfo.ctftimeEvent.website,
        },
      });

      const credsInit: ComponentInit = {
        client: this.client,
        attachId: interaction.id,
        timeout: 600,
      };

      await interaction.followUp({
        content:
          'You can register credentials. Press below if needed.',
        embeds: [],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new CredentialsAddButton(
              credsInit,
              createdCTF,
              this.ctfRawInfo.ctftimeEvent.website,
            ).build(),
            new CredentialsRegisterButton(
              credsInit,
              createdCTF,
              this.ctfRawInfo.ctftimeEvent.website,
            ).build(),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
