import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { DirectoryView } from './views/DirectoryView'
import { PoliciesView } from './views/PoliciesView'
import { ApprovalsView } from './views/ApprovalsView'
import { PlaceholderView } from './views/PlaceholderView'
import { ToastContainer } from './components/ToastContainer'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-arm-surface">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/directory" replace />} />
            <Route path="/directory" element={<DirectoryView />} />
            <Route path="/policies" element={<PoliciesView />} />
            <Route path="/approvals" element={<ApprovalsView />} />
            <Route path="/evaluations" element={<PlaceholderView title="Evaluations" />} />
            <Route path="/incidents" element={<PlaceholderView title="Incidents" />} />
            <Route path="/cost" element={<PlaceholderView title="Cost Management" />} />
            <Route path="/audit" element={<PlaceholderView title="Audit Center" />} />
            <Route path="/federation" element={<PlaceholderView title="Federation" />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  )
}
