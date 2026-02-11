import { useQuery } from 'convex/react';
import {
  Activity, AlertTriangle, CheckCircle, TrendingUp, Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from 'agent-resources-platform/convex/_generated/api';

export function MonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch monitoring data
  const metrics = useQuery(api.monitoring.metrics.getCurrentMetrics, {});
  const health = useQuery(api.monitoring.healthCheck.healthCheck);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Force re-query by updating a dummy state
      setRefreshInterval((prev) => prev);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (!metrics || !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arm-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" />;
      case 'unhealthy':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-arm-text">System Monitoring</h2>
          <p className="text-sm text-arm-text-secondary">Real-time performance metrics and health status</p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-arm-text-secondary">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-arm-border"
            />
            Auto-refresh
          </label>

          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
            className="px-3 py-1 text-sm bg-arm-surface border border-arm-border rounded-lg text-arm-text disabled:opacity-50"
          >
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-secondary">Overall Status</span>
            <div className={getStatusColor(health.status)}>
              {getStatusIcon(health.status)}
            </div>
          </div>
          <div className="text-2xl font-bold text-arm-text capitalize">
            {health.status}
          </div>
        </div>

        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-secondary">Database</span>
            <CheckCircle className={`w-5 h-5 ${health.checks.database ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className="text-2xl font-bold text-arm-text">
            {health.checks.database ? 'Connected' : 'Error'}
          </div>
        </div>

        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-secondary">Queries</span>
            <Activity className={`w-5 h-5 ${health.checks.queries ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <div className="text-2xl font-bold text-arm-text">
            {health.checks.queries ? 'Healthy' : 'Degraded'}
          </div>
        </div>

        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-secondary">Mutations</span>
            <Zap className={`w-5 h-5 ${health.checks.mutations ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <div className="text-2xl font-bold text-arm-text">
            {health.checks.mutations ? 'Healthy' : 'Degraded'}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Query Performance */}
        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-arm-text mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Query Performance
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">Average Latency</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.queryLatency.avg.toFixed(2)}
                  ms
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.queryLatency.avg / 200) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">P95 Latency</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.queryLatency.p95.toFixed(2)}
                  ms
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.queryLatency.p95 / 500) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">Total Queries</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.totalQueries}
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.totalQueries > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-arm-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-arm-text-secondary">Error Rate</span>
                <span className="font-mono text-arm-text">{metrics.errorRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mutation Performance */}
        <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-arm-text mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Mutation Performance
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">Average Latency</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.mutationLatency.avg.toFixed(2)}
                  ms
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.mutationLatency.avg / 500) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">P95 Latency</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.mutationLatency.p95.toFixed(2)}
                  ms
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.mutationLatency.p95 / 1000) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-arm-text-secondary">Success Rate</span>
                <span className="text-sm font-mono text-arm-text">
                  {metrics.mutationSuccessRate.toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-arm-bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.mutationSuccessRate}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-arm-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-arm-text-secondary">Total Mutations</span>
                <span className="font-mono text-arm-text">{metrics.totalMutations}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Metrics */}
      <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-arm-text mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Error Tracking
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-arm-text-secondary mb-1">Error Rate</div>
            <div className="text-2xl font-bold text-arm-text">
              {metrics.errorRate.toFixed(2)}
              %
            </div>
            <div className="text-xs text-arm-text-secondary mt-1">
              {(metrics.errorRate * (metrics.totalQueries + metrics.totalMutations) / 100).toFixed(0)}
              {' '}
              errors
            </div>
          </div>

          <div>
            <div className="text-sm text-arm-text-secondary mb-1">Total Operations</div>
            <div className="text-2xl font-bold text-arm-text">
              {metrics.totalQueries + metrics.totalMutations}
            </div>
            <div className="text-xs text-arm-text-secondary mt-1">
              Queries:
              {' '}
              {metrics.totalQueries}
              , Mutations:
              {' '}
              {metrics.totalMutations}
            </div>
          </div>
        </div>
      </div>

      

      {/* System Info */}
      <div className="bg-arm-surface border border-arm-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-arm-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          System Information
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-arm-text-secondary mb-1">Uptime</div>
            <div className="font-mono text-arm-text">
              {health.uptime}
              s
            </div>
          </div>

          <div>
            <div className="text-arm-text-secondary mb-1">Last Check</div>
            <div className="font-mono text-arm-text">
              {new Date(health.timestamp).toLocaleTimeString()}
            </div>
          </div>

          <div>
            <div className="text-arm-text-secondary mb-1">Environment</div>
            <div className="font-mono text-arm-text">
              {process.env.NODE_ENV || 'development'}
            </div>
          </div>

          <div>
            <div className="text-arm-text-secondary mb-1">Version</div>
            <div className="font-mono text-arm-text">1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
