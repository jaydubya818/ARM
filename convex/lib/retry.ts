/**
 * Retry Logic with Exponential Backoff
 *
 * Provides retry mechanisms for transient failures with
 * configurable backoff strategies.
 */

import { isRetryableError, TimeoutError } from './errorTypes';
import { handleError } from './errorHandler';

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Add random jitter to prevent thundering herd
   * @default true
   */
  jitter?: boolean;

  /**
   * Timeout for each attempt in milliseconds
   * @default 60000
   */
  timeout?: number;

  /**
   * Custom function to determine if error is retryable
   */
  isRetryable?: (error: unknown) => boolean;

  /**
   * Callback called before each retry
   */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  timeout: 60000,
  isRetryable: isRetryableError,
  onRetry: () => {},
};

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>,
): number {
  const exponentialDelay = options.initialDelay * options.backoffMultiplier ** (attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

  if (options.jitter) {
    // Add random jitter (±25%)
    const jitterRange = cappedDelay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, cappedDelay + jitter);
  }

  return cappedDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  _operation: string,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(
      () => reject(new TimeoutError(_operation, timeoutMs)),
      timeoutMs,
    )),
  ]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Execute with timeout
      const result = await withTimeout(
        fn,
        opts.timeout,
        `retry attempt ${attempt}`,
      );
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = opts.isRetryable(error);
      const isLastAttempt = attempt === opts.maxAttempts;

      if (!shouldRetry || isLastAttempt) {
        // Don't retry or this was the last attempt
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(attempt, error, delay);

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with context for better error handling
 */
export async function retryWithContext<T>(
  fn: () => Promise<T>,
  operation: string,
  options: RetryOptions = {},
): Promise<T> {
  return retry(fn, {
    ...options,
    onRetry: (attempt, error, delay) => {
      console.warn(`Retry attempt ${attempt} for ${operation} after ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });
      options.onRetry?.(attempt, error, delay);
    },
  });
}

/**
 * Retry a Convex mutation with error handling
 */
export async function retryMutation<T>(
  mutation: () => Promise<T>,
  operation: string,
  options: RetryOptions = {},
): Promise<T> {
  try {
    return await retryWithContext(mutation, operation, options);
  } catch (error) {
    // Log the final error after all retries failed
    await handleError(error, {
      operation,
      metadata: {
        maxAttempts: options.maxAttempts || DEFAULT_OPTIONS.maxAttempts,
        retriesFailed: true,
      },
    });
    throw error;
  }
}

/**
 * Retry a Convex query with error handling
 */
export async function retryQuery<T>(
  query: () => Promise<T>,
  operation: string,
  options: RetryOptions = {},
): Promise<T> {
  try {
    return await retryWithContext(query, operation, {
      ...options,
      // Queries typically need fewer retries
      maxAttempts: options.maxAttempts || 2,
    });
  } catch (error) {
    await handleError(error, {
      operation,
      metadata: {
        maxAttempts: options.maxAttempts || 2,
        retriesFailed: true,
      },
    });
    throw error;
  }
}

/**
 * Batch retry - retry multiple operations in parallel
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {},
): Promise<T[]> {
  const results = await Promise.allSettled(
    operations.map((op) => retry(op, options)),
  );

  // Collect successful results and errors
  const successResults: T[] = [];
  const errors: unknown[] = [];

  results.forEach((result, _index) => {
    if (result.status === 'fulfilled') {
      successResults.push(result.value);
    } else {
      errors.push(result.reason);
    }
  });

  // If all failed, throw the first error
  if (errors.length === operations.length) {
    throw errors[0];
  }

  // If some failed, log warnings but return successful results
  if (errors.length > 0) {
    console.warn(`Batch retry: ${errors.length} of ${operations.length} operations failed`);
  }

  return successResults;
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;

  private lastFailureTime = 0;

  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
    private readonly resetTimeout: number = 30000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await withTimeout(fn, this.timeout, 'circuit-breaker');

      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    console.info('Circuit breaker reset to CLOSED state');
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

/**
 * Create a circuit breaker for a specific operation
 */
export function createCircuitBreaker(
  _operation: string,
  options?: {
    threshold?: number;
    timeout?: number;
    resetTimeout?: number;
  },
): CircuitBreaker {
  return new CircuitBreaker(
    options?.threshold,
    options?.timeout,
    options?.resetTimeout,
  );
}

/**
 * Retry with circuit breaker
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {},
): Promise<T> {
  return retry(
    () => circuitBreaker.execute(fn),
    retryOptions,
  );
}
