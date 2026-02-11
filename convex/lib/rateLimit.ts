/**
 * Rate Limiting
 *
 * Implements rate limiting to prevent abuse and ensure fair usage.
 * Uses sliding window algorithm for accurate rate limiting.
 */

import { RateLimitError } from './errorTypes';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Identifier for this rate limiter
   */
  name: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Request record for sliding window
 */
interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * Rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private requests: Map<string, RequestRecord[]>;

  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.requests = new Map();
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this identifier
    let records = this.requests.get(identifier) || [];

    // Remove expired requests
    records = records.filter((r) => r.timestamp > windowStart);

    // Count total requests in window
    const totalRequests = records.reduce((sum, r) => sum + r.count, 0);

    // Check if limit exceeded
    if (totalRequests >= this.config.limit) {
      const oldestRequest = records[0];
      const resetAt = oldestRequest.timestamp + this.config.windowMs;
      const retryAfter = Math.ceil((resetAt - now) / 1000); // seconds

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Add current request
    records.push({ timestamp: now, count: 1 });
    this.requests.set(identifier, records);

    return {
      allowed: true,
      remaining: this.config.limit - totalRequests - 1,
      resetAt: now + this.config.windowMs,
    };
  }

  /**
   * Check and throw if rate limit exceeded
   */
  checkOrThrow(identifier: string): void {
    const result = this.check(identifier);
    if (!result.allowed) {
      throw new RateLimitError(
        this.config.limit,
        `${this.config.windowMs / 1000}s`,
        result.retryAfter,
      );
    }
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Get current usage for identifier
   */
  getUsage(identifier: string): {
    requests: number;
    limit: number;
    remaining: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const records = this.requests.get(identifier) || [];
    const validRecords = records.filter((r) => r.timestamp > windowStart);
    const totalRequests = validRecords.reduce((sum, r) => sum + r.count, 0);

    return {
      requests: totalRequests,
      limit: this.config.limit,
      remaining: Math.max(0, this.config.limit - totalRequests),
    };
  }
}

/**
 * Pre-configured rate limiters
 */
export const RateLimiters = {
  /**
   * Strict rate limit for sensitive operations (10 req/min)
   */
  strict: new RateLimiter({
    name: 'strict',
    limit: 10,
    windowMs: 60000, // 1 minute
  }),

  /**
   * Standard rate limit for mutations (60 req/min)
   */
  standard: new RateLimiter({
    name: 'standard',
    limit: 60,
    windowMs: 60000, // 1 minute
  }),

  /**
   * Relaxed rate limit for queries (300 req/min)
   */
  relaxed: new RateLimiter({
    name: 'relaxed',
    limit: 300,
    windowMs: 60000, // 1 minute
  }),

  /**
   * API rate limit (1000 req/hour)
   */
  api: new RateLimiter({
    name: 'api',
    limit: 1000,
    windowMs: 3600000, // 1 hour
  }),

  /**
   * Authentication attempts (5 req/15min)
   */
  auth: new RateLimiter({
    name: 'auth',
    limit: 5,
    windowMs: 900000, // 15 minutes
  }),
};

/**
 * Get rate limiter by name
 */
export function getRateLimiter(name: keyof typeof RateLimiters): RateLimiter {
  return RateLimiters[name];
}

/**
 * Middleware to apply rate limiting
 */
export function withRateLimit<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter,
  getIdentifier: (...args: Parameters<T>) => string,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const identifier = getIdentifier(...args);
    limiter.checkOrThrow(identifier);
    return fn(...args);
  }) as T;
}

/**
 * Rate limit by user ID
 */
export function rateLimitByUser<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter = RateLimiters.standard,
): T {
  return withRateLimit(fn, limiter, (...args) => {
    // Extract user ID from first arg (typically ctx)
    const ctx = args[0];
    return ctx?.auth?.userId || 'anonymous';
  });
}

/**
 * Rate limit by tenant ID
 */
export function rateLimitByTenant<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter = RateLimiters.standard,
): T {
  return withRateLimit(fn, limiter, (...args) => {
    // Extract tenant ID from second arg (typically args object)
    const queryArgs = args[1];
    return queryArgs?.tenantId || 'unknown';
  });
}

/**
 * Rate limit by IP address (requires IP from context)
 */
export function rateLimitByIP<T extends(
...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter = RateLimiters.api,
): T {
  return withRateLimit(fn, limiter, (...args) => {
    // Extract IP from context metadata
    const ctx = args[0];
    return ctx?.metadata?.ip || 'unknown';
  });
}
