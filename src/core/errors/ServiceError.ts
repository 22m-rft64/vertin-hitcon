export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'VALIDATION'
  | 'DB_ERROR'
  | 'NOTIFICATION_ERROR'
  | 'UNKNOWN';

export class ServiceError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly cause?: unknown;

  constructor(
    message: string,
    code: ServiceErrorCode = 'UNKNOWN',
    cause?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.cause = cause;
  }

  static notFound(entity: string, identifier?: string): ServiceError {
    const msg = identifier
      ? `${entity} '${identifier}' not found`
      : `${entity} not found`;
    return new ServiceError(msg, 'NOT_FOUND');
  }

  static duplicate(entity: string, identifier: string): ServiceError {
    return new ServiceError(
      `${entity} '${identifier}' already exists`,
      'DUPLICATE',
    );
  }

  static validation(message: string): ServiceError {
    return new ServiceError(message, 'VALIDATION');
  }

  static dbError(operation: string, cause?: unknown): ServiceError {
    const msg = cause instanceof Error
      ? `DB ${operation} failed: ${cause.message}`
      : `DB ${operation} failed`;
    return new ServiceError(msg, 'DB_ERROR', cause);
  }

  static notificationError(operation: string, cause?: unknown): ServiceError {
    const msg = cause instanceof Error
      ? `Notification ${operation} failed: ${cause.message}`
      : `Notification ${operation} failed`;
    return new ServiceError(msg, 'NOTIFICATION_ERROR', cause);
  }

  static isServiceError(error: unknown): error is ServiceError {
    return error instanceof ServiceError;
  }
}
