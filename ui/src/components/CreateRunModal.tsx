/**
 * CreateRunModal Component
 * 
 * Modal for triggering manual evaluation runs.
 */

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from '../lib/toast'

interface CreateRunModalProps {
  tenantId: Id<'tenants'>
  onClose: () => void
  onSuccess?: () => void
}

export function CreateRunModal({ tenantId, onClose, onSuccess }: CreateRunModalProps) {
  const createRun = useMutation(api.evaluationRuns.create)
  const suites = useQuery(api.evaluationSuites.list, { tenantId })
  const versions = useQuery(api.agentVersions.list, { tenantId })

  const [suiteId, setSuiteId] = useState<Id<'evaluationSuites'> | ''>('')
  const [versionId, setVersionId] = useState<Id<'agentVersions'> | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!suiteId) {
      toast.error('Please select an evaluation suite')
      return
    }

    if (!versionId) {
      toast.error('Please select an agent version')
      return
    }

    setIsSubmitting(true)

    try {
      await createRun({
        tenantId,
        suiteId: suiteId as Id<'evaluationSuites'>,
        versionId: versionId as Id<'agentVersions'>,
      })

      const suite = suites?.find(s => s._id === suiteId)
      const version = versions?.find(v => v._id === versionId)

      toast.success(`Evaluation run created for "${version?.name}" with suite "${suite?.name}"`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create run:', error)
      toast.error((error as Error).message || 'Failed to create evaluation run')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSuite = suites?.find(s => s._id === suiteId)
  const selectedVersion = versions?.find(v => v._id === versionId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-arm-bg-secondary rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-arm-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-arm-text-primary">Create Evaluation Run</h2>
          <button
            onClick={onClose}
            className="text-arm-text-secondary hover:text-arm-text-primary transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Suite Selection */}
            <div>
              <label className="block text-sm font-medium text-arm-text-primary mb-2">
                Evaluation Suite <span className="text-arm-danger">*</span>
              </label>
              <select
                value={suiteId}
                onChange={e => setSuiteId(e.target.value as Id<'evaluationSuites'>)}
                className="w-full px-3 py-2 bg-arm-bg-primary border border-arm-border rounded-lg text-arm-text-primary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent"
                disabled={isSubmitting || !suites}
              >
                <option value="">Select a suite...</option>
                {suites?.map(suite => (
                  <option key={suite._id} value={suite._id}>
                    {suite.name} ({suite.testCases.length} test{suite.testCases.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>

              {selectedSuite && (
                <div className="mt-2 p-3 bg-arm-bg-primary border border-arm-border rounded-lg">
                  <p className="text-sm text-arm-text-secondary">{selectedSuite.description || 'No description'}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-arm-text-tertiary">
                    <span>📝 {selectedSuite.testCases.length} test cases</span>
                    {selectedSuite.tags && selectedSuite.tags.length > 0 && (
                      <span>🏷️ {selectedSuite.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Version Selection */}
            <div>
              <label className="block text-sm font-medium text-arm-text-primary mb-2">
                Agent Version <span className="text-arm-danger">*</span>
              </label>
              <select
                value={versionId}
                onChange={e => setVersionId(e.target.value as Id<'agentVersions'>)}
                className="w-full px-3 py-2 bg-arm-bg-primary border border-arm-border rounded-lg text-arm-text-primary focus:outline-none focus:ring-2 focus:ring-arm-accent focus:border-transparent"
                disabled={isSubmitting || !versions}
              >
                <option value="">Select a version...</option>
                {versions?.map(version => (
                  <option key={version._id} value={version._id}>
                    {version.name} - {version.lifecycleState}
                  </option>
                ))}
              </select>

              {selectedVersion && (
                <div className="mt-2 p-3 bg-arm-bg-primary border border-arm-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-arm-text-primary">{selectedVersion.name}</span>
                    <span className="px-2 py-1 bg-arm-accent/20 text-arm-accent rounded text-xs">
                      {selectedVersion.lifecycleState}
                    </span>
                  </div>
                  <p className="text-xs text-arm-text-secondary">
                    {selectedVersion.description || 'No description'}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-arm-text-tertiary">
                    <span>🔢 Version {selectedVersion.version}</span>
                    <span>🔐 Hash: {selectedVersion.genomeHash.slice(0, 8)}...</span>
                    {selectedVersion.evalStatus && (
                      <span>
                        📊 Eval: {selectedVersion.evalStatus === 'NOT_RUN' ? 'Not Run' : selectedVersion.evalStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-arm-accent/10 border border-arm-accent/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-arm-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-arm-text-secondary">
                  <p className="font-medium text-arm-text-primary mb-1">About Evaluation Runs</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Runs are processed automatically by the cron job (every 5 minutes)</li>
                    <li>The version's evalStatus will be updated to RUNNING, then PASS or FAIL</li>
                    <li>You can view detailed results in the runs table once complete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-arm-text-secondary hover:text-arm-text-primary transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-arm-accent text-white rounded-lg hover:bg-arm-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
              disabled={isSubmitting || !suiteId || !versionId}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Run'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
