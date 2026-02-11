/**
 * useErrorHandler Hook
 *
 * React hook for handling errors in components with
 * automatic retry and user notifications.
 */

import { useState, useCallback } from 'react';
import {
  getUserFriendlyMessage,
  getErrorSeverity,
  isRetryable,
  logError,
  handleWithRetry,
  type ErrorSeverity,
} from '../lib/errorHandler';

export interface ErrorState {
  error: unknown | null;
  message: string | null;
  severity: ErrorSeverity | null;
  retryable: boolean;
}

export interface UseErrorHandlerReturn {
  error: ErrorState;
  handleError: (error: unknown, context?: { operation?: string }) => void;
  clearError: () => void;
  retry: <T>(fn: () => Promise<T>) => Promise<T>;
  isError: boolean;
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: null,
    severity: null,
    retryable: false,
  });

  const handleError = useCallback((
    error: unknown,
    context?: { operation?: string },
  ) => {
    const message = getUserFriendlyMessage(error);
    const severity = getErrorSeverity(error);
    const retryable = isRetryable(error);

    setErrorState({
      error,
      message,
      severity,
      retryable,
    });

    logError(error, context);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      message: null,
      severity: null,
      retryable: false,
    });
  }, []);

  const retry = useCallback(async <T, >(fn: () => Promise<T>): Promise<T> => {
    clearError();
    try {
      return await handleWithRetry(fn, {
        maxAttempts: 3,
        onRetry: (attempt) => {
          console.log(`Retry attempt ${attempt}`);
        },
      });
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError, clearError]);

  return {
    error: errorState,
    handleError,
    clearError,
    retry,
    isError: errorState.error !== null,
  };
}

/**
 * Hook for async operations with automatic error handling
 */
export function useAsyncError<T>() {
  const { handleError, clearError, error } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    fn: () => Promise<T>,
    context?: { operation?: string },
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    clearError();
  }, [clearError]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for mutation operations with optimistic updates
 */
export function useMutationError<T>() {
  const { handleError, clearError, error } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);

  const mutate = useCallback(async (
    fn: () => Promise<T>,
    options?: {
      optimisticUpdate?: T;
      onSuccess?: (data: T) => void;
      onError?: (error: unknown) => void;
      context?: { operation?: string };
    },
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    // Apply optimistic update
    if (options?.optimisticUpdate) {
      setOptimisticData(options.optimisticUpdate);
    }

    try {
      const result = await fn();
      setOptimisticData(null);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      setOptimisticData(null);
      handleError(err, options?.context);
      options?.onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    mutate,
    isLoading,
    error,
    optimisticData,
  };
}
