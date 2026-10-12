import {
  BaseInteraction,
  CategoryChannel,
  ChannelType,
  Client,
  Guild,
  Role,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import { Err, Ok, Result, isErr } from '@discordtypes/result';
import { SlashCommandError } from '@discordtypes/slashcommand';
import { CTF } from '@core/models/CTF';
import { ServiceError } from '@core/errors/ServiceError';
import { CTFService } from '@services/CTFService';

export const fetchTextChannel = async (
  guild: Guild,
  channelId: string,
  label = 'text channel',
): Promise<Result<TextChannel, SlashCommandError>> => {
  const channel = await guild.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return Err(new SlashCommandError(`${label} not found`));
  }
  return Ok(channel as TextChannel);
};

export const fetchCategoryChannel = async (
  guild: Guild,
  channelId: string,
  label = 'category channel',
): Promise<Result<CategoryChannel, SlashCommandError>> => {
  const channel = await guild.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildCategory) {
    return Err(new SlashCommandError(`${label} not found`));
  }
  return Ok(channel as CategoryChannel);
};

export const fetchRole = async (
  guild: Guild,
  roleId: string,
  label = 'role',
): Promise<Result<Role, SlashCommandError>> => {
  const role = await guild.roles.fetch(roleId);
  if (!role) {
    return Err(new SlashCommandError(`${label} not found`));
  }
  return Ok(role);
};

export const fetchTextChannelFromClient = async (
  client: Client,
  channelId: string,
  label = 'text channel',
): Promise<Result<TextChannel, SlashCommandError>> => {
  const channel = await client.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return Err(new SlashCommandError(`${label} not found`));
  }
  return Ok(channel as TextChannel);
};

export const fetchThreadChannel = async (
  client: Client,
  channelId: string,
  label = 'thread channel',
): Promise<Result<ThreadChannel, SlashCommandError>> => {
  const channel = await client.channels.fetch(channelId);
  if (
    !channel
    || (channel.type !== ChannelType.PublicThread
      && channel.type !== ChannelType.PrivateThread)
  ) {
    return Err(new SlashCommandError(`${label} not found`));
  }
  return Ok(channel as ThreadChannel);
};

/**
 * interaction의 채널에서 category ID를 추출한다.
 * 스레드인 경우 부모 채널의 카테고리를 반환.
 */
export const getCategoryId = (interaction: BaseInteraction): string | null => {
  const { channel } = interaction;
  if (!channel) return null;

  if (
    channel.type === ChannelType.PublicThread
    || channel.type === ChannelType.PrivateThread
  ) {
    return channel.parent?.parentId ?? null;
  }

  return channel.parentId ?? null;
};

/**
 * interaction이 CTF 채널 안에서 실행됐는지 확인하고, 해당 CTF를 반환.
 * ctfManager.inCtfChannel()의 core service 버전.
 */
export const findCtfByInteraction = async (
  interaction: BaseInteraction,
  ctfService: CTFService,
): Promise<Result<CTF | null, ServiceError>> => {
  const categoryId = getCategoryId(interaction);
  if (!categoryId) return Ok(null);
  return ctfService.getCTF({ guild_category: categoryId });
};
