/**
 * RunDetailsModal Component
 * 
 * Modal for viewing detailed evaluation run results with scoring breakdown.
 */

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import type { TestCaseResult } from '../../../packages/shared/src/types/evaluation'

interface RunDetailsModalProps {
  runId: Id<'evaluationRuns'>
  onClose: () => void
}

export function RunDetailsModal({ runId, onClose }: RunDetailsModalProps) {
  const run = useQuery(api.evaluationRuns.get, { runId })
  const suite = run?.suiteId ? useQuery(api.evaluationSuites.get, { suiteId: run.suiteId }) : undefined
  const version = run?.versionId ? useQuery(api.agentVersions.get, { versionId: run.versionId }) : undefined

  if (!run) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-arm-bg-secondary rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="text-center text-arm-text-secondary">Loading...</div>
        </div>
      </div>
    )
  }

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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const duration =
    run.startedAt && run.completedAt ? run.completedAt - run.startedAt : undefined

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-arm-bg-secondary rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-arm-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-arm-text-primary">Evaluation Run Details</h2>
              <p className="text-sm text-arm-text-secondary mt-1">
                {suite?.name} • {version?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-arm-text-secondary hover:text-arm-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="p-3 bg-arm-bg-primary rounded-lg">
              <div className="text-xs text-arm-text-tertiary mb-1">Status</div>
              <div className="text-lg font-semibold text-arm-text-primary">{run.status}</div>
            </div>
            <div className="p-3 bg-arm-bg-primary rounded-lg">
              <div className="text-xs text-arm-text-tertiary mb-1">Overall Score</div>
              <div className={`text-lg font-semibold ${getScoreColor(run.overallScore || 0)}`}>
                {run.overallScore !== undefined ? `${(run.overallScore * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="p-3 bg-arm-bg-primary rounded-lg">
              <div className="text-xs text-arm-text-tertiary mb-1">Pass Rate</div>
              <div className={`text-lg font-semibold ${getScoreColor(run.passRate || 0)}`}>
                {run.passRate !== undefined ? `${(run.passRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="p-3 bg-arm-bg-primary rounded-lg">
              <div className="text-xs text-arm-text-tertiary mb-1">Duration</div>
              <div className="text-lg font-semibold text-arm-text-primary">
                {duration ? formatDuration(duration) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {run.status === 'PENDING' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-arm-accent border-t-transparent mb-4" />
              <p className="text-arm-text-secondary">Evaluation pending...</p>
              <p className="text-sm text-arm-text-tertiary mt-2">
                This run will be processed by the cron job within 5 minutes
              </p>
            </div>
          )}

          {run.status === 'RUNNING' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-arm-accent border-t-transparent mb-4" />
              <p className="text-arm-text-secondary">Evaluation in progress...</p>
              <p className="text-sm text-arm-text-tertiary mt-2">Running test cases and calculating scores</p>
            </div>
          )}

          {run.status === 'CANCELLED' && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-arm-text-tertiary mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-arm-text-secondary">Evaluation cancelled</p>
            </div>
          )}

          {run.status === 'FAILED' && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-arm-danger mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-arm-danger">Evaluation failed</p>
              <p className="text-sm text-arm-text-tertiary mt-2">An error occurred during execution</p>
            </div>
          )}

          {run.status === 'COMPLETED' && run.results && (
            <div className="space-y-4">
              {run.results.map((result: TestCaseResult, index: number) => {
                const testCase = suite?.testCases.find(tc => tc.id === result.testCaseId)

                return (
                  <div
                    key={result.testCaseId}
                    className="p-4 bg-arm-bg-primary border border-arm-border rounded-lg"
                  >
                    {/* Test Case Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-arm-text-primary">
                          Test Case {index + 1}
                        </span>
                        {result.passed ? (
                          <span className="px-2 py-1 bg-arm-success/20 text-arm-success rounded text-xs font-medium">
                            ✓ PASSED
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-arm-danger/20 text-arm-danger rounded text-xs font-medium">
                            ✗ FAILED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${getScoreColor(result.score)}`}>
                          {(result.score * 100).toFixed(1)}%
                        </span>
                        <div className="w-24 h-2 bg-arm-bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getScoreBarColor(result.score)} transition-all duration-300`}
                            style={{ width: `${result.score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Test Case Details */}
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-arm-text-tertiary mb-1">Input</div>
                        <div className="px-3 py-2 bg-arm-bg-secondary rounded text-sm text-arm-text-primary font-mono">
                          {testCase?.input || 'N/A'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-arm-text-tertiary mb-1">Expected Output</div>
                          <div className="px-3 py-2 bg-arm-bg-secondary rounded text-sm text-arm-text-primary font-mono">
                            {testCase?.expectedOutput || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-arm-text-tertiary mb-1">Actual Output</div>
                          <div className="px-3 py-2 bg-arm-bg-secondary rounded text-sm text-arm-text-primary font-mono">
                            {result.actualOutput || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-arm-text-tertiary">
                        <span>
                          📊 Scoring: {testCase?.scoringCriteria.type || 'N/A'}
                        </span>
                        {testCase?.scoringCriteria.type === 'similarity' && testCase.scoringCriteria.threshold && (
                          <span>
                            🎯 Threshold: {(testCase.scoringCriteria.threshold * 100).toFixed(0)}%
                          </span>
                        )}
                        {result.executionTime !== undefined && (
                          <span>⏱️ {formatDuration(result.executionTime)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-arm-border flex items-center justify-between">
          <div className="text-xs text-arm-text-tertiary">
            {run.startedAt && (
              <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
            )}
            {run.completedAt && (
              <span className="ml-4">Completed: {new Date(run.completedAt).toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
