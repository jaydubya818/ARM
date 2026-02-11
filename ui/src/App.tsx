import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DirectoryView } from './views/DirectoryView'
import { PoliciesView } from './views/PoliciesView'
import { ApprovalsView } from './views/ApprovalsView'
import { EvaluationsView } from './views/EvaluationsView'
import { AnalyticsView } from './views/AnalyticsView'
import { RolesView } from './views/RolesView'
import { AuditView } from './views/AuditView'
import { CustomFunctionsView } from './views/CustomFunctionsView'
import { MonitoringView } from './views/MonitoringView'
import { PlaceholderView } from './views/PlaceholderView'
import { ToastContainer } from './components/ToastContainer'
import { NotificationCenter } from './components/NotificationCenter'
import { useQuery } from 'convex/react'
import { api } from './convex/_generated/api'

export default function App() {
  // Get tenant and operator (hardcoded for now, will be from auth later)
  const tenants = useQuery(api.tenants.list)
  const operators = useQuery(
    api.operators.list, 
    tenants?.[0]?._id ? { tenantId: tenants[0]._id } : "skip"
  )
  
  const tenantId = tenants?.[0]?._id
  const operatorId = operators?.[0]?._id

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-arm-surface">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Header with Notification Center */}
          {operatorId && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex justify-end">
              <NotificationCenter operatorId={operatorId} />
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/directory" replace />} />
            <Route path="/directory" element={<DirectoryView />} />
            <Route path="/policies" element={<PoliciesView />} />
            <Route path="/approvals" element={<ApprovalsView />} />
            <Route path="/evaluations" element={<EvaluationsView />} />
            
            {/* P3.0 Routes */}
            <Route 
              path="/analytics" 
              element={tenantId ? <AnalyticsView tenantId={tenantId} /> : <div>Loading...</div>} 
            />
            <Route 
              path="/roles" 
              element={
                tenantId && operatorId ? (
                  <RolesView tenantId={tenantId} currentOperatorId={operatorId} />
                ) : (
                  <div>Loading...</div>
                )
              } 
            />
            <Route 
              path="/audit" 
              element={tenantId ? <AuditView tenantId={tenantId} /> : <div>Loading...</div>} 
            />
            <Route 
              path="/custom-functions" 
              element={
                tenantId && operatorId ? (
                  <CustomFunctionsView tenantId={tenantId} currentOperatorId={operatorId} />
                ) : (
                  <div>Loading...</div>
                )
              } 
            />
            
            {/* P4.0 Routes */}
            <Route path="/monitoring" element={<MonitoringView />} />
            
            <Route path="/incidents" element={<PlaceholderView title="Incidents" />} />
            <Route path="/cost" element={<PlaceholderView title="Cost Management" />} />
            <Route path="/federation" element={<PlaceholderView title="Federation" />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
