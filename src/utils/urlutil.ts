import { AxiosResponse } from "axios";
import path from "path";
import fs from "fs";
import { ZodType } from "zod";
import { createLogger } from "@discordutils/logger";

const log = createLogger('UrlUtil');

/**
 * Convert a relative or partial URL to an absolute URL using base URL.
 *
 * @param url - The attachment URL
 * @param baseUrl - The domain base URL
 * @returns Absolute URL string
 */
export const convertAttachmentUrl = (url: string, baseUrl?: string): string => {
  if (!url.startsWith("http") && baseUrl) {
    return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
  }
  return url;
};

/**
 * Extract filename from a given URL string.
 *
 * @param url - Target URL
 * @returns Filename extracted from the path
 */
export const extractFilenameFromUrl = (url: string): string => {
  try {
    return decodeURIComponent(
      new URL(url).pathname.split("/").filter(Boolean).pop() || "",
    );
  } catch {
    return url;
  }
};

/**
 * Represents a parsed attachment or image from HTML or platform response.
 */
export interface ParsedFile {
  url: string;
  name?: string;
}

/**
 * Convert a URL into a ParsedFile object.
 *
 * @param url - The file URL
 * @param baseUrl - Optional base URL to resolve relative paths
 * @returns ParsedFile object
 */
export const parseAttachment = (url: string, baseUrl?: string): ParsedFile => ({
  url: convertAttachmentUrl(url, baseUrl),
  name: extractFilenameFromUrl(url),
});

/*
 * Validate and parse an HTTP response with the given Zod schema.
 *
 * @param response - Axios Response
 * @param schema - Zod schema for response validation.
 * @param suprresswarnings - if true: supreess warning logs
 * @returns validated data or null
 */
export const deserializeResponse = <T>(
  response: AxiosResponse<unknown>,
  schema: ZodType<T>,
  suppressWarnings = false,
): T | null => {
  const status = response.status;

  const isValidStatus =
    (status >= 200 && status <= 299) || (status >= 400 && status <= 499);

  if (!isValidStatus) return null;

  const parsed = schema.safeParse(response.data);
  if (!parsed.success) {
    if (!suppressWarnings) {
      const preview = JSON.stringify(response.data);
      const truncated = preview.length > 200
        ? `${preview.slice(0, 200)}... (${preview.length} chars)`
        : preview;
      log.warn(
        'Failed to parse response with schema (status %d):\n%s\nErrors:\n%O',
        status,
        truncated,
        parsed.error.format(),
      );
    }
    return null;
  }

  return parsed.data;
};

/**
 * Strip the path, query parameters and fragments from a URL.
 *
 * @param url - The URL to parse
 * @returns The base URL (scheme + netloc)
 */
export const stripUrlComponents = (url: string): string => {
  const parsedUrl = new URL(url);
  return `${parsedUrl.protocol}//${parsedUrl.host}`;
};

/*
 * Gets random user agents.
 */
class _RandomUserAgent {
  userAgents: string[];

  constructor() {
    const filepath = path.join(`${__dirname}/user-agents.txt`);
    const fileContent = fs.readFileSync(filepath, "utf-8");
    this.userAgents = fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  public getAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}

export const RandomUserAgent = new _RandomUserAgent();
