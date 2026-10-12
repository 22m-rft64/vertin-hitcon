// --- Core category constants (Single Source of Truth) ---

export const CHALLENGE_CATEGORIES = ['web', 'pwn', 'rev', 'crypto', 'forensic', 'misc'] as const;
export type ChallengeCategory = typeof CHALLENGE_CATEGORIES[number];

export const SPECIALTY_CATEGORIES = ['web', 'pwn', 'rev', 'forensic', 'crypto', 'web3'] as const;
export type CTFSpecialty = typeof SPECIALTY_CATEGORIES[number];

// --- Alias map: variant → canonical ---

export const CATEGORY_ALIASES: ReadonlyMap<string, string> = new Map([
  // web
  ['website', 'web'],
  ['webex', 'web'],
  ['web exploitation', 'web'],
  ['webhacking', 'web'],
  ['web hacking', 'web'],
  ['webappsec', 'web'],

  // pwn
  ['pwnable', 'pwn'],
  ['pwnage', 'pwn'],
  ['exploitation', 'pwn'],
  ['binary exploitation', 'pwn'],
  ['binary', 'pwn'],

  // rev
  ['reverse', 'rev'],
  ['reverse engineering', 'rev'],
  ['reversing', 'rev'],
  ['re', 'rev'],

  // crypto
  ['cryptography', 'crypto'],
  ['cry', 'crypto'],

  // forensic
  ['forensics', 'forensic'],
  ['dfir', 'forensic'],
  ['memory forensics', 'forensic'],
  ['disk forensics', 'forensic'],
  ['network forensics', 'forensic'],

  // misc
  ['miscellaneous', 'misc'],
  ['trivia', 'misc'],
  ['warmup', 'misc'],
  ['welcome', 'misc'],
  ['sanity', 'misc'],
  ['sanity check', 'misc'],

  // web3
  ['blockchain', 'web3'],
  ['smart contract', 'web3'],
  ['solidity', 'web3'],

  // extended (not in core 6, but canonical aliases)
  ['osint', 'osint'],
  ['open source intelligence', 'osint'],
  ['steganography', 'stego'],
  ['steg', 'stego'],
  ['mobile', 'mobile'],
  ['android', 'mobile'],
  ['ios', 'mobile'],
  ['hardware', 'hardware'],
  ['hw', 'hardware'],
  ['iot', 'hardware'],
  ['ppc', 'ppc'],
  ['programming', 'ppc'],
  ['coding', 'ppc'],
  ['ai', 'ai'],
  ['machine learning', 'ai'],
  ['ml', 'ai'],
]);

// Pre-compute canonical set for fast lookup
const CANONICAL_SET: ReadonlySet<string> = new Set([
  ...CHALLENGE_CATEGORIES,
  ...SPECIALTY_CATEGORIES,
  ...new Set(CATEGORY_ALIASES.values()),
]);

/**
 * 카테고리 문자열을 정규화한다.
 * 1. trim + lowercase
 * 2. alias map lookup
 * 3. known canonical → 그대로
 * 4. separator prefix match ("crypto/rsa" → "crypto")
 * 5. no match → cleaned string
 * 6. 빈 문자열 → 'misc'
 */
export function normalizeCategory(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return 'misc';

  // exact alias
  const alias = CATEGORY_ALIASES.get(cleaned);
  if (alias) return alias;

  // already canonical
  if (CANONICAL_SET.has(cleaned)) return cleaned;

  // separator prefix: "crypto/rsa", "web - advanced", "pwn_heap"
  const separators = /[/\-_ ]/;
  const sepIdx = cleaned.search(separators);
  if (sepIdx > 0) {
    const prefix = cleaned.slice(0, sepIdx).trim();
    const prefixAlias = CATEGORY_ALIASES.get(prefix);
    if (prefixAlias) return prefixAlias;
    if (CANONICAL_SET.has(prefix)) return prefix;
  }

  return cleaned;
}

/** 코어 6개 카테고리인지 확인하는 타입가드 */
export function isTrackedCategory(cat: string): cat is ChallengeCategory {
  return (CHALLENGE_CATEGORIES as readonly string[]).includes(cat);
}

// --- Display maps ---

export const CATEGORY_DISPLAY: Record<ChallengeCategory, { emoji: string; label: string }> = {
  web: { emoji: '🌐', label: 'Web' },
  pwn: { emoji: '🐧', label: 'Pwn' },
  rev: { emoji: '🧩', label: 'Rev' },
  crypto: { emoji: '🔐', label: 'Crypto' },
  forensic: { emoji: '🗄️', label: 'Forensic' },
  misc: { emoji: '❓', label: 'Misc' },
};

export const SPECIALTY_DISPLAY: Record<CTFSpecialty, { emoji: string; label: string }> = {
  web: { emoji: '🌐', label: 'Web' },
  pwn: { emoji: '🔨', label: 'Pwn' },
  rev: { emoji: '⚙️', label: 'Rev' },
  forensic: { emoji: '🔍', label: 'Forensic' },
  crypto: { emoji: '🔐', label: 'Crypto' },
  web3: { emoji: '🪙', label: 'Web3' },
};
