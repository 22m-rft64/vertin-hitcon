import { DiscordAPIError } from 'discord.js';
import { createLogger } from '@discordutils/logger';

const log = createLogger('Discord');

const IGNORABLE_CODES = new Set([
  10003, // Unknown Channel
  10008, // Unknown Message
  10011, // Unknown Role
  10062, // Unknown Interaction
]);

export const isDiscordNotFound = (error: unknown): boolean =>
  error instanceof DiscordAPIError && IGNORABLE_CODES.has(error.code as number);

export const warnUnexpectedError = (context: string, error: unknown): void => {
  if (!isDiscordNotFound(error)) {
    log.warn('%s: %O', context, error);
  }
};
