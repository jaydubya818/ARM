import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { StatusChip } from '../components/StatusChip'
import { CopyButton } from '../components/CopyButton'
import { toast } from '../lib/toast'

type EvalRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export function EvaluationsView() {
  const [selectedStatus, setSelectedStatus] = useState<EvalRunStatus | 'ALL'>('ALL')
  const [selectedRun, setSelectedRun] = useState<any | null>(null)
  const [showCreateSuite, setShowCreateSuite] = useState(false)
  const [showCreateRun, setShowCreateRun] = useState(false)

  // Get first tenant and operator (for demo)
  const tenants = useQuery(api.tenants.list)
  const tenantId = tenants?.[0]?._id

  const operators = useQuery(
    api.operators.list,
    tenantId ? { tenantId } : 'skip'
  )
  const operatorId = operators?.[0]?._id

  // Fetch evaluation runs
  const runs = useQuery(
    api.evaluationRuns.list,
    tenantId
      ? {
          tenantId,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        }
      : 'skip'
  )

  // Fetch evaluation suites
  const suites = useQuery(
    api.evaluationSuites.list,
    tenantId ? { tenantId } : 'skip'
  )

  const executeRun = useAction(api.evaluationActions.executeRun)
  const cancelRun = useMutation(api.evaluationRuns.cancel)

  const handleExecute = async (runId: Id<'evaluationRuns'>) => {
    try {
      toast.info('Starting evaluation...')
      await executeRun({ runId })
      toast.success('Evaluation completed successfully')
    } catch (error) {
      toast.error('Error: ' + (error as Error).message)
    }
  }

  const handleCancel = async (runId: Id<'evaluationRuns'>) => {
    if (!operatorId) {
      toast.error('No operator found')
      return
    }

    const confirm = window.confirm('Cancel this evaluation run?')
    if (!confirm) return

    try {
      await cancelRun({ runId, cancelledBy: operatorId })
      toast.success('Evaluation cancelled')
      setSelectedRun(null)
    } catch (error) {
      toast.error('Error: ' + (error as Error).message)
    }
  }

  if (!tenantId) {
    return (
      <div className="p-8">
        <div className="text-arm-text-secondary">Loading...</div>
      </div>
    )
  }

  const filteredRuns = runs || []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-arm-text mb-2">Evaluations</h1>
        <p className="text-arm-text-secondary">
          Test suites and evaluation runs for agent versions
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowCreateSuite(true)}
          className="px-4 py-2 bg-arm-primary text-white rounded-lg hover:bg-arm-primary-hover transition-colors"
        >
          Create Suite
        </button>
        <button
          onClick={() => setShowCreateRun(true)}
          className="px-4 py-2 bg-arm-surface border border-arm-border text-arm-text rounded-lg hover:bg-arm-surface-hover transition-colors"
        >
          Run Evaluation
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-arm-border">
        <div className="flex gap-6">
          <button
            className={`pb-3 px-1 border-b-2 transition-colors ${
              selectedStatus === 'ALL'
                ? 'border-arm-primary text-arm-primary'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text'
            }`}
            onClick={() => setSelectedStatus('ALL')}
          >
            All Runs ({runs?.length || 0})
          </button>
          <button
            className={`pb-3 px-1 border-b-2 transition-colors ${
              selectedStatus === 'PENDING'
                ? 'border-arm-primary text-arm-primary'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text'
            }`}
            onClick={() => setSelectedStatus('PENDING')}
          >
            Pending ({runs?.filter(r => r.status === 'PENDING').length || 0})
          </button>
          <button
            className={`pb-3 px-1 border-b-2 transition-colors ${
              selectedStatus === 'RUNNING'
                ? 'border-arm-primary text-arm-primary'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text'
            }`}
            onClick={() => setSelectedStatus('RUNNING')}
          >
            Running ({runs?.filter(r => r.status === 'RUNNING').length || 0})
          </button>
          <button
            className={`pb-3 px-1 border-b-2 transition-colors ${
              selectedStatus === 'COMPLETED'
                ? 'border-arm-primary text-arm-primary'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text'
            }`}
            onClick={() => setSelectedStatus('COMPLETED')}
          >
            Completed ({runs?.filter(r => r.status === 'COMPLETED').length || 0})
          </button>
        </div>
      </div>

      {/* Evaluation Runs Table */}
      <div className="bg-arm-surface rounded-lg border border-arm-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-arm-surface-hover border-b border-arm-border">
            <tr>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Run ID</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Suite</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Version</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Status</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Pass Rate</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Score</th>
              <th className="text-left p-4 text-arm-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-arm-text-secondary">
                  No evaluation runs found
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => (
                <tr
                  key={run._id}
                  className="border-b border-arm-border hover:bg-arm-surface-hover transition-colors cursor-pointer"
                  onClick={() => setSelectedRun(run)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-arm-text-secondary">
                        {run._id.slice(-8)}
                      </code>
                      <CopyButton text={run._id} />
                    </div>
                  </td>
                  <td className="p-4 text-arm-text">
                    {/* Suite name would need to be fetched separately */}
                    <code className="text-sm">{run.suiteId.slice(-8)}</code>
                  </td>
                  <td className="p-4 text-arm-text">
                    <code className="text-sm">{run.versionId.slice(-8)}</code>
                  </td>
                  <td className="p-4">
                    <StatusChip type="eval" status={run.status} />
                  </td>
                  <td className="p-4 text-arm-text">
                    {run.passRate !== undefined
                      ? `${run.passRate.toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="p-4 text-arm-text">
                    {run.overallScore !== undefined
                      ? run.overallScore.toFixed(2)
                      : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {run.status === 'PENDING' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExecute(run._id)
                          }}
                          className="px-3 py-1 text-sm bg-arm-primary text-white rounded hover:bg-arm-primary-hover"
                        >
                          Execute
                        </button>
                      )}
                      {(run.status === 'PENDING' || run.status === 'RUNNING') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancel(run._id)
                          }}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Evaluation Suites Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-arm-text mb-4">Evaluation Suites</h2>
        <div className="bg-arm-surface rounded-lg border border-arm-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-arm-surface-hover border-b border-arm-border">
              <tr>
                <th className="text-left p-4 text-arm-text-secondary font-medium">Name</th>
                <th className="text-left p-4 text-arm-text-secondary font-medium">Description</th>
                <th className="text-left p-4 text-arm-text-secondary font-medium">Test Cases</th>
                <th className="text-left p-4 text-arm-text-secondary font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {!suites || suites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-arm-text-secondary">
                    No evaluation suites found. Create one to get started.
                  </td>
                </tr>
              ) : (
                suites.map((suite) => (
                  <tr
                    key={suite._id}
                    className="border-b border-arm-border hover:bg-arm-surface-hover transition-colors"
                  >
                    <td className="p-4 text-arm-text font-medium">{suite.name}</td>
                    <td className="p-4 text-arm-text-secondary">
                      {suite.description || '—'}
                    </td>
                    <td className="p-4 text-arm-text">{suite.testCases.length}</td>
                    <td className="p-4">
                      {suite.tags && suite.tags.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {suite.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-arm-surface-hover border border-arm-border rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-arm-text-secondary">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Details Modal */}
      {selectedRun && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRun(null)}
        >
          <div
            className="bg-arm-surface rounded-lg border border-arm-border max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-arm-text mb-2">
                    Evaluation Run Details
                  </h2>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-arm-text-secondary">{selectedRun._id}</code>
                    <CopyButton text={selectedRun._id} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-arm-text-secondary hover:text-arm-text"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-arm-text-secondary">Status</label>
                  <div className="mt-1">
                    <StatusChip type="eval" status={selectedRun.status} />
                  </div>
                </div>

                {selectedRun.passRate !== undefined && (
                  <div>
                    <label className="text-sm text-arm-text-secondary">Pass Rate</label>
                    <div className="mt-1 text-arm-text font-medium">
                      {selectedRun.passRate.toFixed(1)}%
                    </div>
                  </div>
                )}

                {selectedRun.overallScore !== undefined && (
                  <div>
                    <label className="text-sm text-arm-text-secondary">Overall Score</label>
                    <div className="mt-1 text-arm-text font-medium">
                      {selectedRun.overallScore.toFixed(2)}
                    </div>
                  </div>
                )}

                {selectedRun.results && selectedRun.results.length > 0 && (
                  <div>
                    <label className="text-sm text-arm-text-secondary mb-2 block">
                      Test Results
                    </label>
                    <div className="space-y-2">
                      {selectedRun.results.map((result: any) => (
                        <div
                          key={result.testCaseId}
                          className="p-3 bg-arm-surface-hover rounded border border-arm-border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <code className="text-sm text-arm-text">{result.testCaseId}</code>
                            <span
                              className={`text-sm font-medium ${
                                result.passed ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {result.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          {result.score !== undefined && (
                            <div className="text-sm text-arm-text-secondary">
                              Score: {result.score.toFixed(2)}
                            </div>
                          )}
                          {result.error && (
                            <div className="text-sm text-red-500 mt-1">
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Suite Modal (placeholder) */}
      {showCreateSuite && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateSuite(false)}
        >
          <div
            className="bg-arm-surface rounded-lg border border-arm-border max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-arm-text mb-4">Create Evaluation Suite</h2>
            <p className="text-arm-text-secondary mb-4">
              Suite creation UI coming soon. Use Convex dashboard to create suites for now.
            </p>
            <button
              onClick={() => setShowCreateSuite(false)}
              className="px-4 py-2 bg-arm-primary text-white rounded hover:bg-arm-primary-hover"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Run Modal (placeholder) */}
      {showCreateRun && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateRun(false)}
        >
          <div
            className="bg-arm-surface rounded-lg border border-arm-border max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-arm-text mb-4">Run Evaluation</h2>
            <p className="text-arm-text-secondary mb-4">
              Run creation UI coming soon. Use Convex dashboard to create runs for now.
            </p>
            <button
              onClick={() => setShowCreateRun(false)}
              className="px-4 py-2 bg-arm-primary text-white rounded hover:bg-arm-primary-hover"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
