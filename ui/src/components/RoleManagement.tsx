/**
 * Role Management Component
 * 
 * Manage roles, permissions, and role assignments.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, type Doc } from "../convex/_generated/dataModel";

interface RoleManagementProps {
  tenantId: Id<"tenants">;
  currentOperatorId: Id<"operators">;
}

export function RoleManagement({ tenantId, currentOperatorId }: RoleManagementProps) {
  const [view, setView] = useState<"roles" | "assignments">("roles");
  const [selectedRole, setSelectedRole] = useState<Id<"roles"> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Queries
  const roles = useQuery(api.roles.list, { tenantId }) as Doc<"roles">[] | undefined;
  const permissions = useQuery(api.permissions.list) as Doc<"permissions">[] | undefined;
  const operators = useQuery(api.operators.list, { tenantId }) as Doc<"operators">[] | undefined;
  const assignments = useQuery(api.roleAssignments.list, { tenantId }) as
    | Doc<"roleAssignments">[]
    | undefined;

  // Mutations
  const deleteRole = useMutation(api.roles.remove);
  const revokeRole = useMutation(api.roleAssignments.revoke);

  // Group permissions by category
  const permissionsByCategory = (permissions ?? []).reduce<Record<string, Doc<"permissions">[]>>((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600 mt-1">
            Manage roles, permissions, and operator assignments
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Role
        </button>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setView("roles")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              view === "roles"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Roles ({roles?.length || 0})
          </button>
          <button
            onClick={() => setView("assignments")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              view === "assignments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Assignments ({assignments?.length || 0})
          </button>
        </nav>
      </div>

      {/* Roles View */}
      {view === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-3">
            {roles?.map((role) => (
              <div
                key={role._id}
                onClick={() => setSelectedRole(role._id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === role._id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          System
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {role.permissions.length} permissions
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {roles?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No roles found</p>
                <p className="text-sm mt-1">Create your first role to get started</p>
              </div>
            )}
          </div>

          {/* Role Details */}
          <div className="lg:col-span-2">
            {selectedRole && roles ? (
              (() => {
                const role = roles.find((r) => r._id === selectedRole);
                if (!role) return null;

                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                        {role.description && (
                          <p className="text-gray-600 mt-1">{role.description}</p>
                        )}
                      </div>
                      {!role.isSystem && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              /* TODO: Edit modal */
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  `Are you sure you want to delete the role "${role.name}"?`
                                )
                              ) {
                                await deleteRole({
                                  roleId: role._id,
                                  deletedBy: currentOperatorId,
                                });
                                setSelectedRole(null);
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Permissions ({role.permissions.length})
                      </h4>

                      {Object.entries(permissionsByCategory as Record<string, Doc<"permissions">[]>).map(
                        ([category, perms]) => {
                          const rolePerms = role.permissions;
                          const categoryPerms = perms.filter((p) =>
                            rolePerms.includes(`${p.action}:${p.resource}`)
                          );

                          if (categoryPerms.length === 0) return null;

                          return (
                            <div key={category} className="mb-4">
                              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                {category}
                              </h5>
                              <div className="space-y-1">
                                {categoryPerms.map((perm) => (
                                  <div
                                    key={`${perm.action}:${perm.resource}`}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <svg
                                      className="w-4 h-4 text-green-600 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    <span className="text-gray-900 font-medium">
                                      {perm.action}:{perm.resource}
                                    </span>
                                    <span className="text-gray-500">
                                      - {perm.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {role.isSystem && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>System Role:</strong> This role is built-in and cannot be
                          modified or deleted.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <p>Select a role to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments View */}
      {view === "assignments" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Role Assignments</h3>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Assign Role
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments?.map((assignment) => {
                  const operator = operators?.find((o) => o._id === assignment.operatorId);
                  const role = roles?.find((r) => r._id === assignment.roleId);

                  return (
                    <tr key={assignment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {operator?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {operator?.email || ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {role?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.expiresAt
                          ? new Date(assignment.expiresAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={async () => {
                            if (
                              confirm(
                                `Revoke ${role?.name} role from ${operator?.name}?`
                              )
                            ) {
                              await revokeRole({
                                assignmentId: assignment._id,
                                revokedBy: currentOperatorId,
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {assignments?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No role assignments</p>
                <p className="text-sm mt-1">Assign roles to operators to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Role Modal (Simplified) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Role</h3>
            <p className="text-sm text-gray-600 mb-4">
              Note: Full role creation with permission selection requires additional UI.
              For now, use the Convex dashboard or API.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal (Simplified) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Role</h3>
            <p className="text-sm text-gray-600 mb-4">
              Note: Full assignment UI with operator and role selection requires additional
              form components. For now, use the Convex dashboard or API.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
