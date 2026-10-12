import {
  ChatInputCommandInteraction,
  PermissionsBitField,
  AutocompleteInteraction,
  SlashCommandSubcommandBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

import { VertinClient } from "@discordutils/vertinclient";

export type SlashCommand = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  commandType?: SlashCommandType;
  permissions?: PermissionsBitField;
  subcommands?: SlashCommandSubCommand[];
  autocomplete?: (
    client: VertinClient,
    interaction: AutocompleteInteraction,
  ) => Promise<void>;
  execute?: (
    // execute가 정의되지 않을때는 이거 자체로 subcommand만 쓰일때.
    // ex) CommandType이 CTF일때
    client: VertinClient,
    interaction: ChatInputCommandInteraction,
    utilArg?: unknown,
  ) => Promise<Result<void, SlashCommandError>>;
};

export type SlashCommandSubCommand = {
  data: SlashCommandSubcommandBuilder;
  permissions?: PermissionsBitField;
  autocomplete?: (
    client: VertinClient,
    interaction: AutocompleteInteraction,
  ) => Promise<void>;
  execute: (
    client: VertinClient,
    interaction: ChatInputCommandInteraction,
    utilArg?: unknown,
  ) => Promise<Result<void, SlashCommandError>>;
};

export enum SlashCommandType {
  GuildAdmin,
  General,
  System,
  CTF,
  CryptoTools,
  ETC,
}

export class SlashCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlashCommandError";
  }
}
