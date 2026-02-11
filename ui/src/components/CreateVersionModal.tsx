import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { toast } from '../lib/toast'

interface CreateVersionModalProps {
  tenantId: Id<'tenants'>
  onClose: () => void
}

interface ToolEntry {
  id: string
  toolId: string
  schemaVersion: string
  requiredPermissions: string
}

export function CreateVersionModal({ tenantId, onClose }: CreateVersionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tools, setTools] = useState<ToolEntry[]>([
    { id: '1', toolId: '', schemaVersion: '1.0', requiredPermissions: '' },
  ])

  const templates = useQuery(api.agentTemplates.list, { tenantId })
  const versions = useQuery(api.agentVersions.list, { tenantId })
  const createVersion = useMutation(api.agentVersions.create)

  const addTool = () => {
    setTools([
      ...tools,
      {
        id: Date.now().toString(),
        toolId: '',
        schemaVersion: '1.0',
        requiredPermissions: '',
      },
    ])
  }

  const removeTool = (id: string) => {
    if (tools.length === 1) {
      toast.warning('At least one tool is required')
      return
    }
    setTools(tools.filter((t) => t.id !== id))
  }

  const updateTool = (id: string, field: keyof ToolEntry, value: string) => {
    setTools(
      tools.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const templateId = formData.get('templateId') as string
    const versionLabel = formData.get('versionLabel') as string
    const parentVersionId = formData.get('parentVersionId') as string
    const provider = formData.get('provider') as string
    const model = formData.get('model') as string
    const temperature = formData.get('temperature') as string
    const maxTokens = formData.get('maxTokens') as string
    const promptBundleHash = formData.get('promptBundleHash') as string

    // Validate version label format (semver)
    if (!/^v\d+\.\d+\.\d+$/.test(versionLabel)) {
      toast.error('Version label must be in semver format (e.g., v1.0.0)')
      setIsSubmitting(false)
      return
    }

    // Validate prompt hash format (SHA-256)
    if (!/^[a-f0-9]{64}$/i.test(promptBundleHash)) {
      toast.error('Prompt bundle hash must be a valid SHA-256 hash (64 hex characters)')
      setIsSubmitting(false)
      return
    }

    // Validate tools
    const invalidTools = tools.filter((t) => !t.toolId.trim())
    if (invalidTools.length > 0) {
      toast.error('All tools must have a Tool ID')
      setIsSubmitting(false)
      return
    }

    // Build genome
    const genome = {
      modelConfig: {
        provider,
        model,
        temperature: temperature ? parseFloat(temperature) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
      },
      promptBundleHash,
      toolManifest: tools.map((t) => ({
        toolId: t.toolId,
        schemaVersion: t.schemaVersion,
        requiredPermissions: t.requiredPermissions
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      })),
      provenance: {
        builtAt: new Date().toISOString(),
        builtBy: 'ops@arm-dev.com', // TODO: Get from auth
      },
    }

    try {
      await createVersion({
        templateId: templateId as Id<'agentTemplates'>,
        tenantId,
        versionLabel,
        genome,
        parentVersionId: parentVersionId
          ? (parentVersionId as Id<'agentVersions'>)
          : undefined,
      })
      toast.success('Version created successfully')
      onClose()
    } catch (error) {
      toast.error('Error creating version: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border w-[700px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-arm-surface border-b border-arm-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-arm-text">
            Create Agent Version
          </h2>
          <button
            onClick={onClose}
            className="text-arm-textMuted hover:text-arm-text transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Template *
            </label>
            <select
              name="templateId"
              required
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
            >
              <option value="">Select template...</option>
              {templates?.map((template) => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Version Label */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Version Label *
            </label>
            <input
              type="text"
              name="versionLabel"
              required
              pattern="^v\d+\.\d+\.\d+$"
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
              placeholder="v1.0.0"
            />
            <p className="text-xs text-arm-textMuted">
              Must be in semver format (e.g., v1.0.0, v2.1.3)
            </p>
          </div>

          {/* Parent Version (Lineage) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-arm-textMuted">
              Parent Version (optional)
            </label>
            <select
              name="parentVersionId"
              className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
            >
              <option value="">None (new lineage)</option>
              {versions?.map((version) => (
                <option key={version._id} value={version._id}>
                  {version.versionLabel}
                </option>
              ))}
            </select>
            <p className="text-xs text-arm-textMuted">
              Link to a parent version to track lineage
            </p>
          </div>

          {/* Model Config */}
          <div className="border border-arm-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-arm-text">
              Model Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Provider *
                </label>
                <select
                  name="provider"
                  required
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="mistral">Mistral</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="claude-3-5-sonnet-20241022"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Temperature
                </label>
                <input
                  type="number"
                  name="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="0.5"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-arm-textMuted">
                  Max Tokens
                </label>
                <input
                  type="number"
                  name="maxTokens"
                  min="1"
                  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
                  placeholder="8192"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-arm-textMuted">
                Prompt Bundle Hash *
              </label>
              <input
                type="text"
                name="promptBundleHash"
                required
                pattern="^[a-fA-F0-9]{64}$"
                className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none font-mono text-xs"
                placeholder="sha256:abc123def456..."
              />
              <p className="text-xs text-arm-textMuted">
                SHA-256 hash of the prompt bundle (64 hex characters)
              </p>
            </div>
          </div>

          {/* Tool Manifest */}
          <div className="border border-arm-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-arm-text">
                Tool Manifest
              </h3>
              <button
                type="button"
                onClick={addTool}
                className="text-sm text-arm-accent hover:text-arm-blue transition-colors"
              >
                + Add Tool
              </button>
            </div>

            {tools.map((tool, index) => (
              <div
                key={tool.id}
                className="border border-arm-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-arm-textMuted">
                    Tool {index + 1}
                  </span>
                  {tools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTool(tool.id)}
                      className="text-xs text-arm-danger hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-arm-textMuted">
                    Tool ID *
                  </label>
                  <input
                    type="text"
                    value={tool.toolId}
                    onChange={(e) =>
                      updateTool(tool.id, 'toolId', e.target.value)
                    }
                    required
                    className="w-full px-3 py-2 bg-arm-surface border border-arm-border rounded text-arm-text text-sm focus:border-arm-accent focus:outline-none"
                    placeholder="zendesk_search"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-arm-textMuted">
                      Schema Version *
                    </label>
                    <input
                      type="text"
                      value={tool.schemaVersion}
                      onChange={(e) =>
                        updateTool(tool.id, 'schemaVersion', e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 bg-arm-surface border border-arm-border rounded text-arm-text text-sm focus:border-arm-accent focus:outline-none"
                      placeholder="1.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-arm-textMuted">
                      Permissions (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tool.requiredPermissions}
                      onChange={(e) =>
                        updateTool(
                          tool.id,
                          'requiredPermissions',
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 bg-arm-surface border border-arm-border rounded text-arm-text text-sm focus:border-arm-accent focus:outline-none"
                      placeholder="zendesk:read"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
