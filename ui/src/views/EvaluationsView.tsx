import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { useTenant } from '../contexts/TenantContext'
import { api } from '../convex/_generated/api'
import { Id, type Doc } from '../convex/_generated/dataModel'
import { StatusChip } from '../components/StatusChip'
import { CopyButton } from '../components/CopyButton'
import { CreateSuiteModal } from '../components/CreateSuiteModal'
import { CreateRunModal } from '../components/CreateRunModal'
import { RunDetailsModal } from '../components/RunDetailsModal'
import { SuiteStatistics } from '../components/SuiteStatistics'
import { toast } from '../lib/toast'
import { normalizeRate } from '../lib/metrics'

type EvalRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
type ViewMode = 'runs' | 'suites' | 'statistics'

export function EvaluationsView() {
  const [viewMode, setViewMode] = useState<ViewMode>('runs')
  const [selectedStatus, setSelectedStatus] = useState<EvalRunStatus | 'ALL'>('ALL')
  const [selectedRunId, setSelectedRunId] = useState<Id<'evaluationRuns'> | null>(null)
  const [showCreateSuite, setShowCreateSuite] = useState(false)
  const [showCreateRun, setShowCreateRun] = useState(false)

  const { tenantId } = useTenant()

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
  ) as Doc<'evaluationRuns'>[] | undefined

  // Fetch evaluation suites
  const suites = useQuery(
    api.evaluationSuites.list,
    tenantId ? { tenantId } : 'skip'
  ) as Doc<'evaluationSuites'>[] | undefined

  const executeRun = useAction(api.evaluationActions.executeRun)
  const cancelRun = useMutation(api.evaluationRuns.cancel)

  const handleExecute = async (runId: Id<'evaluationRuns'>) => {
    try {
      toast.info('Starting evaluation...')
      const result = await executeRun({ runId })
      if (result?.status === 'CANCELLED') {
        toast.warning('Evaluation was cancelled before completion')
        return
      }
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
      setSelectedRunId(null)
    } catch (error) {
      toast.error('Error: ' + (error as Error).message)
    }
  }

  const refreshData = () => {
    // Convex automatically refreshes queries
    toast.success('Data refreshed')
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-arm-text-primary mb-2">Evaluations</h1>
            <p className="text-arm-text-secondary">
              Test suites and evaluation runs for agent versions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-arm-bg-secondary border border-arm-border text-arm-text-primary rounded-lg hover:bg-arm-bg-primary transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowCreateSuite(true)}
              className="px-4 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors"
            >
              + Create Suite
            </button>
            <button
              onClick={() => setShowCreateRun(true)}
              className="px-4 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors"
            >
              ▶ Run Evaluation
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-6 border-b border-arm-border">
        <div className="flex gap-6">
          <button
            className={`pb-3 px-1 border-b-2 transition-colors font-medium ${
              viewMode === 'runs'
                ? 'border-arm-accent text-arm-accent'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text-primary'
            }`}
            onClick={() => setViewMode('runs')}
          >
            Evaluation Runs
          </button>
          <button
            className={`pb-3 px-1 border-b-2 transition-colors font-medium ${
              viewMode === 'suites'
                ? 'border-arm-accent text-arm-accent'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text-primary'
            }`}
            onClick={() => setViewMode('suites')}
          >
            Test Suites
          </button>
          <button
            className={`pb-3 px-1 border-b-2 transition-colors font-medium ${
              viewMode === 'statistics'
                ? 'border-arm-accent text-arm-accent'
                : 'border-transparent text-arm-text-secondary hover:text-arm-text-primary'
            }`}
            onClick={() => setViewMode('statistics')}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Runs View */}
      {viewMode === 'runs' && (
        <>
          {/* Status Filter Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'ALL'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('ALL')}
            >
              All ({runs?.length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'PENDING'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('PENDING')}
            >
              Pending ({runs?.filter(r => r.status === 'PENDING').length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'RUNNING'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('RUNNING')}
            >
              Running ({runs?.filter(r => r.status === 'RUNNING').length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('COMPLETED')}
            >
              Completed ({runs?.filter(r => r.status === 'COMPLETED').length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'FAILED'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('FAILED')}
            >
              Failed ({runs?.filter(r => r.status === 'FAILED').length || 0})
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === 'CANCELLED'
                  ? 'bg-arm-accent text-white'
                  : 'bg-arm-bg-secondary text-arm-text-secondary hover:bg-arm-bg-primary'
              }`}
              onClick={() => setSelectedStatus('CANCELLED')}
            >
              Cancelled ({runs?.filter(r => r.status === 'CANCELLED').length || 0})
            </button>
          </div>

          {/* Evaluation Runs Table */}
          <div className="bg-arm-bg-secondary rounded-lg border border-arm-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-arm-bg-primary border-b border-arm-border">
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
                  filteredRuns.map((run) => {
                    const suite = suites?.find(s => s._id === run.suiteId)
                    return (
                      <tr
                        key={run._id}
                        className="border-b border-arm-border hover:bg-arm-bg-primary transition-colors cursor-pointer"
                        onClick={() => setSelectedRunId(run._id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-arm-text-secondary">
                              {run._id.slice(-8)}
                            </code>
                            <CopyButton text={run._id} />
                          </div>
                        </td>
                        <td className="p-4 text-arm-text-primary">
                          {suite?.name || <code className="text-sm">{run.suiteId.slice(-8)}</code>}
                        </td>
                        <td className="p-4 text-arm-text-primary">
                          <code className="text-sm">{run.versionId.slice(-8)}</code>
                        </td>
                        <td className="p-4">
                          <StatusChip type="eval" status={run.status} />
                        </td>
                        <td className="p-4 text-arm-text-primary">
                          {run.passRate !== undefined
                            ? `${((normalizeRate(run.passRate) || 0) * 100).toFixed(1)}%`
                            : '—'}
                        </td>
                        <td className="p-4 text-arm-text-primary">
                          {run.overallScore !== undefined
                            ? `${(run.overallScore * 100).toFixed(1)}%`
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
                                className="px-3 py-1 text-sm bg-arm-accent text-white rounded hover:bg-arm-accent-hover"
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
                                className="px-3 py-1 text-sm bg-arm-danger text-white rounded hover:bg-red-600"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Suites View */}
      {viewMode === 'suites' && (
        <div className="bg-arm-bg-secondary rounded-lg border border-arm-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-arm-bg-primary border-b border-arm-border">
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
                    className="border-b border-arm-border hover:bg-arm-bg-primary transition-colors"
                  >
                    <td className="p-4 text-arm-text-primary font-medium">{suite.name}</td>
                    <td className="p-4 text-arm-text-secondary">
                      {suite.description || '—'}
                    </td>
                    <td className="p-4 text-arm-text-primary">{suite.testCases.length}</td>
                    <td className="p-4">
                      {suite.tags && suite.tags.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {suite.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-arm-accent/20 text-arm-accent rounded"
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
      )}

      {/* Statistics View */}
      {viewMode === 'statistics' && <SuiteStatistics tenantId={tenantId} />}

      {/* Modals */}
      {selectedRunId && (
        <RunDetailsModal runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
      )}

      {showCreateSuite && tenantId && operatorId && (
        <CreateSuiteModal
          tenantId={tenantId}
          operatorId={operatorId}
          onClose={() => setShowCreateSuite(false)}
          onSuccess={() => {
            setShowCreateSuite(false)
            refreshData()
          }}
        />
      )}

      {showCreateRun && tenantId && (
        <CreateRunModal
          tenantId={tenantId}
          onClose={() => setShowCreateRun(false)}
          onSuccess={() => {
            setShowCreateRun(false)
            refreshData()
          }}
        />
      )}
    </div>
  )
}
