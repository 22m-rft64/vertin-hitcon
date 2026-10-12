import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  PermissionsBitField,
  REST,
  Routes,
} from "discord.js";
import {
  SlashCommandType,
  type SlashCommand,
  type SlashCommandSubCommand,
} from "@discordtypes/slashcommand";
import fs from "fs";
import path from "path";

import { VertinClient } from "@discordutils/vertinclient";
import { createLogger } from "@discordutils/logger";
import { translateCommand, translateContextCommand, translateUserCommand } from '@commands/general/translate';
import { t, resolveLocale } from '@i18n/index';

const log = createLogger('CommandHandler');

interface ContextMenuCommand {
  data: { name: string; toJSON(): unknown };
  execute(client: VertinClient, interaction: MessageContextMenuCommandInteraction): Promise<void>;
}

export default class CommandHandler {
  private commands: Map<string, SlashCommand>;
  private contextMenuCommands: Map<string, ContextMenuCommand>;
  private client: VertinClient;

  constructor(client: VertinClient) {
    this.commands = new Map();
    this.contextMenuCommands = new Map();
    this.client = client;
  }

  /*
   * 모든 명령어를 로드하는 메소드
   */
  public async loadCommands(): Promise<void> {
    // Context menu commands (register first to exclude from slash scan)
    this.contextMenuCommands.set(translateCommand.data.name, translateCommand);
    this.contextMenuCommands.set(translateContextCommand.data.name, translateContextCommand);
    this.contextMenuCommands.set(translateUserCommand.data.name, translateUserCommand);

    const commandDirs = ["general", "ctf"];
    const contextMenuNames = new Set(this.contextMenuCommands.keys());
    for (const dir of commandDirs) {
      const commandPath = path.join(__dirname, `../commands/${dir}`);
      const commandFiles = fs
        .readdirSync(commandPath)
        .filter((file) => file.endsWith(".ts"));

      for (const file of commandFiles) {
        const { default: command } = await import(`${commandPath}/${file}`);
        if (!command?.data?.name) continue;
        if (contextMenuNames.has(command.data.name)) continue;
        this.commands.set(command.data.name, command);
      }
    }

    log.info(
      'Loaded %d slash command(s), %d context menu command(s)',
      this.commands.size,
      this.contextMenuCommands.size,
    );
  }

  /**
   * 커맨드 배포하기(GuildCommand)
   */
  public async deployCommands(): Promise<void> {
    if (
      !process.env.GUILD_ID ||
      !process.env.CLIENT_ID ||
      !process.env.DISCORD_TOKEN
    ) {
      log.error('Missing env vars (GUILD_ID / CLIENT_ID / DISCORD_TOKEN)');
      return;
    }

    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN,
    );
    const commandList = [
      ...Array.from(this.commands.values()).map((v) => v.data),
      ...Array.from(this.contextMenuCommands.values()).map((v) => v.data),
    ];

    try {
      log.info('Deploying %d commands...', commandList.length);
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID,
        ),
        { body: commandList },
      );
      log.info('Commands deployed');
    } catch (error) {
      log.error('Failed to deploy commands', error);
    }
  }

  /**
   * 명령어 실행 핸들러
   */
  public async handleCommand(
    interaction: ChatInputCommandInteraction,
    client: VertinClient,
  ): Promise<void> {
    let command: SlashCommand | SlashCommandSubCommand = this.commands.get(
      interaction.commandName,
    );
    if (!command) {
      const lang = resolveLocale(interaction.locale);
      await generalReply(interaction, t('error.unknown_command', lang), true);
      return;
    }

    if (command.commandType === SlashCommandType.CTF) {
      command = command.subcommands.find(
        (subcmd) => subcmd.data.name === interaction.options.getSubcommand(),
      );

      if (!command) {
        const lang = resolveLocale(interaction.locale);
        await generalReply(
          interaction,
          t('error.unknown_subcommand', lang),
          true,
        );
        return;
      }
    }

    if (command.permissions) {
      const userPermissions = interaction.member
        ?.permissions as PermissionsBitField;
      if (!userPermissions.has(command.permissions, true)) {
        const lang = resolveLocale(interaction.locale);
        await generalReply(
          interaction,
          t('error.no_permission', lang),
          true,
        );
        return;
      }
    }

    try {
      const result = await command.execute(client, interaction);

      if (result.type === "err") {
        log.error('%s execution error: %s', command.data.name, result.error.message);
        await generalReply(interaction, `⚠️  ${result.error.message}`, true);
      }
    } catch (error) {
      log.error('%s unexpected error', command.data.name, error);
      const lang = resolveLocale(interaction.locale);
      await generalReply(
        interaction,
        t('error.unexpected', lang),
        true,
      );
    }
  }

  public async handleContextMenuCommand(
    interaction: MessageContextMenuCommandInteraction,
    client: VertinClient,
  ): Promise<void> {
    const command = this.contextMenuCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(client, interaction);
    } catch (error) {
      log.error('Context menu %s error', interaction.commandName, error);
      const canReply = !interaction.replied && !interaction.deferred;
      if (canReply) {
        const lang = resolveLocale(interaction.locale);
        await interaction.reply({
          content: t('error.unexpected', lang),
          ephemeral: true,
        }).catch(() => {});
      }
    }
  }

  public async handleAutocompletion(
    interaction: AutocompleteInteraction,
    client: VertinClient,
  ): Promise<void> {
    let command: SlashCommand | SlashCommandSubCommand = this.commands.get(
      interaction.commandName,
    );
    if (command.commandType === SlashCommandType.CTF) {
      command = command.subcommands.find(
        (subcmd) => subcmd.data.name === interaction.options.getSubcommand(),
      );
    }
    if (!command || !command.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(client, interaction);
    } catch (err) {
      log.error('Autocomplete error', err);
    }
  }
}

// 매번 edit이나 reply를 if문으로 거를수 없으니..
const generalReply = async (
  interaction: ChatInputCommandInteraction,
  content: string,
  ephemeral?: boolean,
): Promise<void> => {
  if (interaction.deferred) {
    await interaction.editReply({ content });
  } else {
    await interaction.reply({
      content,
      ephemeral,
    });
  }
};
