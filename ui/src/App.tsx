import {
  BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';
import {
  Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation,
} from 'convex/react';
import { UserButton } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import { Sidebar } from './components/Sidebar';
import { DirectoryView } from './views/DirectoryView';
import { PoliciesView } from './views/PoliciesView';
import { ApprovalsView } from './views/ApprovalsView';
import { EvaluationsView } from './views/EvaluationsView';
import { AnalyticsView } from './views/AnalyticsView';
import { RolesView } from './views/RolesView';
import { AuditView } from './views/AuditView';
import { CustomFunctionsView } from './views/CustomFunctionsView';
import { FeatureFlagsView } from './views/FeatureFlagsView';
import { ExperimentsView } from './views/ExperimentsView';
import { MonitoringView } from './views/MonitoringView';
import { IncidentsView } from './views/IncidentsView';
import { CostView } from './views/CostView';
import { FederationView } from './views/FederationView';
import { ToastContainer } from './components/ToastContainer';
import { NotificationCenter } from './components/NotificationCenter';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { TenantSwitcher } from './components/TenantSwitcher';
import { LoginPage } from './pages/LoginPage';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppContentInner() {
  const ensureOperator = useMutation(api.auth.ensureOperator);
  const currentOperator = useQuery(
    api.auth.getCurrentOperator,
    clerkKey ? {} : 'skip',
  );
  const { tenantId } = useTenant();
  const operators = useQuery(
    api.operators.list,
    tenantId ? { tenantId } : 'skip',
  );
  const operatorId = clerkKey
    ? currentOperator?._id
    : operators?.[0]?._id;

  useEffect(() => {
    if (
      !clerkKey
      || currentOperator === undefined
      || currentOperator !== null
      || !tenantId
    ) return;
    ensureOperator().catch(() => {});
  }, [clerkKey, currentOperator, tenantId, ensureOperator]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-arm-surface">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {operatorId && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
              <TenantSwitcher />
              <div className="flex items-center gap-4">
                <NotificationCenter operatorId={operatorId} />
                {clerkKey && <UserButton afterSignOutUrl="/" />}
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/directory" replace />} />
            <Route path="/directory" element={<DirectoryView />} />
            <Route path="/policies" element={<PoliciesView />} />
            <Route path="/approvals" element={<ApprovalsView />} />
            <Route path="/evaluations" element={<EvaluationsView />} />

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
              path="/feature-flags"
              element={
                tenantId && operatorId ? (
                  <FeatureFlagsView tenantId={tenantId} currentOperatorId={operatorId} />
                ) : (
                  <div>Loading...</div>
                )
              }
            />
            <Route
              path="/experiments"
              element={
                tenantId && operatorId ? (
                  <ExperimentsView tenantId={tenantId} currentOperatorId={operatorId} />
                ) : (
                  <div>Loading...</div>
                )
              }
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

            <Route path="/monitoring" element={<MonitoringView />} />
            <Route
              path="/incidents"
              element={tenantId ? <IncidentsView tenantId={tenantId} /> : <div>Loading...</div>}
            />
            <Route
              path="/cost"
              element={tenantId ? <CostView tenantId={tenantId} /> : <div>Loading...</div>}
            />
            <Route
              path="/federation"
              element={tenantId ? <FederationView tenantId={tenantId} /> : <div>Loading...</div>}
            />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

function AppContent() {
  return (
    <TenantProvider>
      <AppContentInner />
    </TenantProvider>
  );
}

export default function App() {
  if (!clerkKey) {
    return <AppContent />;
  }

  return (
    <>
      <Authenticated>
        <AppContent />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-arm-surface">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-arm-accent" />
        </div>
      </AuthLoading>
    </>
  );
}
