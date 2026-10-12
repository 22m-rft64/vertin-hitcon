import { Component, ComponentInit } from '@discordutils/components/component';
import { CTFCredentials } from '@core/models/CTF';
import { isErr } from '@discordtypes/result';
import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { fetchTextChannelFromClient, findCtfByInteraction } from '@discordutils/ctf/safefetch';
import { isOk } from '@discordtypes/result';
import { createLogger } from '@discordutils/logger';
import { t, resolveLocale } from '@i18n/index';

const audit = createLogger('Audit:CTF');

interface CredentialsFormOptions {
  url: string;
  ctfName?: string;
}

export class CredentialsForm extends Component<ModalSubmitInteraction> {
  static override actionName = 'credentials';
  url: string;
  ctfName?: string;

  constructor(init: ComponentInit, options: CredentialsFormOptions) {
    super(init);
    this.url = options.url;
    this.ctfName = options.ctfName;
  }

  build(): ModalBuilder {
    const addcredsModal = new ModalBuilder()
      .setCustomId(this.customId)
      .setTitle('Add CTF Credentials');

    const [usernameInput, passwordInput, emailInput, inviteInput, tokenInput] =
      getTextInputs(this.customId);

    addcredsModal.addComponents([
      new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        passwordInput.setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        emailInput.setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        tokenInput.setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        inviteInput.setRequired(false),
      ),
    ]);

    return addcredsModal;
  }

  async execute(interaction: ModalSubmitInteraction): Promise<void> {
    await interaction.deferReply();

    const msg = '✅ Credentials added.';

    const username = interaction.fields.getTextInputValue(
      `${this.customId}username`,
    );
    const password = interaction.fields.getTextInputValue(
      `${this.customId}password`,
    );
    const invite = interaction.fields.getTextInputValue(
      `${this.customId}invite`,
    );
    const teamToken = interaction.fields.getTextInputValue(
      `${this.customId}token`,
    );

    const credentials = Credentials({
      url: this.url,
      username,
      password,
      invite,
      teamToken,
      _message: [
        `CTF platform: ${this.url}`,
        invite ? `Invite link: ${invite}` : '',
        '```yaml',
        `Username: ${username}`,
        password ? `Password: ${password}` : '',
        teamToken ? `Token: ${teamToken}` : '',
        '```',
      ].filter(Boolean).join('\n'),
    });

    const ctfResult = this.ctfName
      ? await this.client.ctfService.getCTF({ name: this.ctfName })
      : await findCtfByInteraction(interaction, this.client.ctfService);

    if (isErr(ctfResult) || !ctfResult.value) {
      const lang = resolveLocale(interaction.locale);
      await interaction.followUp({
        content: t('credentials.error_fetch', lang),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const ctf = ctfResult.value;

    const credsResult = await fetchTextChannelFromClient(
      this.client,
      ctf.guild_channels.credentials,
      '크레덴셜 채널',
    );
    if (isOk(credsResult)) {
      await credsResult.value.bulkDelete(20);
      await credsResult.value.send({ content: credentials._message, embeds: [] });
    }

    await this.client.ctfService.updateCredentials(ctf.name, credentials);

    audit.info(
      '%s (%s) updated credentials for "%s" (url: %s)',
      interaction.user.username,
      interaction.user.id,
      ctf.name,
      credentials.url ?? 'none',
    );

    await interaction.followUp({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}

export const Credentials = (data: Partial<CTFCredentials>): CTFCredentials => ({
  url: data.url || null,
  username: data.username || null,
  password: data.password || null,
  email: data.email || null,
  invite: data.invite || null,
  teamToken: data.teamToken || null,
  _message: data._message || null,
} satisfies CTFCredentials);

const getTextInputs = (customId: string): TextInputBuilder[] => {
  const usernameInput = new TextInputBuilder()
    .setCustomId(`${customId}username`)
    .setLabel('Username')
    .setPlaceholder('Enter your username...')
    .setStyle(TextInputStyle.Short);

  const passwordInput = new TextInputBuilder()
    .setCustomId(`${customId}password`)
    .setLabel('Password')
    .setPlaceholder('Enter your password...')
    .setStyle(TextInputStyle.Short);

  const emailInput = new TextInputBuilder()
    .setCustomId(`${customId}email`)
    .setLabel('Email')
    .setPlaceholder('example@example.com')
    .setStyle(TextInputStyle.Short);

  const inviteInput = new TextInputBuilder()
    .setCustomId(`${customId}invite`)
    .setLabel('Invite link')
    .setPlaceholder('Enter your team invite URL...')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(512);

  const tokenInput = new TextInputBuilder()
    .setCustomId(`${customId}token`)
    .setLabel('Token')
    .setPlaceholder('Session cookie (session=...; cf_clearance=...)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(2048);

  return [usernameInput, passwordInput, emailInput, inviteInput, tokenInput];
};
