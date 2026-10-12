import { Challenge } from '@core/models/Challenge';

const DISCORD_MSG_CHAR_LIMIT = 2000;

/**
 * 챌린지 목록을 스코어보드 diff 포맷 문자열 배열로 변환.
 * 각 문자열은 Discord 메시지 제한(2000자) 이내.
 */
export function formatScoreboardChunks(challenges: Challenge[]): string[] {
  if (challenges.length === 0) return [];

  const sorted = [...challenges].sort((a, b) =>
    a.category !== b.category
      ? a.category.localeCompare(b.category)
      : a.name.localeCompare(b.name),
  );

  const nameWidth = Math.max(...sorted.map((c) => c.name.length)) + 10;
  const header =
    '```diff\n' +
    `  ${'Challenge'.padEnd(nameWidth)}` +
    'Category'.padEnd(30) +
    'Solved'.padEnd(30) +
    'Blood\n\n';
  const footer = '```';

  const chunks: string[] = [];
  let current = '';

  for (const ch of sorted) {
    const line =
      `${ch.solved ? '+' : '-'} ` +
      `${ch.name.padEnd(nameWidth)}` +
      `${ch.category.padEnd(30)}` +
      `${(ch.solved ? '✔️' : '❌').padEnd(30)}` +
      `${ch.blooded ? '🩸' : ''}\n`;

    if (header.length + current.length + line.length + footer.length > DISCORD_MSG_CHAR_LIMIT) {
      chunks.push(header + current + footer);
      current = line;
    } else {
      current += line;
    }
  }

  if (current) {
    chunks.push(header + current + footer);
  }

  return chunks;
}
