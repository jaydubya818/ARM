import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/directory', label: 'Directory', icon: '📁', section: 'Core' },
  { path: '/policies', label: 'Policies', icon: '🛡️', section: 'Core' },
  { path: '/approvals', label: 'Approvals', icon: '✅', section: 'Core' },
  { path: '/evaluations', label: 'Evaluations', icon: '✓', section: 'Core' },
  { path: '/analytics', label: 'Analytics', icon: '📊', section: 'Advanced' },
  { path: '/custom-functions', label: 'Custom Functions', icon: '⚡', section: 'Advanced' },
  { path: '/roles', label: 'Roles & Permissions', icon: '🔐', section: 'Admin' },
  { path: '/audit', label: 'Audit Logs', icon: '📋', section: 'Admin' },
  { path: '/incidents', label: 'Incidents', icon: '⚠️', section: 'Monitoring' },
  { path: '/cost', label: 'Cost', icon: '💰', section: 'Monitoring' },
  { path: '/federation', label: 'Federation', icon: '🌐', section: 'Advanced' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-arm-surfaceLight border-r border-arm-border flex flex-col">
      <div className="p-6 border-b border-arm-border">
        <h1 className="text-xl font-bold text-arm-accent">ARM</h1>
        <p className="text-sm text-arm-textMuted">Agent Resource Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Group by section */}
        {['Core', 'Advanced', 'Admin', 'Monitoring'].map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section)
          if (sectionItems.length === 0) return null
          
          return (
            <div key={section} className="mb-4">
              <h3 className="px-4 py-2 text-xs font-semibold text-arm-textMuted uppercase tracking-wider">
                {section}
              </h3>
              {sectionItems.map((item) => (
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
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-arm-border text-xs text-arm-textMuted">
        <p>v0.3.0 • Phase 3.0 Complete</p>
      </div>
    </aside>
  )
}
