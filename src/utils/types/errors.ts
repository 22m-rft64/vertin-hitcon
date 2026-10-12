/**
 * Manager 레이어 에러 코드
 */
export type ManagerErrorCode =
  | "NOT_FOUND"
  | "DUPLICATE"
  | "VALIDATION"
  | "DB_ERROR"
  | "DISCORD_ERROR"
  | "CACHE_ERROR"
  | "UNKNOWN";

/**
 * Manager 레이어 통합 에러 클래스
 */
export class ManagerError extends Error {
  public readonly code: ManagerErrorCode;
  public readonly cause?: unknown;

  constructor(
    message: string,
    code: ManagerErrorCode = "UNKNOWN",
    cause?: unknown,
  ) {
    super(message);
    this.name = "ManagerError";
    this.code = code;
    this.cause = cause;
  }

  /**
   * 엔티티를 찾을 수 없을 때
   */
  static notFound(entity: string, identifier?: string): ManagerError {
    const msg = identifier
      ? `${entity} '${identifier}' not found`
      : `${entity} not found`;
    return new ManagerError(msg, "NOT_FOUND");
  }

  /**
   * 중복 엔티티 생성 시도
   */
  static duplicate(entity: string, identifier: string): ManagerError {
    return new ManagerError(
      `${entity} '${identifier}' already exists`,
      "DUPLICATE",
    );
  }

  /**
   * 유효성 검증 실패
   */
  static validation(message: string): ManagerError {
    return new ManagerError(message, "VALIDATION");
  }

  /**
   * 데이터베이스 작업 실패
   */
  static dbError(operation: string, cause?: unknown): ManagerError {
    const msg =
      cause instanceof Error
        ? `DB ${operation} failed: ${cause.message}`
        : `DB ${operation} failed`;
    return new ManagerError(msg, "DB_ERROR", cause);
  }

  /**
   * Discord API 작업 실패
   */
  static discordError(operation: string, cause?: unknown): ManagerError {
    const msg =
      cause instanceof Error
        ? `Discord ${operation} failed: ${cause.message}`
        : `Discord ${operation} failed`;
    return new ManagerError(msg, "DISCORD_ERROR", cause);
  }

  /**
   * 캐시 동기화 실패
   */
  static cacheError(operation: string, cause?: unknown): ManagerError {
    const msg =
      cause instanceof Error
        ? `Cache ${operation} failed: ${cause.message}`
        : `Cache ${operation} failed`;
    return new ManagerError(msg, "CACHE_ERROR", cause);
  }

  /**
   * 에러인지 확인
   */
  static isManagerError(error: unknown): error is ManagerError {
    return error instanceof ManagerError;
  }
}
