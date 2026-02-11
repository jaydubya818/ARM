/**
 * Performance Metrics Collection
 *
 * Collects and aggregates performance metrics for monitoring
 * query latency, mutation success rates, and system health.
 */

import { v } from 'convex/values';
import { query, mutation } from '../_generated/server';

/**
 * Metric types
 */
export type MetricType =
  | 'QUERY_LATENCY'
  | 'MUTATION_LATENCY'
  | 'MUTATION_SUCCESS'
  | 'MUTATION_FAILURE'
  | 'ERROR_RATE'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'API_CALL'
  | 'CUSTOM';

/**
 * Metric entry
 */
export interface MetricEntry {
  type: MetricType;
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percent' | 'bytes';
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * In-memory metrics store (for current session)
 */
const metricsStore: MetricEntry[] = [];
const MAX_METRICS = 10000; // Keep last 10k metrics

/**
 * Calculate percentiles from sorted array
 */
function calculatePercentiles(values: number[]): {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
} {
  if (values.length === 0) {
    return {
      avg: 0, p50: 0, p95: 0, p99: 0,
    };
  }

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const p50 = percentile(values, 0.5);
  const p95 = percentile(values, 0.95);
  const p99 = percentile(values, 0.99);

  return {
    avg, p50, p95, p99,
  };
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil(sortedValues.length * p) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Record a metric
 */
export function recordMetric(metric: Omit<MetricEntry, 'timestamp'>): void {
  const entry: MetricEntry = {
    ...metric,
    timestamp: Date.now(),
  };

  metricsStore.push(entry);

  // Keep only recent metrics
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Metric]', entry);
  }
}

/**
 * Record query latency
 */
export function recordQueryLatency(
  queryName: string,
  latencyMs: number,
  tags?: Record<string, string>,
): void {
  recordMetric({
    type: 'QUERY_LATENCY',
    name: queryName,
    value: latencyMs,
    unit: 'ms',
    tags,
  });
}

/**
 * Record mutation latency
 */
export function recordMutationLatency(
  mutationName: string,
  latencyMs: number,
  tags?: Record<string, string>,
): void {
  recordMetric({
    type: 'MUTATION_LATENCY',
    name: mutationName,
    value: latencyMs,
    unit: 'ms',
    tags,
  });
}

/**
 * Record mutation success
 */
export function recordMutationSuccess(
  mutationName: string,
  tags?: Record<string, string>,
): void {
  recordMetric({
    type: 'MUTATION_SUCCESS',
    name: mutationName,
    value: 1,
    unit: 'count',
    tags,
  });
}

/**
 * Record mutation failure
 */
export function recordMutationFailure(
  mutationName: string,
  errorCode: string,
  tags?: Record<string, string>,
): void {
  recordMetric({
    type: 'MUTATION_FAILURE',
    name: mutationName,
    value: 1,
    unit: 'count',
    tags: { ...tags, errorCode },
  });
}

/**
 * Calculate metrics for a time window
 */
export function calculateMetrics(
  windowMs = 60000, // Default: last 1 minute
): {
  queryLatency: { avg: number; p50: number; p95: number; p99: number };
  mutationLatency: { avg: number; p50: number; p95: number; p99: number };
  mutationSuccessRate: number;
  errorRate: number;
  totalQueries: number;
  totalMutations: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Filter metrics in time window
  const recentMetrics = metricsStore.filter((m) => m.timestamp >= windowStart);

  // Calculate query latency
  const queryLatencies = recentMetrics
    .filter((m) => m.type === 'QUERY_LATENCY')
    .map((m) => m.value)
    .sort((a, b) => a - b);

  const queryLatency = calculatePercentiles(queryLatencies);

  // Calculate mutation latency
  const mutationLatencies = recentMetrics
    .filter((m) => m.type === 'MUTATION_LATENCY')
    .map((m) => m.value)
    .sort((a, b) => a - b);

  const mutationLatency = calculatePercentiles(mutationLatencies);

  // Calculate success rate
  const mutationSuccesses = recentMetrics.filter(
    (m) => m.type === 'MUTATION_SUCCESS',
  ).length;
  const mutationFailures = recentMetrics.filter(
    (m) => m.type === 'MUTATION_FAILURE',
  ).length;
  const totalMutations = mutationSuccesses + mutationFailures;
  const mutationSuccessRate = totalMutations > 0 ? (mutationSuccesses / totalMutations) * 100 : 100;

  // Calculate error rate
  const totalErrors = recentMetrics.filter(
    (m) => m.type === 'MUTATION_FAILURE' || m.type === 'ERROR_RATE',
  ).length;
  const totalOperations = queryLatencies.length + totalMutations;
  const errorRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;

  return {
    queryLatency,
    mutationLatency,
    mutationSuccessRate,
    errorRate,
    totalQueries: queryLatencies.length,
    totalMutations,
  };
}

/**
 * Get current metrics (Convex query)
 */
export const getCurrentMetrics = query({
  args: {
    windowMs: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const metrics = calculateMetrics(args.windowMs || 60000);
    return {
      ...metrics,
      timestamp: Date.now(),
      windowMs: args.windowMs || 60000,
    };
  },
});

/**
 * Get metrics by type
 */
export const getMetricsByType = query({
  args: {
    type: v.string(),
    windowMs: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const now = Date.now();
    const windowStart = now - (args.windowMs || 60000);

    const filtered = metricsStore
      .filter((m) => m.type === args.type && m.timestamp >= windowStart)
      .map((m) => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        timestamp: m.timestamp,
        tags: m.tags,
      }));

    return {
      type: args.type,
      metrics: filtered,
      count: filtered.length,
    };
  },
});

/**
 * Get top slow queries
 */
export const getSlowQueries = query({
  args: {
    limit: v.optional(v.number()),
    thresholdMs: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const limit = args.limit || 10;
    const threshold = args.thresholdMs || 100;

    const slowQueries = metricsStore
      .filter((m) => m.type === 'QUERY_LATENCY' && m.value > threshold)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((m) => ({
        name: m.name,
        latencyMs: m.value,
        timestamp: m.timestamp,
        tags: m.tags,
      }));

    return {
      slowQueries,
      threshold,
      count: slowQueries.length,
    };
  },
});

/**
 * Get error breakdown
 */
export const getErrorBreakdown = query({
  args: {
    windowMs: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const now = Date.now();
    const windowStart = now - (args.windowMs || 3600000); // Default: 1 hour

    const errors = metricsStore.filter(
      (m) => m.type === 'MUTATION_FAILURE' && m.timestamp >= windowStart,
    );

    // Group by error code
    const breakdown: Record<string, number> = {};
    errors.forEach((error) => {
      const code = error.tags?.errorCode || 'UNKNOWN';
      breakdown[code] = (breakdown[code] || 0) + 1;
    });

    return {
      breakdown,
      totalErrors: errors.length,
      windowMs: args.windowMs || 3600000,
    };
  },
});

/**
 * Clear old metrics (maintenance)
 */
export const clearOldMetrics = mutation({
  args: {
    olderThanMs: v.number(),
  },
  handler: async (_ctx, args) => {
    const cutoff = Date.now() - args.olderThanMs;
    const before = metricsStore.length;

    // Remove old metrics (oldest first)
    while (metricsStore.length > 0 && metricsStore[0].timestamp < cutoff) {
      metricsStore.shift();
    }

    const removed = before - metricsStore.length;

    return {
      removed,
      remaining: metricsStore.length,
    };
  },
});

/**
 * Wrapper to measure function execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  metricName: string,
  metricType: 'query' | 'mutation' = 'query',
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const latency = Date.now() - start;

    if (metricType === 'query') {
      recordQueryLatency(metricName, latency);
    } else {
      recordMutationLatency(metricName, latency);
      recordMutationSuccess(metricName);
    }

    return result;
  } catch (error) {
    const latency = Date.now() - start;

    if (metricType === 'mutation') {
      recordMutationLatency(metricName, latency);
      recordMutationFailure(
        metricName,
        error instanceof Error ? error.name : 'UNKNOWN',
      );
    }

    throw error;
  }
}
