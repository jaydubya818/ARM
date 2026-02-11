/**
 * Convex API helpers for modules with slash-prefixed paths.
 * The generated api type doesn't expose bracket access for "monitoring/metrics" etc.
 */
import { api } from 'agent-resources-platform/convex/_generated/api';
import type { FunctionReference } from 'convex/server';

export type MetricsResponse = {
  queryLatency: { avg: number; p50: number; p95: number; p99: number };
  mutationLatency: { avg: number; p50: number; p95: number; p99: number };
  mutationSuccessRate: number;
  errorRate: number;
  totalQueries: number;
  totalMutations: number;
  timestamp: number;
  windowMs: number;
};

export type HealthCheckResponse = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: {
    database: { status: string; message: string };
    queries: { status: string; message: string; avgLatencyMs: number };
    mutations: { status: string; message: string; successRate: number };
    errors: { status: string; message: string; errorRate: number };
  };
  metrics: Record<string, number>;
};

type ApiWithSlashModules = typeof api & {
  'monitoring/metrics': { getCurrentMetrics: FunctionReference<'query', 'public', { windowMs?: number }, MetricsResponse> };
  'monitoring/healthCheck': { healthCheck: FunctionReference<'query', 'public', Record<string, never>, HealthCheckResponse> };
  'monitoring/providerHealth': { checkProviderHealth: FunctionReference<'action', 'public', { healthEndpoint: string }, { status: string; statusCode?: number; error?: string }> };
};

export const monitoringApi = (api as ApiWithSlashModules)['monitoring/metrics'];
export const healthCheckApi = (api as ApiWithSlashModules)['monitoring/healthCheck'];
export const providerHealthApi = (api as ApiWithSlashModules)['monitoring/providerHealth'];
