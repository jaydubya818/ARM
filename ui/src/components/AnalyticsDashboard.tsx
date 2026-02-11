/**
 * Analytics Dashboard Component
 *
 * Displays evaluation metrics, trends, and comparisons.
 */

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import { Id, type Doc } from 'agent-resources-platform/convex/_generated/dataModel';
import { normalizeRate } from '../lib/metrics';

interface AnalyticsDashboardProps {
  tenantId: Id<'tenants'>;
}

type MetricAverages = {
  overallScore: number;
  passRate: number;
  avgExecutionTime: number;
  testCaseCount?: number;
  passedCount?: number;
  failedCount?: number;
};

type TrendPoint = {
  period: string;
  metrics: MetricAverages;
  sampleSize: number;
};

type ComparisonData = {
  version1: { id: Id<'agentVersions'>; metrics: MetricAverages; sampleSize: number };
  version2: { id: Id<'agentVersions'>; metrics: MetricAverages; sampleSize: number };
  deltas: { overallScore: number; passRate: number; avgExecutionTime: number };
  improvement: { score: boolean; passRate: boolean; speed: boolean };
};

type TenantStats = {
  totalRuns: number;
  uniqueVersions: number;
  uniqueSuites: number;
  averages: MetricAverages;
  topVersions: { versionId: string; avgScore: number; runCount: number }[];
  timeRange?: { start?: number; end?: number };
};

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedVersion, setSelectedVersion] = useState<Id<'agentVersions'> | null>(null);
  const [compareVersion, setCompareVersion] = useState<Id<'agentVersions'> | null>(null);

  // Calculate time range
  const now = Date.now();
  const timeRanges = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  const startTime = now - timeRanges[timeRange];

  // Queries
  const tenantStats = useQuery(api.analytics.getTenantStatistics, {
    tenantId,
    startTime,
    endTime: now,
  }) as TenantStats | undefined;

  const versions = useQuery(api.agentVersions.list, { tenantId }) as
    | Doc<'agentVersions'>[]
    | undefined;

  const versionTrend = useQuery(
    api.analytics.getTrend,
    selectedVersion
      ? {
        versionId: selectedVersion,
        period: 'daily',
        limit: 30,
      }
      : 'skip',
  ) as TrendPoint[] | undefined;

  const comparison = useQuery(
    api.analytics.compareVersions,
    selectedVersion && compareVersion
      ? {
        version1Id: selectedVersion,
        version2Id: compareVersion,
      }
      : 'skip',
  ) as ComparisonData | undefined;

  const formatScore = (score: number) => (score * 100).toFixed(1);
  const formatRate = (rate: number) => formatScore(normalizeRate(rate) ?? 0);
  const formatTime = (ms: number) => `${ms.toFixed(0)}ms`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Evaluation metrics, trends, and performance insights
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {tenantStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Runs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {tenantStats.totalRuns}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatScore(tenantStats.averages.overallScore)}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatRate(tenantStats.averages.passRate)}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatTime(tenantStats.averages.avgExecutionTime)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Version
            </label>
            <select
              value={selectedVersion || ''}
              onChange={(e) => {
                const value = e.target.value as Id<'agentVersions'>;
                setSelectedVersion(value || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a version...</option>
              {versions?.map((version) => (
                <option key={version._id} value={version._id}>
                  {version.versionLabel}
                  {' '}
                  -
                  {version.lifecycleState}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare With (Optional)
            </label>
            <select
              value={compareVersion || ''}
              onChange={(e) => {
                const value = e.target.value as Id<'agentVersions'>;
                setCompareVersion(value || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedVersion}
            >
              <option value="">No comparison</option>
              {versions
                ?.filter((v) => v._id !== selectedVersion)
                .map((version) => (
                  <option key={version._id} value={version._id}>
                    {version.versionLabel}
                    {' '}
                    -
                    {version.lifecycleState}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison View */}
      {comparison && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Version Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Version 1 */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">Version 1</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Score:</span>
                  <span className="text-sm font-medium">
                    {formatScore(comparison.version1.metrics.overallScore)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pass Rate:</span>
                  <span className="text-sm font-medium">
                    {formatRate(comparison.version1.metrics.passRate)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Time:</span>
                  <span className="text-sm font-medium">
                    {formatTime(comparison.version1.metrics.avgExecutionTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Runs:</span>
                  <span className="text-sm font-medium">
                    {comparison.version1.sampleSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Delta */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-3">Change</p>
                <div className="space-y-2">
                  <div
                    className={`text-lg font-bold ${
                      comparison.deltas.overallScore > 0
                        ? 'text-green-600'
                        : comparison.deltas.overallScore < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {comparison.deltas.overallScore > 0 ? '+' : ''}
                    {formatScore(comparison.deltas.overallScore)}
                    %
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      comparison.deltas.passRate > 0
                        ? 'text-green-600'
                        : comparison.deltas.passRate < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {comparison.deltas.passRate > 0 ? '+' : ''}
                    {formatRate(comparison.deltas.passRate)}
                    %
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      comparison.deltas.avgExecutionTime < 0
                        ? 'text-green-600'
                        : comparison.deltas.avgExecutionTime > 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {comparison.deltas.avgExecutionTime > 0 ? '+' : ''}
                    {formatTime(comparison.deltas.avgExecutionTime)}
                  </div>
                  <div className="text-sm text-gray-400">-</div>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">Version 2</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Score:</span>
                  <span className="text-sm font-medium">
                    {formatScore(comparison.version2.metrics.overallScore)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pass Rate:</span>
                  <span className="text-sm font-medium">
                    {formatRate(comparison.version2.metrics.passRate)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Time:</span>
                  <span className="text-sm font-medium">
                    {formatTime(comparison.version2.metrics.avgExecutionTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Runs:</span>
                  <span className="text-sm font-medium">
                    {comparison.version2.sampleSize}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvement Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Summary:</p>
            <ul className="mt-2 space-y-1">
              {comparison.improvement.score && (
                <li className="text-sm text-green-600">✓ Score improved</li>
              )}
              {comparison.improvement.passRate && (
                <li className="text-sm text-green-600">✓ Pass rate improved</li>
              )}
              {comparison.improvement.speed && (
                <li className="text-sm text-green-600">✓ Execution time improved</li>
              )}
              {!comparison.improvement.score
                && !comparison.improvement.passRate
                && !comparison.improvement.speed && (
                  <li className="text-sm text-gray-600">No improvements detected</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Trend Chart (Simplified) */}
      {versionTrend && versionTrend.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Trend
          </h3>
          <div className="space-y-4">
            {versionTrend.slice(0, 10).map((point) => (
              <div key={point.period} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{point.period}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${point.metrics.overallScore * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {formatScore(point.metrics.overallScore)}
                      %
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-16 text-right">
                  {point.sampleSize}
                  {' '}
                  runs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {tenantStats && tenantStats.topVersions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Versions
          </h3>
          <div className="space-y-3">
            {tenantStats.topVersions.map((version, index) => (
              <div
                key={version.versionId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                          ? 'bg-gray-200 text-gray-700'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version
                      {' '}
                      {version.versionId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {version.runCount}
                      {' '}
                      evaluation runs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatScore(version.avgScore)}
                    %
                  </p>
                  <p className="text-xs text-gray-500">avg score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
