import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/directory', label: 'Directory', icon: '📁' },
  { path: '/policies', label: 'Policies', icon: '🛡️' },
  { path: '/approvals', label: 'Approvals', icon: '✅' },
  { path: '/evaluations', label: 'Evaluations', icon: '✓' },
  { path: '/incidents', label: 'Incidents', icon: '⚠️' },
  { path: '/cost', label: 'Cost', icon: '💰' },
  { path: '/audit', label: 'Audit', icon: '📋' },
  { path: '/federation', label: 'Federation', icon: '🌐' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-arm-surfaceLight border-r border-arm-border flex flex-col">
      <div className="p-6 border-b border-arm-border">
        <h1 className="text-xl font-bold text-arm-accent">ARM</h1>
        <p className="text-sm text-arm-textMuted">Agent Resource Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-arm-accent text-white'
                  : 'text-arm-textMuted hover:bg-arm-surface hover:text-arm-text'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-arm-border text-xs text-arm-textMuted">
        <p>v0.1.0 • P1.1 Walking Skeleton</p>
      </div>
    </aside>
  )
}
