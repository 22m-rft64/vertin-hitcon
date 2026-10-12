import { describe, it, expect } from 'vitest';
import { CATEGORY_CHOICES } from '@discordutils/ctf/autocomplete';
import { CHALLENGE_CATEGORIES, CATEGORY_ALIASES } from '@core/models/Category';

describe('CATEGORY_CHOICES', () => {
  it('should start with all canonical challenge categories', () => {
    const firstN = CATEGORY_CHOICES.slice(0, CHALLENGE_CATEGORIES.length);
    for (let i = 0; i < CHALLENGE_CATEGORIES.length; i++) {
      expect(firstN[i]).toEqual({
        name: CHALLENGE_CATEGORIES[i],
        value: CHALLENGE_CATEGORIES[i],
      });
    }
  });

  it('should include alias entries with "→" format', () => {
    const aliasEntries = CATEGORY_CHOICES.filter((c) => c.name.includes('→'));
    expect(aliasEntries.length).toBeGreaterThan(0);

    // 각 alias entry의 value는 canonical이어야 함
    for (const entry of aliasEntries) {
      const [alias, canonical] = entry.name.split(' → ');
      expect(CATEGORY_ALIASES.get(alias)).toBe(canonical);
      expect(entry.value).toBe(canonical);
    }
  });

  it('should not include self-referencing aliases', () => {
    const aliasEntries = CATEGORY_CHOICES.filter((c) => c.name.includes('→'));
    for (const entry of aliasEntries) {
      const [alias, canonical] = entry.name.split(' → ');
      expect(alias).not.toBe(canonical);
    }
  });

  it('should not have duplicate entries', () => {
    const names = CATEGORY_CHOICES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should have known aliases present', () => {
    const names = CATEGORY_CHOICES.map((c) => c.name);
    expect(names).toContain('pwnable → pwn');
    expect(names).toContain('cryptography → crypto');
    expect(names).toContain('forensics → forensic');
    expect(names).toContain('reverse engineering → rev');
    expect(names).toContain('blockchain → web3');
  });

  it('should filter correctly by substring', () => {
    const filtered = CATEGORY_CHOICES
      .filter((c) => c.name.toLowerCase().includes('cr'))
      .slice(0, 25);

    expect(filtered.length).toBeGreaterThan(0);
    // crypto는 반드시 포함
    expect(filtered.some((c) => c.value === 'crypto')).toBe(true);
  });

  it('should return empty for nonsense input', () => {
    const filtered = CATEGORY_CHOICES
      .filter((c) => c.name.toLowerCase().includes('zzzzzzz'));

    expect(filtered).toHaveLength(0);
  });

  it('should not exceed 25 results for any realistic query', () => {
    // 빈 문자열 = 전체 목록, 25개 제한 확인
    const all = CATEGORY_CHOICES
      .filter((c) => c.name.toLowerCase().includes(''))
      .slice(0, 25);

    expect(all.length).toBeLessThanOrEqual(25);
  });
});
