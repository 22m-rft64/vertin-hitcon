import { createLogger } from '@discordutils/logger';
import { Client, GatewayIntentBits, Guild } from 'discord.js';
import CommandHandler from '@handlers/commandhandler';
import { registerEventHandlers } from '@handlers/eventhandler';
import { ComponentRegistry } from '@handlers/componentregistry';
import { ScheduleHandler } from '@handlers/schedulehandler';
import mongoose from 'mongoose';
import VertinConfigModel from '@adapters/mongo/schemas/vertinconfig';
import { registerWorkonFactory, registerWorkonIdleFactory } from './components/buttons/ctfworkon';
import { registerJoinFactory } from '@commands/ctf/subcommands/assign/ctfjoinbutton';

// Core services & adapters
import { MongoCTFRepository } from '@adapters/mongo/CTFRepository';
import { CTFService } from '@services/CTFService';
import { ChallengeService } from '@services/ChallengeService';
import { PullService } from '@services/PullService';
import { DiscordActivityFeed } from '@adapters/discord/DiscordActivityFeed';
import { TranslationService } from '@services/TranslationService';
import { pruneOldTimestamps } from './ctf/threadtracker';
import { registerAutoPull } from '@commands/ctf/subcommands/pull';
import { rebuildAllAnnouncements } from './ctf/discordutil';

const log = createLogger('VertinClient');

export const VERTIN_COLOR = '#d8cfae';
export const VERTIN_CTF_NOTICE_CHANNEL = process.env.CTF_NOTICE_CHANNEL;

interface VertinClientConfig {
  guild_id: string;
  ctf_notice_channel: string;
}

export class VertinClient extends Client {
  public ctfService: CTFService;
  public challengeService: ChallengeService;
  public pullService: PullService;
  public translationService: TranslationService;

  public commandHandler: CommandHandler;
  public componentRegistry: ComponentRegistry;
  public scheduleHandler: ScheduleHandler;

  public db: typeof mongoose;

  // Single-guild assumption
  public guild: Guild;
  public config: VertinClientConfig;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
      ],
    });

    this.db = mongoose;
    this.commandHandler = new CommandHandler(this);
    this.componentRegistry = new ComponentRegistry();
    this.scheduleHandler = new ScheduleHandler(this);
  }

  async init() {
    await registerEventHandlers(this);
    try {
      await this.db.connect(process.env.MONGODB_URI);
      log.info('DB connected');
    } catch (error) {
      log.error('MongoDB connection failed', error);
      process.exit(1);
    }

    this.guild = await this.guilds.fetch(process.env.GUILD_ID);
    let config = await VertinConfigModel.findOne({
      guild_id: this.guild.id,
    });

    if (!VERTIN_CTF_NOTICE_CHANNEL) {
      log.error('Required env var missing (CTF_NOTICE_CHANNEL)');
      return process.exit(1);
    }

    if (!config) {
      config = new VertinConfigModel({
        guild_id: this.guild.id,
        ctf_notice_channel: VERTIN_CTF_NOTICE_CHANNEL,
      });
    }

    this.config = {
      guild_id: config.guild_id,
      ctf_notice_channel: config.ctf_notice_channel,
    };

    await config.save();

    // Wire up core services
    this.translationService = new TranslationService();
    const ctfRepo = new MongoCTFRepository();
    const activityFeed = new DiscordActivityFeed(this.guild);

    this.ctfService = new CTFService(ctfRepo);

    this.challengeService = new ChallengeService(
      ctfRepo, this.ctfService, activityFeed,
    );

    this.pullService = new PullService(this.challengeService, this.ctfService);

    await this.ctfService.init();

    await this.commandHandler.loadCommands();
    await this.commandHandler.deployCommands();

    registerWorkonFactory(this.componentRegistry);
    registerWorkonIdleFactory(this.componentRegistry);
    registerJoinFactory(this.componentRegistry);
    await this.componentRegistry.restoreFromDB(this);

    // ended_at이 지났는데 ended=false인 CTF 자동 수정
    const activeCTFs = this.ctfService.listActiveCTFs();
    for (const ctf of activeCTFs) {
      if (!ctf.ended && ctf.ended_at && ctf.ended_at.getTime() <= Date.now()) {
        log.info('Auto-marking "%s" as ended (ended_at already passed)', ctf.name);
        await this.ctfService.updateCTF(ctf.name, { ended: true });
      }
    }

    // 활성 CTF: autopull 등록 + announcements 리빌드
    for (const ctf of activeCTFs) {
      if (ctf.ended || ctf.archived) continue;

      if (ctf.credentials.url && ctf.credentials.teamToken) {
        registerAutoPull(this, ctf);
      }
      rebuildAllAnnouncements(this, ctf).catch((err) => {
        log.error('Failed to rebuild announcements for "%s"', ctf.name, err);
      });
    }

    setInterval(pruneOldTimestamps, 5 * 60_000);
  }
}
