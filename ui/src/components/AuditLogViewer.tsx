/**
 * Audit Log Viewer Component
 *
 * Search, filter, and view audit logs with export functionality.
 */

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'agent-resources-platform/convex/_generated/api';
import { Id, type Doc } from 'agent-resources-platform/convex/_generated/dataModel';

interface AuditLogViewerProps {
  tenantId: Id<'tenants'>;
}

export function AuditLogViewer({ tenantId }: AuditLogViewerProps) {
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'ERROR' | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(100);

  // Queries
  const logs = useQuery(api.auditLogs.list, {
    tenantId,
    limit,
    severity,
  }) as Doc<'auditLogs'>[] | undefined;

  const stats = useQuery(api.auditLogs.getStatistics, {
    tenantId,
  });

  const operators = useQuery(api.operators.list, { tenantId }) as Doc<'operators'>[] | undefined;

  // Filter logs by search term
  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term)
      || log.resource.toLowerCase().includes(term)
      || log.details.permission?.toLowerCase().includes(term)
      || log.details.reason?.toLowerCase().includes(term)
    );
  });

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'ERROR':
        return 'bg-red-100 text-red-700';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getActionIcon = (action: string) => {
    if (action === 'ACCESS_GRANTED') {
      return (
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    if (action === 'ACCESS_DENIED') {
      return (
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const exportLogs = () => {
    if (!filteredLogs) return;

    const csv = [
      ['Timestamp', 'Action', 'Resource', 'Operator', 'Severity', 'Details'].join(','),
      ...filteredLogs.map((log) => [
        formatTimestamp(log.timestamp),
        log.action,
        log.resource,
        log.operatorId || 'System',
        log.severity,
        JSON.stringify(log.details).replace(/,/g, ';'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600 mt-1">
            Security and compliance monitoring
          </p>
        </div>

        <button
          onClick={exportLogs}
          disabled={!filteredLogs || filteredLogs.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalEvents}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Access Granted</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.accessGranted}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Access Denied</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {stats.accessDenied}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">Errors</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.bySeverity.ERROR}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, resource, permission, or reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={severity || ''}
              onChange={(e) => setSeverity(
                  e.target.value as 'INFO' | 'WARNING' | 'ERROR' | undefined,
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            {[50, 100, 200, 500].map((num) => (
              <button
                key={num}
                onClick={() => setLimit(num)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  limit === num
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            Showing
            {' '}
            {filteredLogs?.length || 0}
            {' '}
            of
            {' '}
            {logs?.length || 0}
            {' '}
            logs
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs?.map((log) => {
                const operator = operators?.find((o) => o._id === log.operatorId);

                return (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {operator?.name || log.operatorId || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(
                          log.severity,
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.details.permission && (
                        <div>
                          <span className="font-medium">Permission:</span>
                          {' '}
                          {log.details.permission}
                        </div>
                      )}
                      {log.details.reason && (
                        <div>
                          <span className="font-medium">Reason:</span>
                          {' '}
                          {log.details.reason}
                        </div>
                      )}
                      {log.details.ipAddress && (
                        <div className="text-xs text-gray-500">
                          IP:
                          {' '}
                          {log.details.ipAddress}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-medium">No audit logs found</p>
              <p className="text-sm mt-1">
                {searchTerm || severity
                  ? 'Try adjusting your filters'
                  : 'Logs will appear here as actions are performed'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
