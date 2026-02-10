import { useState } from 'react'

type Tab = 'templates' | 'versions' | 'instances'

export function DirectoryView() {
  const [activeTab, setActiveTab] = useState<Tab>('templates')

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
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border p-8">
        <div className="text-center text-arm-textMuted">
          <p className="mb-2">No {activeTab} yet</p>
          <p className="text-sm">Run the seed script to populate test data</p>
          <code className="block mt-4 text-xs bg-arm-surface px-4 py-2 rounded">
            npx convex run seedARM
          </code>
        </div>
      </div>
    </div>
  )
}
