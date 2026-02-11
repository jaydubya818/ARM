/**
 * Frontend Error Handler
 * 
 * Provides client-side error handling, toast notifications,
 * and error recovery strategies.
 */

import { ConvexError } from 'convex/values';

export interface ErrorDetails {
  code?: string;
  message: string;
  statusCode?: number;
  retryable?: boolean;
  timestamp?: string;
  details?: Record<string, any>;
}

/**
 * Parse Convex error into structured format
 */
export function parseConvexError(error: unknown): ErrorDetails {
  if (error instanceof ConvexError) {
    return {
      code: 'CONVEX_ERROR',
      message: error.message || 'An error occurred',
      statusCode: 500,
      retryable: false,
    };
  }

  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        statusCode: 0,
        retryable: true,
      };
    }

    // Check if it's a timeout
    if (error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
        statusCode: 504,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode: 500,
      retryable: false,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
    retryable: false,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const parsed = parseConvexError(error);

  // Map error codes to user-friendly messages
  const messageMap: Record<string, string> = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    TIMEOUT: 'The request took too long. Please try again.',
    UNAUTHORIZED: 'You need to sign in to continue.',
    FORBIDDEN: 'You don\'t have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  };

  return messageMap[parsed.code || ''] || parsed.message;
}

/**
 * Determine if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const parsed = parseConvexError(error);
  return parsed.retryable || false;
}

/**
 * Error notification severity
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Get error severity
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  const parsed = parseConvexError(error);

  if (!parsed.statusCode) return 'error';

  if (parsed.statusCode >= 500) return 'critical';
  if (parsed.statusCode >= 400) return 'error';
  if (parsed.statusCode >= 300) return 'warning';
  return 'info';
}

/**
 * Log error to console (and potentially to error tracking service)
 */
export function logError(
  error: unknown,
  context?: {
    operation?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): void {
  const parsed = parseConvexError(error);
  const severity = getErrorSeverity(error);

  const logEntry = {
    timestamp: new Date().toISOString(),
    severity,
    error: parsed,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console
  console.error('[ARM Error]', logEntry);

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production' && severity === 'critical') {
    // TODO: Send to error tracking service
    // Sentry.captureException(error, { contexts: { arm: logEntry } });
  }
}

/**
 * Handle error with automatic retry
 */
export async function handleWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }

      onRetry?.(attempt);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

/**
 * Offline detection
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Wait for online status
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Timeout waiting for online status'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    return handleWithRetry(fn, {
      maxAttempts,
      delay: 1000,
    });
  },

  /**
   * Retry when back online
   */
  async retryWhenOnline<T>(fn: () => Promise<T>): Promise<T> {
    if (isOffline()) {
      await waitForOnline();
    }
    return fn();
  },

  /**
   * Fallback to cached data
   */
  async withFallback<T>(
    fn: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      logError(error, { operation: 'withFallback' });
      return fallback;
    }
  },

  /**
   * Graceful degradation
   */
  async gracefulDegrade<T>(
    primary: () => Promise<T>,
    secondary: () => Promise<T>
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      logError(error, { operation: 'gracefulDegrade' });
      return secondary();
    }
  },
};

/**
 * Create error handler hook
 */
export function createErrorHandler(context?: {
  operation?: string;
  showToast?: (message: string, severity: ErrorSeverity) => void;
}) {
  return {
    handle: (error: unknown) => {
      const message = getUserFriendlyMessage(error);
      const severity = getErrorSeverity(error);

      logError(error, { operation: context?.operation });

      if (context?.showToast) {
        context.showToast(message, severity);
      }

      return { message, severity, retryable: isRetryable(error) };
    },

    handleWithRetry: async <T>(
      fn: () => Promise<T>,
      onRetry?: (attempt: number) => void
    ): Promise<T> => {
      return handleWithRetry(fn, {
        onRetry: (attempt) => {
          if (context?.showToast) {
            context.showToast(
              `Retrying... (attempt ${attempt})`,
              'info'
            );
          }
          onRetry?.(attempt);
        },
      });
    },
  };
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    logError(event.reason, {
      operation: 'unhandledRejection',
      metadata: { promise: event.promise },
    });
  });

  window.addEventListener('error', (event) => {
    logError(event.error, {
      operation: 'globalError',
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
