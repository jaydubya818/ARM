import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { VersionDrawer } from '../components/VersionDrawer'

type Tab = 'templates' | 'versions' | 'instances'

export function DirectoryView() {
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [selectedVersionId, setSelectedVersionId] = useState<Id<'agentVersions'> | null>(null)
  
  // Get first tenant (for demo)
  const tenants = useQuery(api.tenants.list)
  const tenantId = tenants?.[0]?._id
  
  const templates = useQuery(
    api.agentTemplates.list,
    tenantId ? { tenantId } : 'skip'
  )
  
  const versions = useQuery(
    api.agentVersions.list,
    tenantId ? { tenantId } : 'skip'
  )
  
  const instances = useQuery(
    api.agentInstances.list,
    tenantId ? { tenantId } : 'skip'
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-arm-text mb-2">Agent Directory</h1>
        <p className="text-arm-textMuted">
          Manage agent templates, versions, and runtime instances
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-arm-border">
        {(['templates', 'versions', 'instances'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-arm-accent border-b-2 border-arm-accent'
                : 'text-arm-textMuted hover:text-arm-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border overflow-hidden">
        {activeTab === 'templates' && (
          <div>
            {templates && templates.length > 0 ? (
              <table className="w-full">
                <thead className="bg-arm-surface border-b border-arm-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Description</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Owners</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template._id} className="border-b border-arm-border hover:bg-arm-surface">
                      <td className="p-4 text-arm-text font-medium">{template.name}</td>
                      <td className="p-4 text-arm-textMuted text-sm">{template.description || '—'}</td>
                      <td className="p-4 text-arm-textMuted text-sm">{template.owners.join(', ')}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {template.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-arm-surface rounded text-xs text-arm-textMuted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-arm-textMuted">
                <p className="mb-2">No templates yet</p>
                <p className="text-sm">Run the seed script to populate test data</p>
                <code className="block mt-4 text-xs bg-arm-surface px-4 py-2 rounded inline-block">
                  npx convex run seedARM
                </code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div>
            {versions && versions.length > 0 ? (
              <table className="w-full">
                <thead className="bg-arm-surface border-b border-arm-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Version</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Lifecycle</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Eval Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Hash</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version._id} className="border-b border-arm-border hover:bg-arm-surface">
                      <td className="p-4 text-arm-text font-medium">{version.versionLabel}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-arm-accent text-white rounded text-xs">
                          {version.lifecycleState}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-arm-blue text-white rounded text-xs">
                          {version.evalStatus}
                        </span>
                      </td>
                      <td className="p-4 text-arm-textMuted text-xs font-mono">
                        {version.genomeHash.substring(0, 16)}...
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedVersionId(version._id)}
                          className="text-arm-accent hover:text-arm-blue text-sm"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-arm-textMuted">
                <p className="mb-2">No versions yet</p>
                <p className="text-sm">Run the seed script to populate test data</p>
                <code className="block mt-4 text-xs bg-arm-surface px-4 py-2 rounded inline-block">
                  npx convex run seedARM
                </code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'instances' && (
          <div>
            {instances && instances.length > 0 ? (
              <table className="w-full">
                <thead className="bg-arm-surface border-b border-arm-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Instance ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">State</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Environment</th>
                    <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((instance) => (
                    <tr key={instance._id} className="border-b border-arm-border hover:bg-arm-surface">
                      <td className="p-4 text-arm-text font-mono text-xs">
                        {instance._id.substring(0, 12)}...
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs text-white ${
                          instance.state === 'ACTIVE' ? 'bg-arm-success' :
                          instance.state === 'QUARANTINED' ? 'bg-arm-danger' :
                          'bg-arm-warning'
                        }`}>
                          {instance.state}
                        </span>
                      </td>
                      <td className="p-4 text-arm-textMuted text-sm">{instance.environmentId}</td>
                      <td className="p-4 text-arm-textMuted text-sm">
                        {instance.heartbeatAt
                          ? new Date(instance.heartbeatAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-arm-textMuted">
                <p className="mb-2">No instances yet</p>
                <p className="text-sm">Run the seed script to populate test data</p>
                <code className="block mt-4 text-xs bg-arm-surface px-4 py-2 rounded inline-block">
                  npx convex run seedARM
                </code>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Version Drawer */}
      <VersionDrawer
        versionId={selectedVersionId}
        onClose={() => setSelectedVersionId(null)}
      />
    </div>
  )
}
