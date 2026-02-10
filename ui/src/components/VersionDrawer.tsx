import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface VersionDrawerProps {
  versionId: Id<'agentVersions'> | null
  onClose: () => void
}

export function VersionDrawer({ versionId, onClose }: VersionDrawerProps) {
  const version = useQuery(
    api.agentVersions.get,
    versionId ? { versionId } : 'skip'
  )
  
  const lineage = useQuery(
    api.agentVersions.getLineage,
    versionId ? { versionId } : 'skip'
  )
  
  const changeRecords = useQuery(
    api.changeRecords.listByTarget,
    versionId
      ? { targetEntity: 'agentVersion', targetId: versionId }
      : 'skip'
  )

  if (!versionId) return null

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-arm-surfaceLight border-l border-arm-border shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-arm-surface border-b border-arm-border p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-arm-text">
            {version?.versionLabel || 'Loading...'}
          </h2>
          <p className="text-sm text-arm-textMuted">Version Details</p>
        </div>
        <button
          onClick={onClose}
          className="text-arm-textMuted hover:text-arm-text"
        >
          ✕
        </button>
      </div>

      {version && (
        <div className="p-6 space-y-6">
          {/* Status */}
          <section>
            <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
              Status
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-accent text-white">
                {version.lifecycleState}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-blue text-white">
                Eval: {version.evalStatus}
              </span>
              {version.integrityStatus && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    version.integrityStatus === 'VERIFIED'
                      ? 'bg-arm-success text-white'
                      : 'bg-arm-danger text-white'
                  }`}
                >
                  {version.integrityStatus}
                </span>
              )}
            </div>
          </section>

          {/* Genome Hash */}
          <section>
            <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
              Genome Hash
            </h3>
            <code className="block bg-arm-surface px-4 py-2 rounded text-xs text-arm-text font-mono">
              {version.genomeHash}
            </code>
          </section>

          {/* Model Config */}
          <section>
            <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
              Model Configuration
            </h3>
            <div className="bg-arm-surface rounded p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-arm-textMuted">Provider:</span>
                <span className="text-arm-text font-mono">
                  {version.genome.modelConfig.provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-arm-textMuted">Model:</span>
                <span className="text-arm-text font-mono">
                  {version.genome.modelConfig.model}
                </span>
              </div>
              {version.genome.modelConfig.temperature && (
                <div className="flex justify-between">
                  <span className="text-arm-textMuted">Temperature:</span>
                  <span className="text-arm-text">
                    {version.genome.modelConfig.temperature}
                  </span>
                </div>
              )}
              {version.genome.modelConfig.maxTokens && (
                <div className="flex justify-between">
                  <span className="text-arm-textMuted">Max Tokens:</span>
                  <span className="text-arm-text">
                    {version.genome.modelConfig.maxTokens}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Tool Manifest */}
          <section>
            <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
              Tool Manifest ({version.genome.toolManifest.length} tools)
            </h3>
            <div className="space-y-2">
              {version.genome.toolManifest.map((tool: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-arm-surface rounded p-3 text-sm"
                >
                  <div className="font-mono text-arm-accent">
                    {tool.toolId}
                  </div>
                  <div className="text-xs text-arm-textMuted mt-1">
                    v{tool.schemaVersion} •{' '}
                    {tool.requiredPermissions.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lineage */}
          {lineage && lineage.length > 1 && (
            <section>
              <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
                Version Lineage
              </h3>
              <div className="space-y-2">
                {lineage.map((v: any, idx: number) => (
                  <div
                    key={v._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-arm-textMuted">
                      {idx === 0 ? '→' : '↑'}
                    </span>
                    <span
                      className={
                        v._id === versionId
                          ? 'text-arm-accent font-semibold'
                          : 'text-arm-text'
                      }
                    >
                      {v.versionLabel}
                    </span>
                    <span className="text-xs text-arm-textMuted">
                      ({v.lifecycleState})
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Change Records */}
          {changeRecords && changeRecords.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
                Change History
              </h3>
              <div className="space-y-2">
                {changeRecords.slice(0, 10).map((record: any) => (
                  <div
                    key={record._id}
                    className="bg-arm-surface rounded p-3 text-xs"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-arm-accent">
                        {record.type}
                      </span>
                      <span className="text-arm-textMuted">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-arm-textMuted overflow-x-auto">
                      {JSON.stringify(record.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
