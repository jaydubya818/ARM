import { useQuery } from 'convex/react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import { Id } from 'agent-resources-platform/convex/_generated/dataModel';

interface IncidentsViewProps {
  tenantId: Id<'tenants'>;
}

export function IncidentsView({ tenantId }: IncidentsViewProps) {
  const errors = useQuery(api.auditLogs.list, {
    tenantId,
    severity: 'ERROR',
    limit: 50,
  });
  const warnings = useQuery(api.auditLogs.list, {
    tenantId,
    severity: 'WARNING',
    limit: 50,
  });

  const incidents = [
    ...(errors ?? []).map((e: { _id: unknown; timestamp?: number; action: string; resource: string; details?: unknown }) => ({ ...e, type: 'error' as const })),
    ...(warnings ?? []).map((w: { _id: unknown; timestamp?: number; action: string; resource: string; details?: unknown }) => ({ ...w, type: 'warning' as const })),
  ].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-arm-text">Incidents</h2>
        <p className="text-sm text-arm-textMuted">
          Errors and warnings from audit logs
        </p>
      </div>

      {incidents.length === 0 ? (
        <div className="bg-arm-surface border border-arm-border rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-arm-textMuted mb-3" />
          <p className="text-arm-textMuted">No incidents recorded</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident._id as string}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                incident.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              {incident.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-arm-text">{incident.action}</p>
                <p className="text-sm text-arm-textMuted mt-1">
                  {incident.resource}
                  {(incident.details as any)
                    && typeof (incident.details as any) === 'object'
                    && Object.keys(incident.details as any).length > 0 && (
                      <span className="ml-2">
                        —
                        {' '}
                        {JSON.stringify(incident.details)}
                      </span>
                  )}
                </p>
                <p className="text-xs text-arm-textMuted mt-2">
                  {incident.timestamp
                    ? new Date(incident.timestamp).toLocaleString()
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
