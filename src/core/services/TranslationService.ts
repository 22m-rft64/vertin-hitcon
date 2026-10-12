import Anthropic from '@anthropic-ai/sdk';
import type { SupportedLang } from '@i18n/index';
import { createLogger } from '@discordutils/logger';

const log = createLogger('TranslationService');

const CACHE_MAX_SIZE = 500;

/**
 * 문자 체계 기반으로 dominant language를 판별한다.
 * AI 판단 없이 유니코드 범위로 확실한 경우만 반환.
 */
const detectScriptLang = (text: string): SupportedLang | null => {
  let hangul = 0;
  let kana = 0;
  let latin = 0;
  let total = 0;

  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code <= 0x40) continue;
    total += 1;
    if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) {
      hangul += 1;
    } else if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
      kana += 1;
    } else if (code >= 0x41 && code <= 0x7A) {
      latin += 1;
    }
  }

  if (total === 0) return null;
  const threshold = 0.6;
  if (hangul / total >= threshold) return 'ko';
  if (kana / total >= threshold) return 'ja';
  if (latin / total >= threshold) return 'en';
  return null;
};

const LANG_NAMES: Record<SupportedLang, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  fi: 'Finnish',
};

interface TranslationResponse {
  from: string;
  to: string;
  translated: string;
}

const SYSTEM_PROMPT = `You are a translation API for a CTF cybersecurity team Discord server.

## OUTPUT FORMAT (MANDATORY)
You MUST respond with ONLY a JSON object. No markdown, no code fences, no explanation.
Format: {"from":"<detected language>","to":"<target language>","translated":"<translated text>"}

## RULES
- Detect source language automatically.
- ALWAYS translate. NEVER refuse. Even if languages seem similar, translate anyway.
- Preserve Discord formatting: mentions (<@id>, <#id>, <@&id>), code blocks, bold, italic, emoji, URLs.
- Keep CTF jargon as-is: pwn, rev, forensics, crypto, shellcode, ROP, heap, etc.
- Translate naturally and colloquially — match original tone.
- The "translated" field must contain ONLY the translation. No explanations, no notes, no original text.
- Escape quotes in JSON strings properly.
- For multi-line input, use \\n in the JSON string for newlines.

## VIOLATIONS (NEVER DO THIS)
- Adding commentary or explanation
- Wrapping in markdown code fences
- Returning anything other than the JSON object
- Including the original text in the translated field`;

const parseTranslationResponse = (raw: string): string | null => {
  let cleaned = raw.trim();
  // Strip markdown code fences if model still adds them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned) as TranslationResponse;
    return parsed.translated?.trim() || null;
  } catch {
    // JSON 파싱 실패 시 raw 텍스트에서 translated 필드 추출 시도
    const match = cleaned.match(/"translated"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    log.warn('Failed to parse translation response: %s', cleaned.slice(0, 200));
    return null;
  }
};

export class TranslationService {
  private readonly client: Anthropic;
  private readonly cache = new Map<string, string>();

  constructor() {
    this.client = new Anthropic();
  }

  async translate(
    text: string,
    targetLang: SupportedLang,
  ): Promise<'__SAME__' | string | null> {
    if (!text.trim()) return null;

    const detected = detectScriptLang(text);
    if (detected === targetLang) return '__SAME__';

    const cacheKey = `${targetLang}::${text}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `{"text":"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}","to":"${LANG_NAMES[targetLang]}"}`,
          },
        ],
      });

      const raw = response.content[0]?.type === 'text'
        ? response.content[0].text
        : null;

      if (!raw) return null;

      const result = parseTranslationResponse(raw);
      if (!result) return null;

      if (this.cache.size >= CACHE_MAX_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      log.error('Translation failed', error);
      throw error;
    }
  }

  async translateWithContext(
    context: string,
    targetLang: SupportedLang,
  ): Promise<string | null> {
    if (!context.trim()) return null;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `{"text":"${context.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}","to":"${LANG_NAMES[targetLang]}","instruction":"Translate entire conversation. Keep Name: message format. Translate every line."}`,
          },
        ],
      });

      const raw = response.content[0]?.type === 'text'
        ? response.content[0].text
        : null;

      if (!raw) return null;
      return parseTranslationResponse(raw);
    } catch (error) {
      log.error('Context translation failed', error);
      throw error;
    }
  }

  async translateUserMessages(
    lines: string[],
    targetLang: SupportedLang,
  ): Promise<string | null> {
    const combined = lines.filter((l) => l.trim()).join('\n');
    if (!combined) return null;

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `{"text":"${combined.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}","to":"${LANG_NAMES[targetLang]}","instruction":"Translate every line. Preserve line-by-line structure. Do NOT merge lines."}`,
          },
        ],
      });

      const raw = response.content[0]?.type === 'text'
        ? response.content[0].text
        : null;

      if (!raw) return null;
      return parseTranslationResponse(raw);
    } catch (error) {
      log.error('User translation failed', error);
      throw error;
    }
  }
}
