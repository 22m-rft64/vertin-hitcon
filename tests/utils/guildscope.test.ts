import { describe, it, expect } from 'vitest';
import { isEventInScope } from '@discordutils/guildscope';

const HOME = '1554022471194116178';

describe('isEventInScope', () => {
  it('지정한 서버의 이벤트는 처리한다', () => {
    expect(isEventInScope([{ guildId: HOME }], HOME)).toBe(true);
  });

  it('다른 서버의 이벤트는 무시한다', () => {
    expect(isEventInScope([{ guildId: '111' }], HOME)).toBe(false);
  });

  it('DM(guildId null)은 무시한다', () => {
    expect(isEventInScope([{ guildId: null }], HOME)).toBe(false);
  });

  it('첫 인자가 null이어도 뒤 인자의 guildId로 판단한다', () => {
    expect(isEventInScope([null, { guildId: '111' }], HOME)).toBe(false);
    expect(isEventInScope([null, { guildId: HOME }], HOME)).toBe(true);
  });

  it('길드와 무관한 이벤트는 통과시킨다', () => {
    expect(isEventInScope([{ user: 'bot' }], HOME)).toBe(true);
  });

  it('GUILD_ID가 비어 있으면 길드 이벤트는 전부 막는다', () => {
    expect(isEventInScope([{ guildId: HOME }], undefined)).toBe(false);
  });
});
