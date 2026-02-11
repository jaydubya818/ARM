import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id, type Doc } from '../convex/_generated/dataModel'
import { VersionDrawer } from '../components/VersionDrawer'
import { CreateTemplateModal } from '../components/CreateTemplateModal'
import { CreateVersionModal } from '../components/CreateVersionModal'
import { StatusChip } from '../components/StatusChip'

type Tab = 'templates' | 'versions' | 'instances'

export function DirectoryView() {
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [selectedVersionId, setSelectedVersionId] = useState<Id<'agentVersions'> | null>(null)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  
  // Get first tenant (for demo)
  const tenants = useQuery(api.tenants.list)
  const tenantId = tenants?.[0]?._id
  
  const templates = useQuery(
    api.agentTemplates.list,
    tenantId ? { tenantId } : 'skip'
  ) as Doc<'agentTemplates'>[] | undefined
  
  const versions = useQuery(
    api.agentVersions.list,
    tenantId ? { tenantId } : 'skip'
  ) as Doc<'agentVersions'>[] | undefined
  
  const instances = useQuery(
    api.agentInstances.list,
    tenantId ? { tenantId } : 'skip'
  ) as Doc<'agentInstances'>[] | undefined

  // Filter and search logic
  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    return templates.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [templates, searchQuery])

  const filteredVersions = useMemo(() => {
    if (!versions) return []
    let filtered = versions
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((v) => v.lifecycleState === statusFilter)
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((v) =>
        v.versionLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.genomeHash.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }, [versions, searchQuery, statusFilter])

  const filteredInstances = useMemo(() => {
    if (!instances) return []
    let filtered = instances
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((i) => i.state === statusFilter)
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((i) =>
        i._id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }, [instances, searchQuery, statusFilter])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-arm-text mb-2">Agent Directory</h1>
          <p className="text-arm-textMuted">
            Manage agent templates, versions, and runtime instances
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'templates' && (
            <button
              onClick={() => setIsCreatingTemplate(true)}
              className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors"
            >
              Create Template
            </button>
          )}
          {activeTab === 'versions' && (
            <button
              onClick={() => setIsCreatingVersion(true)}
              className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors"
            >
              Create Version
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex gap-4">
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="flex-1 px-4 py-2 bg-arm-surfaceLight border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
        />

        {/* Status Filter (for versions and instances) */}
        {(activeTab === 'versions' || activeTab === 'instances') && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-arm-surfaceLight border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
          >
            <option value="ALL">All Status</option>
            {activeTab === 'versions' && (
              <>
                <option value="DRAFT">DRAFT</option>
                <option value="TESTING">TESTING</option>
                <option value="CANDIDATE">CANDIDATE</option>
                <option value="APPROVED">APPROVED</option>
                <option value="DEPRECATED">DEPRECATED</option>
                <option value="RETIRED">RETIRED</option>
              </>
            )}
            {activeTab === 'instances' && (
              <>
                <option value="PROVISIONING">PROVISIONING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="READONLY">READONLY</option>
                <option value="DRAINING">DRAINING</option>
                <option value="QUARANTINED">QUARANTINED</option>
                <option value="RETIRED">RETIRED</option>
              </>
            )}
          </select>
        )}
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
            {filteredTemplates.length > 0 ? (
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
                  {filteredTemplates.map((template) => (
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
            {filteredVersions.length > 0 ? (
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
                  {filteredVersions.map((version) => (
                    <tr key={version._id} className="border-b border-arm-border hover:bg-arm-surface">
                      <td className="p-4 text-arm-text font-medium">{version.versionLabel}</td>
                      <td className="p-4">
                        <StatusChip status={version.lifecycleState} type="version" />
                      </td>
                      <td className="p-4">
                        <StatusChip status={version.evalStatus} type="eval" />
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
            {filteredInstances.length > 0 ? (
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
                  {filteredInstances.map((instance) => (
                    <tr key={instance._id} className="border-b border-arm-border hover:bg-arm-surface">
                      <td className="p-4 text-arm-text font-mono text-xs">
                        {instance._id.substring(0, 12)}...
                      </td>
                      <td className="p-4">
                        <StatusChip status={instance.state} type="instance" />
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

      {/* Create Template Modal */}
      {isCreatingTemplate && tenantId && (
        <CreateTemplateModal
          tenantId={tenantId}
          onClose={() => setIsCreatingTemplate(false)}
        />
      )}

      {/* Create Version Modal */}
      {isCreatingVersion && tenantId && (
        <CreateVersionModal
          tenantId={tenantId}
          onClose={() => setIsCreatingVersion(false)}
        />
      )}
    </div>
  )
}
