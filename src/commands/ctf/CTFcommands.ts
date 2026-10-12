import {
  SlashCommand,
  SlashCommandType,
  SlashCommandSubCommand,
} from "@discordtypes/slashcommand";
import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { createLogger } from "@discordutils/logger";

import fs from "fs";
import path from "path";

const log = createLogger('Command');

const subcommandsDir = path.join(__dirname, "subcommands");
const subcommands: SlashCommandSubCommand[] = [];

const CTFCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ctf")
    .setDescription("CTF-related commands.")
    .setDescriptionLocalizations({ ko: 'CTF 관련 명령어야.', ja: 'CTF関連コマンド。', fi: 'CTF-komentoja.' }),
  commandType: SlashCommandType.CTF,
  // 불러온 모든 서브커맨드를 옵션으로 사용
  // execute functions are not provided, use subcommand's execute function at commandhandler.ts;
};

// 폴더 안의 모든 ts/js + 디렉토리/index.ts 파일을 읽어서 서브커맨드 객체를 불러오기
fs.readdirSync(subcommandsDir).forEach((item) => {
  const itemPath = path.join(subcommandsDir, item);
  const isDirectory = fs.statSync(itemPath).isDirectory();

  let subcommandPath: string;
  if (isDirectory) {
    // 디렉토리인 경우 index.ts 파일을 불러옴
    subcommandPath = path.join(itemPath, "index.ts");
    if (!fs.existsSync(subcommandPath)) return; // index.ts가 없으면 스킵
  } else if (item.endsWith(".ts")) {
    // .ts 파일인 경우 직접 불러옴
    subcommandPath = itemPath;
  } else {
    // 다른 형식의 파일은 스킵
    return;
  }

  try {
    const subcommand = require(subcommandPath).default;
    if (subcommand) {
      subcommands.push(subcommand);
      (CTFCommand.data as SlashCommandSubcommandsOnlyBuilder).addSubcommand(subcommand.data);
    }
  } catch (error) {
    log.error('Failed to load subcommand: %s', subcommandPath, error);
  }
});

CTFCommand.subcommands = subcommands;

export default CTFCommand;
