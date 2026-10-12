/**
 * 이벤트 인자 중 guildId를 가진 첫 객체에서 길드를 읽는다.
 * guildId를 가진 인자가 없으면(ready 등) undefined, DM이면 null.
 */
const findEventGuildId = (args: unknown[]): string | null | undefined => {
  const source = args.find(
    (arg): arg is { guildId: unknown } => typeof arg === 'object' && arg !== null && 'guildId' in arg,
  );
  if (!source) {
    return undefined;
  }

  return typeof source.guildId === 'string' ? source.guildId : null;
};

/**
 * 봇은 GUILD_ID 서버 전용이다. 다른 서버나 DM에서 온 이벤트는 처리하지 않는다.
 */
export const isEventInScope = (args: unknown[], allowedGuildId: string | undefined): boolean => {
  const guildId = findEventGuildId(args);
  if (guildId === undefined) {
    return true;
  }

  return allowedGuildId !== undefined && guildId === allowedGuildId;
};
