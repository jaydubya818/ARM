/**
 * Centralized Error Handler for ARM Platform
 *
 * Provides consistent error handling, logging, and recovery strategies
 * across all Convex mutations and queries.
 */

import {
  ARMError, toARMError, isARMError, ErrorCode,
} from './errorTypes';

export interface ErrorContext {
  operation: string;
  userId?: string;
  tenantId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorHandlerOptions {
  logError?: boolean;
  notifyUser?: boolean;
  recordAudit?: boolean;
  includeStackTrace?: boolean;
}

/**
 * Default error handler options
 */
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  logError: true,
  notifyUser: false,
  recordAudit: true,
  includeStackTrace: process.env.NODE_ENV === 'development',
};

/**
 * Log levels for error severity
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  operation: string;
  error: {
    code: string;
    message: string;
    statusCode: number;
    retryable: boolean;
    stack?: string;
  };
  context?: ErrorContext;
  metadata?: Record<string, any>;
}

/**
 * Error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with context
   */
  async handle(
    error: unknown,
    context: ErrorContext,
    options: ErrorHandlerOptions = {},
  ): Promise<ARMError> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const armError = toARMError(error);

    // Log the error
    if (opts.logError) {
      this.log(armError, context, opts.includeStackTrace);
    }

    // Record audit log (if enabled and error is significant)
    if (opts.recordAudit && this.shouldAudit(armError)) {
      await this.recordAuditLog(armError, context);
    }

    // Notify user (if enabled and error requires notification)
    if (opts.notifyUser && this.shouldNotify(armError)) {
      await this.notifyUser(armError, context);
    }

    return armError;
  }

  /**
   * Log error with structured format
   */
  private log(error: ARMError, context: ErrorContext, includeStack = false): void {
    const logEntry: LogEntry = {
      level: this.getLogLevel(error),
      timestamp: new Date().toISOString(),
      operation: context.operation,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable,
        ...(includeStack && { stack: error.stack }),
      },
      context,
      metadata: error.details,
    };

    // Log to console (in production, this would go to a logging service)
    const logFn = this.getLogFunction(logEntry.level);
    logFn(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Get appropriate log function for level
   */
  private getLogFunction(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Determine log level based on error
   */
  private getLogLevel(error: ARMError): LogLevel {
    if (error.statusCode >= 500) {
      return LogLevel.ERROR;
    }
    if (error.statusCode >= 400) {
      return LogLevel.WARN;
    }
    return LogLevel.INFO;
  }

  /**
   * Determine if error should be audited
   */
  private shouldAudit(error: ARMError): boolean {
    // Audit security-related errors and server errors
    return (
      error.code === ErrorCode.UNAUTHORIZED
      || error.code === ErrorCode.FORBIDDEN
      || error.code === ErrorCode.INSUFFICIENT_PERMISSIONS
      || error.statusCode >= 500
    );
  }

  /**
   * Determine if error should trigger user notification
   */
  private shouldNotify(error: ARMError): boolean {
    // Notify on critical errors that affect user operations
    return (
      error.statusCode >= 500
      || error.code === ErrorCode.RATE_LIMIT_EXCEEDED
      || error.code === ErrorCode.INTEGRITY_VIOLATION
    );
  }

  /**
   * Record error in audit log
   */
  private async recordAuditLog(error: ARMError, context: ErrorContext): Promise<void> {
    // This would call the auditLogs.ts module to record the error
    // For now, just log that we would record it
    console.info('Would record audit log:', {
      action: 'ERROR_OCCURRED',
      severity: error.statusCode >= 500 ? 'ERROR' : 'WARNING',
      resource: context.resourceId || 'SYSTEM',
      operator: context.userId || 'SYSTEM',
      details: {
        errorCode: error.code,
        errorMessage: error.message,
        operation: context.operation,
      },
    });
  }

  /**
   * Notify user about error
   */
  private async notifyUser(error: ARMError, context: ErrorContext): Promise<void> {
    // This would call the notifications.ts module to send notification
    // For now, just log that we would notify
    console.info('Would notify user:', {
      userId: context.userId,
      type: 'ERROR_ALERT',
      severity: 'HIGH',
      message: error.message,
      errorCode: error.code,
    });
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: ARMError): string {
    // Return sanitized message for users (hide internal details)
    if (error.statusCode >= 500) {
      return 'An internal error occurred. Please try again later.';
    }
    return error.message;
  }

  /**
   * Format error for API response
   */
  formatResponse(error: ARMError, includeDetails = false): Record<string, any> {
    const response: Record<string, any> = {
      error: {
        code: error.code,
        message: this.getUserMessage(error),
        statusCode: error.statusCode,
        retryable: error.retryable,
        timestamp: error.timestamp,
      },
    };

    // Include details only in development or for non-sensitive errors
    if (includeDetails && error.statusCode < 500) {
      response.error.details = error.details;
    }

    return response;
  }
}

/**
 * Convenience function to handle errors
 */
export async function handleError(
  error: unknown,
  context: ErrorContext,
  options?: ErrorHandlerOptions,
): Promise<ARMError> {
  const handler = ErrorHandler.getInstance();
  return handler.handle(error, context, options);
}

/**
 * Wrapper for mutation functions with error handling
 */
export function withErrorHandling<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  operation: string,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const armError = await handleError(error, { operation });
      throw armError;
    }
  }) as T;
}

/**
 * Wrapper for query functions with error handling
 */
export function withQueryErrorHandling<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  operation: string,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const armError = await handleError(error, {
        operation,
        metadata: { queryArgs: args },
      });
      throw armError;
    }
  }) as T;
}

/**
 * Safe execution wrapper that catches and logs errors
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: ErrorContext,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await handleError(error, context, { logError: true, notifyUser: false });
    return fallback;
  }
}

/**
 * Validation helper that throws ValidationError
 */
export function validate(
  condition: boolean,
  message: string,
  details?: Record<string, any>,
): asserts condition {
  if (!condition) {
    const { ValidationError } = require('./errorTypes');
    throw new ValidationError(message, details);
  }
}

/**
 * Assert helper that throws appropriate error
 */
export function assert(
  condition: boolean,
  errorFactory: () => ARMError,
): asserts condition {
  if (!condition) {
    throw errorFactory();
  }
}
