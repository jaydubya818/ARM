/**
 * Query Result Caching
 *
 * Implements in-memory caching for frequently accessed queries
 * to reduce database load and improve response times.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Default: 60000ms (1 minute)
  maxSize?: number; // Default: 1000 entries
}

/**
 * Simple in-memory cache with TTL support
 */
export class QueryCache {
  private cache: Map<string, CacheEntry<any>>;

  private readonly defaultTTL: number;

  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.ttl || 60000; // 1 minute default
    this.maxSize = options.maxSize || 1000;
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Track hits/misses
    };
  }
}

/**
 * Global cache instance
 */
const globalCache = new QueryCache({
  ttl: 60000, // 1 minute
  maxSize: 1000,
});

/**
 * Cached query wrapper
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options?: {
    ttl?: number;
    skipCache?: boolean;
  },
): Promise<T> {
  // Skip cache if requested
  if (options?.skipCache) {
    return fn();
  }

  // Try to get from cache
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await fn();
  globalCache.set(key, result, options?.ttl);
  return result;
}

/**
 * Generate cache key from query name and args
 */
export function generateCacheKey(
  queryName: string,
  args: Record<string, any>,
): string {
  const sortedArgs = Object.keys(args)
    .sort()
    .map((key) => `${key}:${JSON.stringify(args[key])}`)
    .join('|');
  return `${queryName}:${sortedArgs}`;
}

/**
 * Invalidate cache for a specific resource
 */
export function invalidateResource(
  resource: string,
  id?: string,
): void {
  if (id) {
    globalCache.invalidatePattern(new RegExp(`${resource}.*${id}`));
  } else {
    globalCache.invalidatePattern(new RegExp(`${resource}`));
  }
}

/**
 * Cache decorator for query functions
 */
export function cached(ttl?: number) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(propertyKey, args[1] || {});
      return withCache(cacheKey, () => originalMethod.apply(this, args), { ttl });
    };

    return descriptor;
  };
}

/**
 * Export global cache for direct access
 */
export { globalCache };
