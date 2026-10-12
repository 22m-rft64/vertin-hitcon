import { Guild, TextChannel } from 'discord.js';
import { Result, tryAsyncWith } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';
import { IActivityFeed } from '@ports/activityfeed';

export class DiscordActivityFeed implements IActivityFeed {
  private readonly guild: Guild;

  constructor(guild: Guild) {
    this.guild = guild;
  }

  private async sendToFeed(
    channelId: string,
    content: string,
  ): Promise<Result<void, ServiceError>> {
    return tryAsyncWith(
      async () => {
        const channel = await this.guild.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
          throw new Error('Activity feed channel not found or not text-based');
        }
        await (channel as TextChannel).send(content);
      },
      (e) => ServiceError.notificationError('send activity feed', e),
    );
  }

  async onWorkerJoin(
    feedChannelId: string,
    challengeName: string,
    category: string,
    userId: string,
  ): Promise<Result<void, ServiceError>> {
    return this.sendToFeed(
      feedChannelId,
      `<@${userId}> joined ${category}/${challengeName}`,
    );
  }

  async onWorkerIdle(
    feedChannelId: string,
    challengeName: string,
    category: string,
    userId: string,
  ): Promise<Result<void, ServiceError>> {
    return this.sendToFeed(
      feedChannelId,
      `💤 <@${userId}> stepped away from ${category}/${challengeName}`,
    );
  }

  async onChallengeSolve(
    feedChannelId: string,
    challengeName: string,
    category: string,
    solverIds: string[],
  ): Promise<Result<void, ServiceError>> {
    const mentions = solverIds.map((id) => `<@${id}>`).join(', ');
    return this.sendToFeed(
      feedChannelId,
      `✅ ${mentions} solved ${category}/${challengeName}`,
    );
  }

  async onChallengeUnsolve(
    feedChannelId: string,
    challengeName: string,
    category: string,
  ): Promise<Result<void, ServiceError>> {
    return this.sendToFeed(
      feedChannelId,
      `${category}/${challengeName} -- solve reverted`,
    );
  }

  async onScoreUpdate(
    feedChannelId: string,
    message: string,
  ): Promise<Result<void, ServiceError>> {
    return this.sendToFeed(feedChannelId, message);
  }
}
