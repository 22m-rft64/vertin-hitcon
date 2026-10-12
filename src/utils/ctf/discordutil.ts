import { createLogger } from "@discordutils/logger";
import { normalizeCategory, CATEGORY_DISPLAY, ChallengeCategory } from "@core/models/Category";
import { t } from '@i18n/index';

const log = createLogger('DiscordUtil');
import { WorkonButton, WorkonIdleButton } from "@discordutils/components/buttons/ctfworkon";
import { VertinClient } from "@discordutils/vertinclient";
import { Challenge } from "@core/models/Challenge";
import { CTF, CTFCredentials } from "@core/models/CTF";
import {
  ActionRowBuilder,
  ButtonBuilder,
  CategoryChannel,
  ChannelType,
  Colors,
  EmbedBuilder,
  Guild,
  GuildScheduledEvent,
  MessageFlags,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventStatus,
  OverwriteResolvable,
  PermissionsBitField,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { CTFRawInfo } from "@commands/ctf/subcommands/assign/fromctfInfobutton";
import { Err, isErr, Ok, Result } from "@discordtypes/result";
import { getThreadActivity } from "./threadtracker";
import { SlashCommandError } from "@discordtypes/slashcommand";
import {
  fetchCategoryChannel,
  fetchTextChannel,
  fetchTextChannelFromClient,
} from "./safefetch";
import { withAsyncLock } from "./asynclock";

export const sanitizeChannelName = (name: string): string => {
  let sanitized = name.toLowerCase().replace(/\s+/g, '-');
  // Discord에서 금지하는 문자만 제거
  sanitized = sanitized.replace(/[/"#:<>@]/g, '');
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/^-|-$/g, '');
  return sanitized.slice(0, 100) || 'unnamed';
};

export const getChallengeCategoryChannel = async (
  guild: Guild,
  ctfCategoryChannel: CategoryChannel,
  category: string,
): Promise<TextChannel> => {
  const channelName = sanitizeChannelName(category);

  for (const prefix of ["💤", "🔄", "🎯"]) {
    const fullChannelName = `${prefix}-${channelName}`;

    // 먼저 캐시에서 탐색
    let foundChannel = guild.channels.cache.find(
      (channel): channel is TextChannel =>
        channel.type === ChannelType.GuildText &&
        channel.name === fullChannelName &&
        channel.parentId === ctfCategoryChannel.id,
    );

    if (foundChannel) return foundChannel;

    // 캐시에 없으면 API에서 직접 fetch
    const channels = await guild.channels.fetch();
    foundChannel = channels.find(
      (channel): channel is TextChannel =>
        channel.type === ChannelType.GuildText &&
        channel.name === fullChannelName &&
        channel.parentId === ctfCategoryChannel.id,
    );

    if (foundChannel) return foundChannel;
  }

  return await guild.channels.create({
    type: ChannelType.GuildText,
    name: `🔄-${channelName}`,
    defaultAutoArchiveDuration: 10080,
    parent: ctfCategoryChannel,
  });
};

// GuildMember[] -> Member Nickname 반환
export const markIfMaxed = async (
  challenges: Map<string, Challenge>,
  categoryTextChannel: TextChannel,
  category: string,
) => {
  const hasUnsolved = Array.from(challenges.values())
    .some((ch) => !ch.solved && ch.category === category);
  if (hasUnsolved) return;

  if (categoryTextChannel.name.startsWith("🔄")) {
    await categoryTextChannel.edit({
      name: categoryTextChannel.name.replace("🔄", "🎯"),
    });
  }
};

// ---------------------------------------
// Category Group Announcement Helpers
// ---------------------------------------

export interface ThreadActivityData {
  messageCount: number;
  recentCount: number;
  lastActive: number | null;
}

const formatActivitySuffix = (activity: ThreadActivityData): string => {
  if (activity.messageCount === 0) return ', 💬 0';
  const recent = activity.recentCount > 0
    ? ` (${activity.recentCount} in last 30m)`
    : '';
  const lastActive = activity.lastActive
    ? `, <t:${Math.floor(activity.lastActive / 1000)}:R>`
    : '';
  return `, 💬 ${activity.messageCount}${recent}${lastActive}`;
};

const buildUnsolvedFieldValue = (
  c: Challenge,
  activity?: ThreadActivityData,
): string => {
  const lines: string[] = [];

  if (c.players.length > 0) {
    lines.push(`🔥 ${c.players.map((id) => `<@${id}>`).join(', ')}`);
  }
  if (c.idleWorkers.length > 0) {
    lines.push(`💤 ${c.idleWorkers.map((id) => `<@${id}>`).join(', ')}`);
  }
  if (lines.length === 0) {
    lines.push('No one here yet.');
  }

  if (activity && activity.messageCount > 0) {
    lines.push(formatActivitySuffix(activity).replace(/^, /, ''));
  }

  if (c.thread) {
    lines.push(`[→ thread](https://discord.com/channels/-/${c.thread})`);
  }

  return lines.join('\n');
};

export const buildCategoryEmbeds = (
  category: string,
  challenges: Challenge[],
  threadActivity?: Map<string, ThreadActivityData>,
): EmbedBuilder[] => {
  const display = CATEGORY_DISPLAY[category as ChallengeCategory];
  const title = display
    ? `${display.emoji} ${display.label}`
    : `📋 ${category.toUpperCase()}`;

  const solvedCount = challenges.filter((c) => c.solved).length;
  const totalCount = challenges.length;

  // 정렬: 🚨 아무도 없음 → ❌ 진행 중 → ✅ solved
  const noWorkers = challenges
    .filter((c) => !c.solved && c.players.length === 0 && c.idleWorkers.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const hasWorkers = challenges
    .filter((c) => !c.solved && (c.players.length > 0 || c.idleWorkers.length > 0))
    .sort((a, b) => a.name.localeCompare(b.name));
  const solved = challenges
    .filter((c) => c.solved)
    .sort((a, b) => a.name.localeCompare(b.name));

  let color: number = Colors.Blue;
  if (solvedCount === totalCount && totalCount > 0) {
    color = Colors.Green;
  } else if (solvedCount > 0) {
    color = Colors.DarkGold;
  }

  if (totalCount === 0) {
    const embed = new EmbedBuilder()
      .setTitle(`${title} — 0/0 solved`)
      .setDescription('No challenges yet.')
      .setColor(color);
    return [embed];
  }

  // unsolved 필드들을 만들어놓기
  const allUnsolved = [...noWorkers, ...hasWorkers];
  const unsolvedFields = allUnsolved.map((c) => {
    const activity = threadActivity?.get(c._id);
    const prefix = (c.players.length === 0 && c.idleWorkers.length === 0) ? '🚨' : '❌';
    const rawValue = buildUnsolvedFieldValue(c, activity);
    return {
      name: `${prefix} ${c.name}`.slice(0, 256),
      value: (rawValue || '-').slice(0, 1024),
      inline: true,
    };
  });

  // solved 필드 (하나로 모아서)
  const solvedField = solved.length > 0
    ? {
      name: `Solved (${solved.length})`,
      value: solved.map((c) => {
        const mentions = c.solvers.slice(0, 2).map((id) => `<@${id}>`);
        const remaining = c.solvers.length - 2;
        const solverText = remaining > 0
          ? `${mentions.join(', ')} +${remaining}`
          : mentions.join(', ');
        return `✅ **${c.name}** — ${solverText}`;
      }).join('\n').slice(0, 1024),
      inline: false,
    }
    : null;

  // 25개씩 끊어서 임베드 분할
  const MAX_FIELDS = solvedField ? 24 : 25;
  const embeds: EmbedBuilder[] = [];

  for (let i = 0; i < unsolvedFields.length; i += MAX_FIELDS) {
    const chunk = unsolvedFields.slice(i, i + MAX_FIELDS);
    const isFirst = i === 0;
    const isLast = i + MAX_FIELDS >= unsolvedFields.length;

    const embed = new EmbedBuilder().setColor(color);

    if (isFirst) {
      embed.setTitle(`${title} — ${solvedCount}/${totalCount} solved`);
    }

    embed.addFields(chunk);

    // solved 필드는 마지막 임베드에만
    if (isLast && solvedField) {
      embed.addFields(solvedField);
    }

    embeds.push(embed);
  }

  // unsolved가 0개이고 solved만 있는 경우
  if (embeds.length === 0 && solvedField) {
    const embed = new EmbedBuilder()
      .setTitle(`${title} — ${solvedCount}/${totalCount} solved`)
      .setColor(color)
      .addFields(solvedField);
    embeds.push(embed);
  }

  return embeds;
};

export const rebuildCategoryAnnouncement = async (
  client: VertinClient,
  ctf: CTF,
  category: string,
  announcementChannel: TextChannel,
): Promise<void> => {
  const categoryChallenges = [...ctf.challenges.values()]
    .filter((c) => c.category === category);

  const announcementId = categoryChallenges.find((c) => c.announcement)?.announcement;
  if (!announcementId) return;

  // 스레드 활동 데이터 수집 (인메모리 트래커 — 봇 메시지 제외)
  const activityMap = new Map<string, ThreadActivityData>();
  for (const ch of categoryChallenges) {
    if (ch.solved) continue;
    const tracker = getThreadActivity(ch.thread);
    activityMap.set(ch._id, {
      messageCount: tracker.totalMessages,
      recentCount: tracker.recentCount,
      lastActive: tracker.lastActive,
    });
  }

  const embeds = buildCategoryEmbeds(category, categoryChallenges, activityMap);

  try {
    const msg = await announcementChannel.messages.fetch(announcementId);
    // Discord 메시지당 최대 10개 embed — 하나의 메시지에 모아서
    await msg.edit({
      embeds: embeds.slice(0, 10),
      components: [],
    });
  } catch (error) {
    log.error('Failed to rebuild category announcement for "%s"', category, error);
  }
};

/**
 * CTF의 모든 카테고리 announcements를 리빌드한다.
 * 봇 시작 시 한 번 호출하여 DB와 Discord 메시지를 동기화.
 */
export const rebuildAllAnnouncements = async (
  client: VertinClient,
  ctf: CTF,
): Promise<void> => {
  const announcementChannelId = ctf.guild_channels.announcements;
  if (!announcementChannelId) return;

  const channelResult = await fetchTextChannelFromClient(client, announcementChannelId, 'announcements');
  if (isErr(channelResult)) return;
  const announcementChannel = channelResult.value;

  const categories = new Set(
    [...ctf.challenges.values()].map((c) => c.category),
  );

  for (const category of categories) {
    try {
      await rebuildCategoryAnnouncement(client, ctf, category, announcementChannel);
    } catch (error) {
      log.error('Rebuild announcement failed for "%s::%s"', ctf.name, category, error);
    }
  }

  log.info('Rebuilt announcements for "%s" (%d categories)', ctf.name, categories.size);
};

const rebuildTimers = new Map<string, NodeJS.Timeout>();

export const debouncedRebuildCategoryAnnouncement = (
  client: VertinClient,
  ctf: CTF,
  category: string,
  announcementChannel: TextChannel,
  delayMs = 3000,
): void => {
  const key = `${ctf.name}::${category}`;
  const existing = rebuildTimers.get(key);
  if (existing) clearTimeout(existing);
  rebuildTimers.set(key, setTimeout(async () => {
    rebuildTimers.delete(key);
    try {
      await rebuildCategoryAnnouncement(client, ctf, category, announcementChannel);
    } catch (error) {
      log.error('Debounced rebuild failed for "%s::%s"', ctf.name, category, error);
    }
  }, delayMs));
};

export const buildWorkonEmbed = (
  challenge: Challenge,
  activity?: ThreadActivityData,
): EmbedBuilder => {
  const status = challenge.solved ? '✅' : '❌';
  const embed = new EmbedBuilder()
    .setTitle(`${status} ${challenge.name}`);

  if (challenge.solved) {
    const mentions = challenge.solvers.slice(0, 2).map((id) => `<@${id}>`);
    const remaining = challenge.solvers.length - 2;
    const solverText = remaining > 0
      ? `${mentions.join(', ')} and ${remaining} more`
      : mentions.join(', ');
    embed.setDescription(`solved by ${solverText}`);
    embed.setColor(Colors.Green);
  } else {
    const activitySuffix = activity ? formatActivitySuffix(activity) : '';
    const descParts: string[] = [];

    if (challenge.players.length > 0) {
      const activeMentions = challenge.players.map((id) => `<@${id}>`).join(', ');
      descParts.push(`🔥 ${activeMentions}`);
    }
    if (challenge.idleWorkers.length > 0) {
      const idleMentions = challenge.idleWorkers.map((id) => `<@${id}>`).join(', ');
      descParts.push(`💤 ${idleMentions}`);
    }

    if (descParts.length > 0) {
      embed.setDescription(`${descParts.join('\n')}${activitySuffix}`);
      embed.setColor(Colors.DarkGold);
    } else {
      const clickText = t('challenge.click_to_participate', 'en');
      const desc = activitySuffix
        ? `${clickText}${activitySuffix}`
        : clickText;
      embed.setDescription(desc);
      embed.setColor(Colors.DarkGold);
    }
  }

  return embed;
};

// ---------------------------------------
// Challenge Channel Util Functions
// ---------------------------------------
export const createChallengeChannel = async (
  client: VertinClient,
  ctf: CTF,
  guild: Guild,
  challengeName: string,
  challengeCategory: string,
): Promise<Result<{ challenge: Challenge; threadChannel: ThreadChannel }, SlashCommandError>> => {
  const normalizedCategoryName = normalizeCategory(challengeCategory);
  const lockKey = `${ctf.name}::${normalizedCategoryName}`;

  return withAsyncLock(lockKey, async () => {
    // fetch CTF category channel
    const categoryResult = await fetchCategoryChannel(
      guild,
      ctf.guild_category,
      'CTF category channel',
    );
    if (isErr(categoryResult)) return categoryResult;
    const categoryChannel = categoryResult.value;

    const challengeCategoryTextChannel = await getChallengeCategoryChannel(
      guild,
      categoryChannel,
      normalizedCategoryName,
    );

    const threadChannel = await challengeCategoryTextChannel.threads.create({
      name: `❌-${sanitizeChannelName(challengeName)}`,
      type: ChannelType.PublicThread,
    });

    // 멘션 트릭: CTF 역할 멤버 개별 멘션으로 스레드가 채널 목록에 뜨도록
    try {
      const role = await guild.roles.fetch(ctf.guild_role);
      if (role && role.members.size > 0) {
        const mentions = role.members.map((gm) => `<@${gm.id}>`).join(', ');
        const tempMsg = await threadChannel.send({
          content: '...',
          flags: MessageFlags.SuppressNotifications,
        });
        await tempMsg.edit(mentions);
        await tempMsg.delete();
      }
    } catch (error) {
      log.error('Failed to apply mention trick for thread %s', challengeName, error);
    }

    const announcementResult = await fetchTextChannel(
      guild,
      ctf.guild_channels.announcements,
      'announcements channel',
    );
    if (isErr(announcementResult)) return announcementResult;
    const announcementChannel = announcementResult.value;

    const createResult = await client.challengeService.createChallenge(ctf, {
      name: challengeName,
      category: normalizedCategoryName,
      thread: threadChannel.id,
    });

    if (isErr(createResult)) {
      return Err(new SlashCommandError(`Failed to create challenge: ${createResult.error.message}`));
    }
    const newChallenge = createResult.value;

    // 카테고리 채널에 WorkonButton + IdleButton 메시지 전송
    const workonButton = new WorkonButton(
      { client, attachId: newChallenge._id, timeout: null },
      newChallenge,
      ctf.name,
    );
    await workonButton.persist();

    const idleButton = new WorkonIdleButton(
      { client, attachId: newChallenge._id, timeout: null },
      newChallenge,
      ctf.name,
    );
    await idleButton.persist();

    const workonMsg = await challengeCategoryTextChannel.send({
      embeds: [buildWorkonEmbed(newChallenge)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          workonButton.build(),
          idleButton.build(),
        ),
      ],
    });

    const workonMsgResult = await client.challengeService.updateChallenge(ctf, newChallenge._id, {
      workon_message: workonMsg.id,
    });
    if (isErr(workonMsgResult)) {
      log.error('Error saving workon_message: %s', workonMsgResult.error.message);
    }

    // Announcements 대시보드 업데이트
    const existingAnnouncementId = [...ctf.challenges.values()]
      .find((c) => c.category === normalizedCategoryName && c.announcement && c._id !== newChallenge._id)
      ?.announcement;

    if (existingAnnouncementId) {
      const setResult = await client.challengeService.updateChallenge(
        ctf, newChallenge._id, { announcement: existingAnnouncementId },
      );
      if (isErr(setResult)) {
        log.error('Error setting announcement ID: %s', setResult.error.message);
      }
      await rebuildCategoryAnnouncement(client, ctf, normalizedCategoryName, announcementChannel);
    } else {
      const embeds = buildCategoryEmbeds(normalizedCategoryName, [newChallenge]);
      const msg = await announcementChannel.send({ embeds: embeds.slice(0, 10) });

      const updateResult = await client.challengeService.updateChallenge(ctf, newChallenge._id, {
        announcement: msg.id,
      });
      if (isErr(updateResult)) {
        log.error('Error updating challenge announcement: %s', updateResult.error.message);
      }
    }

    // 카테고리 채널 상태 업데이트
    await challengeCategoryTextChannel.edit({
      name: challengeCategoryTextChannel.name
        .replace("💤", "🔄")
        .replace("🎯", "🔄"),
    });

    return Ok({ challenge: newChallenge, threadChannel });
  });
};

export const createCTFChannels = async (
  client: VertinClient,
  ctfRawInfo: CTFRawInfo,
): Promise<Result<CTF, SlashCommandError>> => {
  const name = ctfRawInfo.name;
  const existCtfResult = await client.ctfService.getCTF({ name });

  if (isErr(existCtfResult)) {
    return Err(new SlashCommandError(`Error fetching CTF: ${existCtfResult.error.message}`));
  }

  if (existCtfResult.value) {
    return Err(new SlashCommandError('A CTF with that name already exists.'));
  }

  const guild = client.guild;

  // 역할 생성
  let role = guild.roles.cache.find((r) => r.name === name);
  if (!role) {
    role = await guild.roles.create({
      name,
      color: "Random",
      mentionable: true,
    });
  }

  const live = ctfRawInfo.date[0]
    ? Date.now() > ctfRawInfo.date[0].getTime()
    : false;

  //카테고리 생성
  const category = await guild.channels.create({
    name: `${live ? "🔴" : "⏰"} ${name}`,
    type: ChannelType.GuildCategory,
  });

  // 음성 general 채널 생성
  const generalVoiceChannel = await guild.channels.create({
    name: "general",
    type: ChannelType.GuildVoice,
    parent: category.id,
  });

  // 텍스트 general 채널 생성
  const generalChannel = await guild.channels.create({
    name: "general",
    type: ChannelType.GuildText,
    parent: category.id,
  });

  // 읽기전용 채널용 overwrites (누구나 볼 수 있으나 쓰기 불가)
  const readOnlyOverwrites: OverwriteResolvable[] = [
    {
      id: guild.roles.everyone.id,
      deny: new PermissionsBitField(["SendMessages"]).bitfield,
    },
  ];

  // 봇 명령어 채널
  const botCmdsChannel = await guild.channels.create({
    name: "🤖-bot-cmds",
    type: ChannelType.GuildText,
    parent: category.id,
  });

  // 읽기전용 채널들
  const credentialsChannel = await guild.channels.create({
    name: "🔑-credentials",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });
  const notesChannel = await guild.channels.create({
    name: "📝-notes",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });
  const announcementChannel = await guild.channels.create({
    name: "📣-announcements",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });
  const solvesChannel = await guild.channels.create({
    name: "🎉-solves",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });
  const scoreboardChannel = await guild.channels.create({
    name: "📈-scoreboard",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });
  const feedChannel = await guild.channels.create({
    name: "📡-feed",
    parent: category.id,
    permissionOverwrites: readOnlyOverwrites,
  });

  const ctfResult = await client.ctfService.createCTF({
    name,
    archived: false,
    ended: false,
    private: false,
    credentials: {
      url: null,
      username: null,
      password: null,
      email: null,
      invite: null,
      teamToken: null,
      _message: null,
    } as CTFCredentials,
    guild_role: role.id,
    guild_category: category.id,
    guild_channels: {
      general: generalChannel.id,
      announcements: announcementChannel.id,
      credentials: credentialsChannel.id,
      scoreboard: scoreboardChannel.id,
      solves: solvesChannel.id,
      notes: notesChannel.id,
      botCmds: botCmdsChannel.id,
      feed: feedChannel.id,
    },
  });

  if (isErr(ctfResult)) {
    await Promise.all([
      role.delete(),
      category.delete(),
      generalVoiceChannel.delete(),
      generalChannel.delete(),
      botCmdsChannel.delete(),
      credentialsChannel.delete(),
      announcementChannel.delete(),
      scoreboardChannel.delete(),
      solvesChannel.delete(),
      notesChannel.delete(),
      feedChannel.delete(),
    ]);
    return Err(new SlashCommandError('Error creating the CTF.'));
  }

  return Ok(ctfResult.value);
};

export const createCTFScheduledEvent = async (
  client: VertinClient,
  ctfRawInfo: CTFRawInfo,
): Promise<Result<GuildScheduledEvent, SlashCommandError>> => {
  const guild = client.guild;

  const scheduledEvents = new Map<string, string>();
  (await guild.scheduledEvents.fetch()).forEach((event) => {
    scheduledEvents.set(event.name, event.id);
  });

  const eventOptions: GuildScheduledEventCreateOptions = {
    name: ctfRawInfo.name,
    description: "",
    scheduledStartTime: ctfRawInfo.date[0],
    scheduledEndTime: ctfRawInfo.date[1],
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    entityMetadata: { location: ctfRawInfo.location ?? "on-line" },
  };

  const eventInfo = ctfRawInfo.ctftimeEvent;

  if (eventInfo) {
    // 이벤트 설명 구성
    const eventDescription =
      `${eventInfo.description || ""}\n\n👥 **Organizers**\n${eventInfo.organizers?.join(", ") || "N/A"}\n\n💰 **Prizes**\n${eventInfo.prizes || "N/A"}\n\n⚙️ **Format**\n${eventInfo.location || ""} ${eventInfo.format || ""}\n\n🎯 **Weight**\n${eventInfo.weight || "N/A"}`;
    eventOptions.description =
      eventDescription.length > 1000
        ? `${eventDescription.substring(0, 997)}...`
        : eventDescription;

    // 위치 정보 구성
    const location = `https://ctftime.org/event/${eventInfo.id} — ${eventInfo.website || ""}`;
    const truncatedLocation =
      location.length > 100 ? `${location.substring(0, 97)}...` : location;

    eventOptions.entityMetadata = { location: truncatedLocation };
  }

  // invalid date handling : eventOptions.scheduledStartTime이 현재 시각보다 과거면
  // 이벤트를 진행중인 이벤트로 처리하고 eventOptions.scheduledEndtime만 취급

  const now = new Date();
  let isStartInPast = false;

  if (ctfRawInfo.date[0] < now) {
    isStartInPast = true;
    // 시작 시간을 현재 시간보다 10분 미래로 설정
    const futureStartTime = new Date(now);
    futureStartTime.setMinutes(futureStartTime.getMinutes() + 10);
    eventOptions.scheduledStartTime = futureStartTime;
  }

  try {
    // 이미 존재하는 이벤트인 경우 업데이트
    if (scheduledEvents.has(eventOptions.name)) {
      const existingEvent = await guild.scheduledEvents.fetch(
        scheduledEvents.get(eventOptions.name)!,
      );
      await existingEvent.edit(eventOptions);
      // 시작 시간이 과거였다면 이벤트를 즉시 활성화
      if (isStartInPast) {
        await existingEvent.setStatus(GuildScheduledEventStatus.Active);
      }

      return Ok(existingEvent);
    }

    const createdEvent = await guild.scheduledEvents.create(eventOptions);
    const imageBuffer = eventInfo?.logo;
    // 시작 시간이 과거였다면 새로 생성된 이벤트를 즉시 활성화
    if (isStartInPast) {
      await createdEvent.setStatus(GuildScheduledEventStatus.Active);
    }

    // 이미지가 있으면 이미지도 설정
    if (imageBuffer) {
      await createdEvent.edit({
        image: imageBuffer,
      });
    }

    log.info('Created new scheduled event: %s', eventOptions.name);
    return Ok(createdEvent);
  } catch (error) {
    log.error('Error creating/updating event %s', eventOptions.name, error);
    return Err(new SlashCommandError('Error creating the event.'));
  }
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * UTC Date → KST 문자열 (YYYY-MM-DDTHH:MM)
 */
export const dateToString = (date: Date): string => {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  const hours = String(kst.getUTCHours()).padStart(2, '0');
  const minutes = String(kst.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * KST 문자열 (YYYY-MM-DDTHH:MM) → UTC Date
 */
export const stringToDate = (dateString: string): Date | null => {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!regex.test(dateString)) return null;

  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const utc = Date.UTC(year, month - 1, day, hours, minutes);
  return new Date(utc - KST_OFFSET_MS);
};

