/**
 * SuiteStatistics Component
 * 
 * Dashboard showing aggregate evaluation metrics and trends.
 */

import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id, type Doc } from '../convex/_generated/dataModel'

interface SuiteStatisticsProps {
  tenantId: Id<'tenants'>
}

export function SuiteStatistics({ tenantId }: SuiteStatisticsProps) {
  const suites = useQuery(api.evaluationSuites.list, { tenantId }) as
    | Doc<'evaluationSuites'>[]
    | undefined
  const runs = useQuery(api.evaluationRuns.list, { tenantId }) as
    | Doc<'evaluationRuns'>[]
    | undefined

  if (!suites || !runs) {
    return (
      <div className="p-6 bg-arm-bg-secondary rounded-lg border border-arm-border">
        <div className="text-center text-arm-text-secondary">Loading statistics...</div>
      </div>
    )
  }

  // Calculate statistics
  const totalSuites = suites.length
  const totalRuns = runs.length
  const completedRuns = runs.filter(r => r.status === 'COMPLETED').length
  const pendingRuns = runs.filter(r => r.status === 'PENDING').length
  const runningRuns = runs.filter(r => r.status === 'RUNNING').length
  const failedRuns = runs.filter(r => r.status === 'FAILED').length
  const cancelledRuns = runs.filter(r => r.status === 'CANCELLED').length

  const completedRunsData = runs.filter(r => r.status === 'COMPLETED' && r.overallScore !== undefined)
  const avgScore =
    completedRunsData.length > 0
      ? completedRunsData.reduce((sum, r) => sum + (r.overallScore || 0), 0) / completedRunsData.length
      : 0

  const passedRuns = completedRunsData.filter(r => (r.passRate || 0) >= 0.8).length
  const successRate = completedRuns > 0 ? passedRuns / completedRuns : 0

  // Suite-level stats
  const suiteStats = suites.map(suite => {
    const suiteRuns = runs.filter(r => r.suiteId === suite._id)
    const suiteCompleted = suiteRuns.filter(r => r.status === 'COMPLETED')
    const suiteAvgScore =
      suiteCompleted.length > 0
        ? suiteCompleted.reduce((sum, r) => sum + (r.overallScore || 0), 0) / suiteCompleted.length
        : 0

    return {
      suite,
      totalRuns: suiteRuns.length,
      completedRuns: suiteCompleted.length,
      avgScore: suiteAvgScore,
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-arm-success'
    if (score >= 0.7) return 'text-arm-warning'
    return 'text-arm-danger'
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 0.9) return 'bg-arm-success'
    if (score >= 0.7) return 'bg-arm-warning'
    return 'bg-arm-danger'
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-arm-bg-secondary rounded-lg border border-arm-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-tertiary">Total Suites</span>
            <svg className="w-5 h-5 text-arm-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-arm-text-primary">{totalSuites}</div>
        </div>

        <div className="p-4 bg-arm-bg-secondary rounded-lg border border-arm-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-tertiary">Total Runs</span>
            <svg className="w-5 h-5 text-arm-accent" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-2xl font-bold text-arm-text-primary">{totalRuns}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-arm-text-tertiary">
            <span className="text-arm-success">{completedRuns} completed</span>
            <span>•</span>
            <span className="text-arm-warning">{runningRuns} running</span>
            <span>•</span>
            <span className="text-gray-500">{pendingRuns} pending</span>
            <span>•</span>
            <span className="text-arm-danger">{failedRuns} failed</span>
            {cancelledRuns > 0 && (
              <>
                <span>•</span>
                <span className="text-gray-500">{cancelledRuns} cancelled</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-arm-bg-secondary rounded-lg border border-arm-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-tertiary">Avg Score</span>
            <svg className="w-5 h-5 text-arm-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
            {completedRuns > 0 ? `${(avgScore * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="mt-2 w-full h-2 bg-arm-bg-primary rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBarColor(avgScore)} transition-all duration-300`}
              style={{ width: `${avgScore * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-arm-bg-secondary rounded-lg border border-arm-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-arm-text-tertiary">Success Rate</span>
            <svg className="w-5 h-5 text-arm-accent" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(successRate)}`}>
            {completedRuns > 0 ? `${(successRate * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="mt-2 text-xs text-arm-text-tertiary">
            {passedRuns} of {completedRuns} runs passed (≥80%)
          </div>
        </div>
      </div>

      {/* Suite Breakdown */}
      <div className="p-6 bg-arm-bg-secondary rounded-lg border border-arm-border">
        <h3 className="text-lg font-semibold text-arm-text-primary mb-4">Suite Performance</h3>

        {suiteStats.length === 0 ? (
          <div className="text-center py-8 text-arm-text-tertiary">
            No evaluation suites yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {suiteStats.map(({ suite, totalRuns, completedRuns, avgScore }) => (
              <div
                key={suite._id}
                className="p-4 bg-arm-bg-primary rounded-lg border border-arm-border hover:border-arm-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-arm-text-primary">{suite.name}</h4>
                    <p className="text-sm text-arm-text-tertiary mt-1">
                      {suite.testCases.length} test cases • {totalRuns} total runs • {completedRuns} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-arm-text-tertiary">Avg Score</div>
                      <div className={`text-lg font-semibold ${getScoreColor(avgScore)}`}>
                        {completedRuns > 0 ? `${(avgScore * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="w-24 h-2 bg-arm-bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBarColor(avgScore)} transition-all duration-300`}
                        style={{ width: `${avgScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {suite.tags && suite.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {suite.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-arm-accent/20 text-arm-accent rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-arm-bg-secondary rounded-lg border border-arm-border">
        <h3 className="text-lg font-semibold text-arm-text-primary mb-4">Recent Activity</h3>

        {runs.length === 0 ? (
          <div className="text-center py-8 text-arm-text-tertiary">
            No evaluation runs yet. Create a run to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {runs
              .slice(0, 5)
              .map(run => {
                const suite = suites.find(s => s._id === run.suiteId)
                const statusColor =
                  run.status === 'COMPLETED'
                    ? 'text-arm-success'
                    : run.status === 'RUNNING'
                    ? 'text-arm-warning'
                    : run.status === 'FAILED'
                    ? 'text-arm-danger'
                    : run.status === 'CANCELLED'
                    ? 'text-gray-500'
                    : 'text-arm-text-tertiary'

                return (
                  <div
                    key={run._id}
                    className="flex items-center justify-between p-3 bg-arm-bg-primary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusColor.replace('text-', 'bg-')}`} />
                      <div>
                        <div className="text-sm font-medium text-arm-text-primary">{suite?.name || 'Unknown Suite'}</div>
                        <div className="text-xs text-arm-text-tertiary">
                          {run.completedAt
                            ? new Date(run.completedAt).toLocaleString()
                            : run.startedAt
                            ? `Started ${new Date(run.startedAt).toLocaleString()}`
                            : 'Pending'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${statusColor}`}>{run.status}</span>
                      {run.overallScore !== undefined && (
                        <span className={`text-sm font-semibold ${getScoreColor(run.overallScore)}`}>
                          {(run.overallScore * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
