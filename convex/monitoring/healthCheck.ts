/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and load balancers.
 */

import { query } from "../_generated/server";
import { calculateMetrics } from "./metrics";

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  checks: {
    database: { status: HealthStatus; message: string };
    queries: { status: HealthStatus; message: string; avgLatencyMs: number };
    mutations: { status: HealthStatus; message: string; successRate: number };
    errors: { status: HealthStatus; message: string; errorRate: number };
  };
  metrics: {
    totalQueries: number;
    totalMutations: number;
    avgQueryLatency: number;
    avgMutationLatency: number;
    mutationSuccessRate: number;
    errorRate: number;
  };
}

// Track service start time
const SERVICE_START_TIME = Date.now();

/**
 * Health check thresholds
 */
const THRESHOLDS = {
  QUERY_LATENCY_WARNING: 100, // ms
  QUERY_LATENCY_CRITICAL: 500, // ms
  MUTATION_LATENCY_WARNING: 200, // ms
  MUTATION_LATENCY_CRITICAL: 1000, // ms
  SUCCESS_RATE_WARNING: 95, // percent
  SUCCESS_RATE_CRITICAL: 90, // percent
  ERROR_RATE_WARNING: 1, // percent
  ERROR_RATE_CRITICAL: 5, // percent
};

/**
 * Determine health status based on value and thresholds
 */
function getHealthStatus(
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
  inverse: boolean = false // true if lower is better
): HealthStatus {
  if (inverse) {
    if (value >= criticalThreshold) return 'unhealthy';
    if (value >= warningThreshold) return 'degraded';
    return 'healthy';
  } else {
    if (value <= criticalThreshold) return 'unhealthy';
    if (value <= warningThreshold) return 'degraded';
    return 'healthy';
  }
}

/**
 * Check database health
 */
async function checkDatabase(ctx: any): Promise<{
  status: HealthStatus;
  message: string;
}> {
  try {
    // Try a simple query to verify database connectivity
    await ctx.db.query("tenants").first();
    return {
      status: 'healthy',
      message: 'Database connection OK',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Check query performance
 */
function checkQueries(metrics: ReturnType<typeof calculateMetrics>): {
  status: HealthStatus;
  message: string;
  avgLatencyMs: number;
} {
  const avgLatency = metrics.queryLatency.avg;

  const status = getHealthStatus(
    avgLatency,
    THRESHOLDS.QUERY_LATENCY_WARNING,
    THRESHOLDS.QUERY_LATENCY_CRITICAL,
    true
  );

  let message = `Average query latency: ${avgLatency.toFixed(2)}ms`;
  if (status === 'degraded') {
    message += ' (above warning threshold)';
  } else if (status === 'unhealthy') {
    message += ' (above critical threshold)';
  }

  return {
    status,
    message,
    avgLatencyMs: avgLatency,
  };
}

/**
 * Check mutation performance
 */
function checkMutations(metrics: ReturnType<typeof calculateMetrics>): {
  status: HealthStatus;
  message: string;
  successRate: number;
} {
  const successRate = metrics.mutationSuccessRate;

  const status = getHealthStatus(
    successRate,
    THRESHOLDS.SUCCESS_RATE_WARNING,
    THRESHOLDS.SUCCESS_RATE_CRITICAL,
    false
  );

  let message = `Mutation success rate: ${successRate.toFixed(2)}%`;
  if (status === 'degraded') {
    message += ' (below warning threshold)';
  } else if (status === 'unhealthy') {
    message += ' (below critical threshold)';
  }

  return {
    status,
    message,
    successRate,
  };
}

/**
 * Check error rate
 */
function checkErrors(metrics: ReturnType<typeof calculateMetrics>): {
  status: HealthStatus;
  message: string;
  errorRate: number;
} {
  const errorRate = metrics.errorRate;

  const status = getHealthStatus(
    errorRate,
    THRESHOLDS.ERROR_RATE_WARNING,
    THRESHOLDS.ERROR_RATE_CRITICAL,
    true
  );

  let message = `Error rate: ${errorRate.toFixed(2)}%`;
  if (status === 'degraded') {
    message += ' (above warning threshold)';
  } else if (status === 'unhealthy') {
    message += ' (above critical threshold)';
  }

  return {
    status,
    message,
    errorRate,
  };
}

/**
 * Determine overall health status
 */
function getOverallStatus(checks: HealthCheckResult['checks']): HealthStatus {
  const statuses = Object.values(checks).map(check => check.status);

  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Health check query
 */
export const healthCheck = query({
  args: {},
  handler: async (ctx): Promise<HealthCheckResult> => {
    const timestamp = Date.now();
    const uptime = timestamp - SERVICE_START_TIME;

    // Get metrics for last 5 minutes
    const metrics = calculateMetrics(300000);

    // Run health checks
    const database = await checkDatabase(ctx);
    const queries = checkQueries(metrics);
    const mutations = checkMutations(metrics);
    const errors = checkErrors(metrics);

    const checks = {
      database,
      queries,
      mutations,
      errors,
    };

    const status = getOverallStatus(checks);

    return {
      status,
      timestamp,
      uptime,
      checks,
      metrics: {
        totalQueries: metrics.totalQueries,
        totalMutations: metrics.totalMutations,
        avgQueryLatency: metrics.queryLatency.avg,
        avgMutationLatency: metrics.mutationLatency.avg,
        mutationSuccessRate: metrics.mutationSuccessRate,
        errorRate: metrics.errorRate,
      },
    };
  },
});

/**
 * Simple liveness check (for load balancers)
 */
export const liveness = query({
  args: {},
  handler: async () => {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  },
});

/**
 * Readiness check (for load balancers)
 */
export const readiness = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Check if database is accessible
      await ctx.db.query("tenants").first();

      return {
        status: 'ready',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Get system info
 */
export const systemInfo = query({
  args: {},
  handler: async () => {
    return {
      version: process.env.npm_package_version || '0.3.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Date.now() - SERVICE_START_TIME,
      timestamp: Date.now(),
    };
  },
});
