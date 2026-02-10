import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { toast } from '../lib/toast'

interface CreateTemplateModalProps {
  tenantId: Id<'tenants'>
  onClose: () => void
}

export function CreateTemplateModal({ tenantId, onClose }: CreateTemplateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createTemplate = useMutation(api.agentTemplates.create)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const ownersStr = formData.get('owners') as string
    const tagsStr = formData.get('tags') as string

    // Parse owners (comma-separated emails)
    const owners = ownersStr
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = owners.filter((email) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`)
      setIsSubmitting(false)
      return
    }

    // Parse tags (comma-separated)
    const tags = tagsStr
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    try {
      await createTemplate({
        tenantId,
        name,
        description: description || undefined,
        owners,
        tags,
      })
      toast.success('Template created successfully')
      onClose()
    } catch (error) {
      toast.error('Error creating template: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border w-[600px] max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-arm-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-arm-text">
            Create Agent Template
          </h2>
          <button
            onClick={onClose}
            className="text-arm-textMuted hover:text-arm-text transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Template Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
              placeholder="e.g., Customer Support Agent"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none resize-none"
              placeholder="Brief description of the agent template..."
            />
          </div>

          {/* Owners */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Owners (comma-separated emails) *
            </label>
            <input
              type="text"
              name="owners"
              required
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
              placeholder="ops@company.com, eng@company.com"
            />
            <p className="text-xs text-arm-textMuted">
              Email addresses of team members who own this template
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
              placeholder="support, customer-facing, production"
            />
            <p className="text-xs text-arm-textMuted">
              Tags for categorization and filtering
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-arm-textMuted hover:text-arm-text transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
