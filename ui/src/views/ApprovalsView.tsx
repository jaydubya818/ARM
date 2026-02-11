import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useTenant } from '../contexts/TenantContext'
import { api } from '../convex/_generated/api'
import { Id, type Doc } from '../convex/_generated/dataModel'
import { toast } from '../lib/toast'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED'

export function ApprovalsView() {
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | 'ALL'>('PENDING')
  const [selectedApproval, setSelectedApproval] = useState<Doc<'approvalRecords'> | null>(null)

  const { tenantId } = useTenant()

  const operators = useQuery(
    api.operators.list,
    tenantId ? { tenantId } : 'skip'
  )
  const operatorId = operators?.[0]?._id

  // Fetch approvals
  const approvals = useQuery(
    api.approvalRecords.list,
    tenantId
      ? {
          tenantId,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        }
      : 'skip'
  ) as Doc<'approvalRecords'>[] | undefined

  const pendingCount = useQuery(
    api.approvalRecords.getPendingCount,
    tenantId ? { tenantId } : 'skip'
  )

  const decideApproval = useMutation(api.approvalRecords.decide)
  const cancelApproval = useMutation(api.approvalRecords.cancel)

  const handleDecide = async (
    approvalId: Id<'approvalRecords'>,
    decision: 'APPROVED' | 'DENIED'
  ) => {
    if (!operatorId) {
      toast.error('No operator found')
      return
    }

    const reason = prompt(
      `${decision === 'APPROVED' ? 'Approve' : 'Deny'} this request? Enter reason (optional):`
    )
    if (reason === null) return // User cancelled

    try {
      await decideApproval({
        approvalId,
        decision,
        decidedBy: operatorId,
        reason: reason || undefined,
      })
      toast.success(`Request ${decision.toLowerCase()} successfully`)
      setSelectedApproval(null)
    } catch (error) {
      toast.error('Error: ' + (error as Error).message)
    }
  }

  const handleCancel = async (approvalId: Id<'approvalRecords'>) => {
    if (!operatorId) {
      toast.error('No operator found')
      return
    }

    const reason = prompt('Cancel this request? Enter reason (optional):')
    if (reason === null) return

    try {
      await cancelApproval({
        approvalId,
        cancelledBy: operatorId,
        reason: reason || undefined,
      })
      toast.success('Request cancelled successfully')
      setSelectedApproval(null)
    } catch (error) {
      toast.error('Error: ' + (error as Error).message)
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
            Approval Center
          </h1>
          <p className="text-arm-textMuted">
            Review and decide on pending approval requests
          </p>
        </div>
        {pendingCount !== undefined && pendingCount > 0 && (
          <div className="px-4 py-2 bg-arm-warning rounded-lg">
            <span className="text-sm font-semibold text-white">
              {pendingCount} Pending
            </span>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'DENIED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded transition-colors ${
              selectedStatus === status
                ? 'bg-arm-accent text-white'
                : 'bg-arm-surfaceLight text-arm-textMuted hover:text-arm-text'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border overflow-hidden">
        {approvals === undefined ? (
          <div className="p-8 text-center text-arm-textMuted">
            Loading approvals...
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-8 text-center text-arm-textMuted">
            <p className="mb-2">
              No {selectedStatus === 'ALL' ? '' : selectedStatus.toLowerCase()}{' '}
              approvals
            </p>
            <p className="text-sm">
              {selectedStatus === 'PENDING'
                ? 'All caught up!'
                : 'No approvals found'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-arm-surface border-b border-arm-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Request Type
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Target ID
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Requested By
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
                  Decided By
                </th>
                <th className="text-right p-4 text-sm font-semibold text-arm-textMuted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr
                  key={approval._id}
                  className="border-b border-arm-border hover:bg-arm-surface transition-colors"
                >
                  <td className="p-4 text-arm-text font-medium">
                    {approval.requestType}
                  </td>
                  <td className="p-4 text-arm-textMuted text-sm font-mono">
                    {approval.targetId.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-arm-textMuted text-sm">
                    {approval.requesterName}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.status === 'PENDING'
                          ? 'bg-arm-warning text-white'
                          : approval.status === 'APPROVED'
                          ? 'bg-arm-success text-white'
                          : approval.status === 'DENIED'
                          ? 'bg-arm-danger text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {approval.status}
                    </span>
                  </td>
                  <td className="p-4 text-arm-textMuted text-sm">
                    {approval.deciderName || '—'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {approval.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() =>
                            handleDecide(approval._id, 'APPROVED')
                          }
                          className="text-arm-success hover:text-green-400 transition-colors text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecide(approval._id, 'DENIED')}
                          className="text-arm-danger hover:text-red-400 transition-colors text-sm font-medium"
                        >
                          Deny
                        </button>
                        <button
                          onClick={() => handleCancel(approval._id)}
                          className="text-arm-textMuted hover:text-arm-text transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Panel (future enhancement) */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-arm-surfaceLight rounded-lg border border-arm-border w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="border-b border-arm-border p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-arm-text">
                Approval Details
              </h2>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-arm-textMuted hover:text-arm-text"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-arm-textMuted">
                Detailed approval context will be shown here in future updates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
