import { Result } from '@discordtypes/result';
import { ServiceError } from '@core/errors/ServiceError';

export interface IActivityFeed {
  onWorkerJoin(
    feedChannelId: string,
    challengeName: string,
    category: string,
    userId: string,
  ): Promise<Result<void, ServiceError>>;

  onChallengeSolve(
    feedChannelId: string,
    challengeName: string,
    category: string,
    solverIds: string[],
  ): Promise<Result<void, ServiceError>>;

  onWorkerIdle(
    feedChannelId: string,
    challengeName: string,
    category: string,
    userId: string,
  ): Promise<Result<void, ServiceError>>;

  onChallengeUnsolve(
    feedChannelId: string,
    challengeName: string,
    category: string,
  ): Promise<Result<void, ServiceError>>;

  onScoreUpdate(
    feedChannelId: string,
    message: string,
  ): Promise<Result<void, ServiceError>>;
}
