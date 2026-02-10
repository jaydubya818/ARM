import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

export function PoliciesView() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<Id<'policyEnvelopes'> | null>(null)

  // Get first tenant (for demo)
  const tenants = useQuery(api.tenants.list)
  const tenantId = tenants?.[0]?._id

  // Fetch policies
  const policies = useQuery(
    api.policyEnvelopes.list,
    tenantId ? { tenantId } : 'skip'
  )

  const createPolicy = useMutation(api.policyEnvelopes.create)
  const updatePolicy = useMutation(api.policyEnvelopes.update)
  const deletePolicy = useMutation(api.policyEnvelopes.remove)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tenantId) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const autonomyTier = parseInt(formData.get('autonomyTier') as string)
    const allowedTools = (formData.get('allowedTools') as string)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const dailyTokens = formData.get('dailyTokens') as string
    const monthlyCost = formData.get('monthlyCost') as string

    try {
      await createPolicy({
        tenantId,
        name,
        autonomyTier,
        allowedTools,
        costLimits: {
          dailyTokens: dailyTokens ? parseInt(dailyTokens) : undefined,
          monthlyCost: monthlyCost ? parseFloat(monthlyCost) : undefined,
        },
      })
      setIsCreating(false)
      e.currentTarget.reset()
    } catch (error) {
      alert('Error creating policy: ' + (error as Error).message)
    }
  }

  const handleDelete = async (policyId: Id<'policyEnvelopes'>) => {
    if (!confirm('Are you sure you want to delete this policy?')) return

    try {
      await deletePolicy({ policyId })
    } catch (error) {
      alert('Error deleting policy: ' + (error as Error).message)
    }
  }

  if (!tenantId) {
    return (
      <div className="p-6">
        <div className="text-center text-arm-textMuted">
          No tenant found. Run seed script first.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-arm-text mb-2">
            Policy Envelopes
          </h1>
          <p className="text-arm-textMuted">
            Define governance rules for agent autonomy and resource limits
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors"
        >
          Create Policy
        </button>
      </div>

      {/* Create Policy Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-arm-surfaceLight rounded-lg border border-arm-border w-[600px] max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-arm-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-arm-text">
                Create Policy Envelope
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-arm-textMuted hover:text-arm-text"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Policy Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="e.g., Standard Support Policy"
                />
              </div>

              {/* Autonomy Tier */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Autonomy Tier (0-5) *
                </label>
                <input
                  type="number"
                  name="autonomyTier"
                  required
                  min="0"
                  max="5"
                  defaultValue="2"
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                />
                <p className="text-xs text-arm-textMuted">
                  0 = No autonomy (all actions require approval)<br />
                  1 = Minimal (critical/high risk require approval)<br />
                  2 = Low (critical requires approval)<br />
                  3-5 = Medium to full autonomy
                </p>
              </div>

              {/* Allowed Tools */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Allowed Tools (comma-separated) *
                </label>
                <textarea
                  name="allowedTools"
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none resize-none"
                  placeholder="zendesk_search, slack_notify, database_read"
                />
              </div>

              {/* Cost Limits */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Daily Token Limit (optional)
                </label>
                <input
                  type="number"
                  name="dailyTokens"
                  min="0"
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="e.g., 100000"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Monthly Cost Limit (optional)
                </label>
                <input
                  type="number"
                  name="monthlyCost"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="e.g., 500.00"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-arm-textMuted hover:text-arm-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors"
                >
                  Create Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policies Table */}
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border overflow-hidden">
        {policies === undefined ? (
          <div className="p-8 text-center text-arm-textMuted">
            Loading policies...
          </div>
        ) : policies.length === 0 ? (
          <div className="p-8 text-center text-arm-textMuted">
            <p className="mb-2">No policies yet</p>
            <p className="text-sm">Create your first policy to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-arm-surface border-b border-arm-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Name
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Autonomy Tier
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Allowed Tools
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Cost Limits
                </th>
                <th className="text-right p-4 text-sm font-semibold text-arm-textMuted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr
                  key={policy._id}
                  className="border-b border-arm-border hover:bg-arm-surface transition-colors"
                >
                  <td className="p-4 text-arm-text font-medium">
                    {policy.name}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-accent text-white">
                      Tier {policy.autonomyTier}
                    </span>
                  </td>
                  <td className="p-4 text-arm-textMuted text-sm">
                    {policy.allowedTools.length} tool(s)
                  </td>
                  <td className="p-4 text-arm-textMuted text-sm">
                    {policy.costLimits ? (
                      <div className="space-y-1">
                        {policy.costLimits.dailyTokens && (
                          <div>Daily: {policy.costLimits.dailyTokens.toLocaleString()} tokens</div>
                        )}
                        {policy.costLimits.monthlyCost && (
                          <div>Monthly: ${policy.costLimits.monthlyCost.toFixed(2)}</div>
                        )}
                      </div>
                    ) : (
                      'No limits'
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(policy._id)}
                      className="text-arm-danger hover:text-red-400 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
