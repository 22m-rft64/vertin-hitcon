import { describe, it, expect } from 'vitest';
import {
  normalizeCategory,
  isTrackedCategory,
  CHALLENGE_CATEGORIES,
  SPECIALTY_CATEGORIES,
} from '@core/models/Category';

describe('normalizeCategory', () => {
  it('should return canonical for exact aliases', () => {
    expect(normalizeCategory('pwnable')).toBe('pwn');
    expect(normalizeCategory('cryptography')).toBe('crypto');
    expect(normalizeCategory('forensics')).toBe('forensic');
    expect(normalizeCategory('reverse engineering')).toBe('rev');
    expect(normalizeCategory('miscellaneous')).toBe('misc');
    expect(normalizeCategory('blockchain')).toBe('web3');
  });

  it('should handle case insensitivity and whitespace', () => {
    expect(normalizeCategory('PWN')).toBe('pwn');
    expect(normalizeCategory('Pwn')).toBe('pwn');
    expect(normalizeCategory(' pwn ')).toBe('pwn');
    expect(normalizeCategory('  CRYPTO  ')).toBe('crypto');
  });

  it('should match separator prefix patterns', () => {
    expect(normalizeCategory('crypto/rsa')).toBe('crypto');
    expect(normalizeCategory('web - advanced')).toBe('web');
    expect(normalizeCategory('pwn_heap')).toBe('pwn');
    expect(normalizeCategory('rev stuff')).toBe('rev');
  });

  it('should preserve unmapped categories', () => {
    expect(normalizeCategory('osint')).toBe('osint');
    expect(normalizeCategory('totally_unknown')).toBe('totally_unknown');
  });

  it('should return misc for empty string', () => {
    expect(normalizeCategory('')).toBe('misc');
    expect(normalizeCategory('   ')).toBe('misc');
  });

  it('should handle extended category aliases', () => {
    expect(normalizeCategory('web3')).toBe('web3');
    expect(normalizeCategory('blockchain')).toBe('web3');
    expect(normalizeCategory('steganography')).toBe('stego');
    expect(normalizeCategory('programming')).toBe('ppc');
    expect(normalizeCategory('machine learning')).toBe('ai');
  });

  it('should return canonical categories as-is', () => {
    for (const cat of CHALLENGE_CATEGORIES) {
      expect(normalizeCategory(cat)).toBe(cat);
    }
    for (const cat of SPECIALTY_CATEGORIES) {
      expect(normalizeCategory(cat)).toBe(cat);
    }
  });
});

describe('isTrackedCategory', () => {
  it('should return true for core 6 categories', () => {
    for (const cat of CHALLENGE_CATEGORIES) {
      expect(isTrackedCategory(cat)).toBe(true);
    }
  });

  it('should return false for extended categories', () => {
    expect(isTrackedCategory('web3')).toBe(false);
    expect(isTrackedCategory('osint')).toBe(false);
    expect(isTrackedCategory('stego')).toBe(false);
    expect(isTrackedCategory('ppc')).toBe(false);
  });
});
