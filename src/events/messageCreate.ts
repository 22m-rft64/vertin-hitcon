import { Events } from 'discord.js';
import { DiscordEvent } from '@discordtypes/event';
import { recordThreadMessage } from '@discordutils/ctf/threadtracker';

const messageCreate: DiscordEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  once: false,
  async execute(client, message): Promise<void> {
    if (message.author.bot) return;
    if (!message.channel.isThread()) return;

    // 챌린지 스레드인지 확인
    const activeCTFs = client.ctfService.listActiveCTFs();
    const isChallengeThread = activeCTFs.some((ctf) => {
      for (const challenge of ctf.challenges.values()) {
        if (challenge.thread === message.channel.id) return true;
      }
      return false;
    });

    if (!isChallengeThread) return;

    recordThreadMessage(message.channel.id);
  },
};

export default messageCreate;
