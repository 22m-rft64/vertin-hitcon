import { createLogger } from '@discordutils/logger';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { t, resolveLocale } from '@i18n/index';
import { Component, ComponentInit } from '@discordutils/components/component';
import { VertinClient } from '@discordutils/vertinclient';
import { CTFRawInfo } from './fromctfInfobutton';
import { CTF } from '@core/models/CTF';

const log = createLogger('AnnounceButton');
import { isErr, isOk } from '@discordtypes/result';
import { fetchTextChannelFromClient } from '@discordutils/ctf/safefetch';
import { CTFJoinButton } from './ctfjoinbutton';

export class CTFAnnounceButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfannounce_continue';
  ctfRawInfo: CTFRawInfo;
  newctf: CTF;

  constructor(init: ComponentInit, ctfRawInfo: CTFRawInfo, newctf: CTF) {
    super(init);
    this.ctfRawInfo = ctfRawInfo;
    this.newctf = newctf;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setLabel('Continue')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Primary);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    const { ctfRawInfo } = this;

    const description =
      '대회 : ' +
      `**${ctfRawInfo.name}**\n` +
      '일정 : ' +
      `<t:${Math.floor(ctfRawInfo.date[0].valueOf() / 1000)}:f> ~ ` +
      `<t:${Math.floor(ctfRawInfo.date[1].valueOf() / 1000)}:f>` +
      `(${Math.floor(Math.abs(ctfRawInfo.date[1].getTime() - ctfRawInfo.date[0].getTime()) / (1000 * 60 * 60))}h)`;

    const flow = new CTFAnnounceFlow(this.client, this.attachId, this.newctf, description);
    flow.render(interaction);
  }
}

const ctfAnnounceEmbed = (description: string): EmbedBuilder =>
  new EmbedBuilder()
    .setTitle(t('announce.preview_title', 'en'))
    .setDescription(description);

class CTFAnnounceFlow {
  private client: VertinClient;
  private attachId: string;
  private ctf: CTF;
  private announceMessage: string;

  constructor(
    client: VertinClient,
    attachId: string,
    ctf: CTF,
    initialMessage: string,
  ) {
    this.client = client;
    this.attachId = attachId;
    this.ctf = ctf;
    this.announceMessage = initialMessage;
  }

  getAnnounceMessage(): string {
    return this.announceMessage;
  }

  setAnnounceMessage(msg: string): void {
    this.announceMessage = msg;
  }

  async render(interaction: ButtonInteraction): Promise<void> {
    const init: ComponentInit = {
      client: this.client,
      attachId: this.attachId,
      timeout: 600,
    };

    const editButton = new CTFAnnounceEditButton(init, this);
    const confirmButton = new CTFAnnounceConfirmButton(init, this);

    await interaction.editReply({
      content: '',
      embeds: [ctfAnnounceEmbed(this.announceMessage)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          editButton.build(),
          confirmButton.build(),
        ),
      ],
    });
  }

  getCTF(): CTF {
    return this.ctf;
  }
}

class CTFAnnounceEditButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfannounce_edit';

  flow: CTFAnnounceFlow;

  constructor(init: ComponentInit, flow: CTFAnnounceFlow) {
    super(init);
    this.flow = flow;
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
    const modalCustomId = `ctfannounce_edit_modal::${Date.now()}`;

    const modal = new ModalBuilder()
      .setTitle(t('announce.modal_title', lang))
      .setCustomId(modalCustomId)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`${modalCustomId}::message`)
            .setLabel(t('announce.modal_label', lang))
            .setMaxLength(2048)
            .setRequired(true)
            .setPlaceholder(t('announce.modal_placeholder', lang))
            .setValue(this.flow.getAnnounceMessage())
            .setStyle(TextInputStyle.Paragraph),
        ),
      );

    await interaction.showModal(modal);

    const submission = await interaction
      .awaitModalSubmit({ filter: (i) => i.customId === modalCustomId, time: 300_000 })
      .catch(() => null);

    if (!submission) return;

    await submission.deferUpdate();
    const editedMessage = submission.fields.getTextInputValue(
      `${modalCustomId}::message`,
    );

    this.flow.setAnnounceMessage(editedMessage);
    await this.flow.render(interaction);
  }
}

class CTFAnnounceConfirmButton extends Component<ButtonInteraction> {
  static override actionName = 'ctfannounce_confirm';

  flow: CTFAnnounceFlow;

  constructor(init: ComponentInit, flow: CTFAnnounceFlow) {
    super(init);
    this.flow = flow;
  }

  build(): ButtonBuilder {
    return new ButtonBuilder()
      .setLabel('Confirm')
      .setCustomId(this.customId)
      .setStyle(ButtonStyle.Success);
  }

  async execute(interaction: ButtonInteraction): Promise<void> {
    const lang = resolveLocale(interaction.locale);
    await interaction.deferUpdate();
    const noticeResult = await fetchTextChannelFromClient(
      this.client,
      this.client.config.ctf_notice_channel,
      'announcements channel',
    );
    if (isErr(noticeResult)) {
      await interaction.editReply({
        content: `❌ ${noticeResult.error.message}`,
        embeds: [],
        components: [],
      });
      return;
    }
    const ctfNoticeChannel = noticeResult.value;
    const ctf = this.flow.getCTF();

    const joinInit: ComponentInit = {
      client: this.client,
      attachId: ctf.name,
      timeout: null,
    };

    const joinButton = new CTFJoinButton(joinInit, ctf);
    const noticemsg = await ctfNoticeChannel.send({
      content: this.flow.getAnnounceMessage(),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton.build()),
      ],
    });

    await joinButton.persist();

    const updateResult = await this.client.ctfService.updateCTF(ctf.name, { join_msg: noticemsg.id });
    if (isErr(updateResult)) {
      log.error('Error updating CTF join_msg: %s', updateResult.error.message);
    }

    await interaction.editReply({
      content: t('announce.sent', lang),
      embeds: [],
      components: [],
    });
  }
}
