/**
 * Custom Error Types for ARM Platform
 *
 * Provides typed error classes for different error scenarios
 * with proper error codes and user-friendly messages.
 */

export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication/Authorization Errors (401/403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Resource Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Conflict Errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  VERSION_CONFLICT = 'VERSION_CONFLICT',

  // Business Logic Errors (422)
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  DEPENDENCY_NOT_MET = 'DEPENDENCY_NOT_MET',
  INTEGRITY_VIOLATION = 'INTEGRITY_VIOLATION',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Timeout Errors (504)
  TIMEOUT = 'TIMEOUT',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  retryable?: boolean;
  timestamp?: string;
}

/**
 * Base error class for all ARM errors
 */
export class ARMError extends Error {
  public readonly code: ErrorCode;

  public readonly statusCode: number;

  public readonly details?: Record<string, any>;

  public readonly retryable: boolean;

  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: Record<string, any>,
    retryable = false,
  ) {
    super(message);
    this.name = 'ARMError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends ARMError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details, false);
    this.name = 'ValidationError';
  }
}

export class InvalidInputError extends ARMError {
  constructor(field: string, reason: string, details?: Record<string, any>) {
    super(
      ErrorCode.INVALID_INPUT,
      `Invalid input for field '${field}': ${reason}`,
      400,
      { field, reason, ...details },
      false,
    );
    this.name = 'InvalidInputError';
  }
}

export class MissingFieldError extends ARMError {
  constructor(field: string, details?: Record<string, any>) {
    super(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Required field '${field}' is missing`,
      400,
      { field, ...details },
      false,
    );
    this.name = 'MissingFieldError';
  }
}

/**
 * Authentication/Authorization errors (401/403)
 */
export class UnauthorizedError extends ARMError {
  constructor(message = 'Authentication required', details?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details, false);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ARMError {
  constructor(message = 'Access forbidden', details?: Record<string, any>) {
    super(ErrorCode.FORBIDDEN, message, 403, details, false);
    this.name = 'ForbiddenError';
  }
}

export class InsufficientPermissionsError extends ARMError {
  constructor(requiredPermission: string, details?: Record<string, any>) {
    super(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      `Insufficient permissions. Required: ${requiredPermission}`,
      403,
      { requiredPermission, ...details },
      false,
    );
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Resource errors (404)
 */
export class NotFoundError extends ARMError {
  constructor(resource: string, id: string, details?: Record<string, any>) {
    super(
      ErrorCode.NOT_FOUND,
      `${resource} with ID '${id}' not found`,
      404,
      { resource, id, ...details },
      false,
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends ARMError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.CONFLICT, message, 409, details, false);
    this.name = 'ConflictError';
  }
}

export class DuplicateResourceError extends ARMError {
  constructor(resource: string, field: string, value: string, details?: Record<string, any>) {
    super(
      ErrorCode.DUPLICATE_RESOURCE,
      `${resource} with ${field} '${value}' already exists`,
      409,
      {
        resource, field, value, ...details,
      },
      false,
    );
    this.name = 'DuplicateResourceError';
  }
}

export class VersionConflictError extends ARMError {
  constructor(resource: string, expectedVersion: string, actualVersion: string) {
    super(
      ErrorCode.VERSION_CONFLICT,
      `Version conflict for ${resource}. Expected: ${expectedVersion}, Actual: ${actualVersion}`,
      409,
      { resource, expectedVersion, actualVersion },
      false,
    );
    this.name = 'VersionConflictError';
  }
}

/**
 * Business logic errors (422)
 */
export class BusinessLogicError extends ARMError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.BUSINESS_LOGIC_ERROR, message, 422, details, false);
    this.name = 'BusinessLogicError';
  }
}

export class InvalidStateTransitionError extends ARMError {
  constructor(resource: string, from: string, to: string, reason?: string) {
    super(
      ErrorCode.INVALID_STATE_TRANSITION,
      `Invalid state transition for ${resource} from '${from}' to '${to}'${reason ? `: ${reason}` : ''}`,
      422,
      {
        resource, from, to, reason,
      },
      false,
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class DependencyNotMetError extends ARMError {
  constructor(resource: string, dependency: string, details?: Record<string, any>) {
    super(
      ErrorCode.DEPENDENCY_NOT_MET,
      `Cannot proceed with ${resource}: dependency '${dependency}' not met`,
      422,
      { resource, dependency, ...details },
      false,
    );
    this.name = 'DependencyNotMetError';
  }
}

export class IntegrityViolationError extends ARMError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.INTEGRITY_VIOLATION, message, 422, details, false);
    this.name = 'IntegrityViolationError';
  }
}

/**
 * Rate limiting errors (429)
 */
export class RateLimitError extends ARMError {
  constructor(limit: number, window: string, retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${window}`,
      429,
      { limit, window, retryAfter },
      true,
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Server errors (500)
 */
export class InternalError extends ARMError {
  constructor(message = 'Internal server error', details?: Record<string, any>) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, details, true);
    this.name = 'InternalError';
  }
}

export class DatabaseError extends ARMError {
  constructor(operation: string, details?: Record<string, any>) {
    super(
      ErrorCode.DATABASE_ERROR,
      `Database error during ${operation}`,
      500,
      { operation, ...details },
      true,
    );
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ARMError {
  constructor(service: string, details?: Record<string, any>) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      500,
      { service, ...details },
      true,
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Timeout errors (504)
 */
export class TimeoutError extends ARMError {
  constructor(operation: string, timeout: number, details?: Record<string, any>) {
    super(
      ErrorCode.TIMEOUT,
      `Operation '${operation}' timed out after ${timeout}ms`,
      504,
      { operation, timeout, ...details },
      true,
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Type guard to check if error is an ARM error
 */
export function isARMError(error: unknown): error is ARMError {
  return error instanceof ARMError;
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return isARMError(error) && error.retryable;
}

/**
 * Convert any error to ARMError
 */
export function toARMError(error: unknown): ARMError {
  if (isARMError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { originalError: error.name });
  }

  return new InternalError('Unknown error occurred', { error: String(error) });
}
