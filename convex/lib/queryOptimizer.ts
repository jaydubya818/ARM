/**
 * Query Optimization Utilities
 *
 * Provides utilities for optimizing Convex queries,
 * preventing N+1 problems, and improving performance.
 */

import { GenericQueryCtx } from 'convex/server';
import { DataModel } from '../_generated/dataModel';

/**
 * Batch load related entities to prevent N+1 queries
 */
export async function batchLoad<T extends { _id: any }>(
  ctx: GenericQueryCtx<DataModel>,
  _tableName: keyof DataModel,
  ids: any[],
): Promise<Map<string, T>> {
  const uniqueIds = [...new Set(ids)];
  const results = new Map<string, T>();

  // Fetch all entities in parallel
  const entities = await Promise.all(
    uniqueIds.map((id) => ctx.db.get(id)),
  );

  entities.forEach((entity, index) => {
    if (entity) {
      results.set(uniqueIds[index], entity as unknown as T);
    }
  });

  return results;
}

/**
 * Paginate query results
 */
export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Apply pagination to query results
 */
export function paginate<T extends { _id: any }>(
  items: T[],
  options: PaginationOptions = {},
): PaginatedResult<T> {
  const limit = options.limit || 50;
  const cursorIndex = options.cursor ? parseInt(options.cursor, 10) : 0;

  const paginatedItems = items.slice(cursorIndex, cursorIndex + limit);
  const hasMore = cursorIndex + limit < items.length;
  const nextCursor = hasMore ? String(cursorIndex + limit) : null;

  return {
    items: paginatedItems,
    nextCursor,
    hasMore,
    total: items.length,
  };
}

/**
 * Optimize query with index hints
 */
export interface QueryOptimizationHints {
  useIndex?: string;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

/**
 * Batch fetch with deduplication
 */
export async function batchFetch<T>(
  fetchers: Array<() => Promise<T>>,
): Promise<T[]> {
  return Promise.all(fetchers.map((f) => f()));
}

/**
 * Memoize expensive computations
 */
const memoCache = new Map<string, { value: any; timestamp: number }>();

export function memoize<T>(
  key: string,
  fn: () => T,
  ttl = 60000,
): T {
  const cached = memoCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < ttl) {
    return cached.value;
  }

  const value = fn();
  memoCache.set(key, { value, timestamp: now });
  return value;
}

/**
 * Debounce function calls
 */
export function debounce<T extends(
...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends(
...args: any[]) => any>(
  fn: T,
  limitMs: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Optimize array operations
 */
export const ArrayOps = {
  /**
   * Fast unique by ID
   */
  uniqueById<T extends { _id: any }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const id = String(item._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },

  /**
   * Fast group by
   */
  groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    items.forEach((item) => {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });
    return groups;
  },

  /**
   * Fast index by ID
   */
  indexById<T extends { _id: any }>(items: T[]): Map<string, T> {
    const index = new Map<string, T>();
    items.forEach((item) => {
      index.set(String(item._id), item);
    });
    return index;
  },
};

/**
 * Query performance profiler
 */
export class QueryProfiler {
  private measurements: Map<string, number[]> = new Map();

  start(queryName: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      const measurements = this.measurements.get(queryName) || [];
      measurements.push(duration);
      this.measurements.set(queryName, measurements);
    };
  }

  getStats(queryName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const measurements = this.measurements.get(queryName);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    return {
      count: measurements.length,
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
    };
  }

  getAllStats(): Record<string, ReturnType<QueryProfiler['getStats']>> {
    const stats: Record<string, any> = {};
    for (const [queryName, _] of this.measurements) {
      stats[queryName] = this.getStats(queryName);
    }
    return stats;
  }

  reset(): void {
    this.measurements.clear();
  }
}

/**
 * Global profiler instance
 */
export const globalProfiler = new QueryProfiler();

/**
 * Profile a query execution
 */
export async function profileQuery<T>(
  queryName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const end = globalProfiler.start(queryName);
  try {
    return await fn();
  } finally {
    end();
  }
}
