/**
 * RBAC Helper Functions
 *
 * Authorization and permission checking utilities.
 */

import { QueryCtx, MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

/**
 * Get operator by auth identity (Clerk subject or other provider)
 */
export async function getOperatorByIdentity(
  ctx: QueryCtx | MutationCtx,
  identity: { subject?: string } | null,
): Promise<any> {
  const subject = identity?.subject;
  if (!subject) return null;

  const operator = await ctx.db
    .query('operators')
    .withIndex('by_auth', (q) => q.eq('authIdentity', subject))
    .first();

  return operator ?? null;
}

/**
 * Get all permissions for an operator
 */
export async function getOperatorPermissions(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
): Promise<string[]> {
  // Get operator's role assignments
  const assignments = await ctx.db
    .query('roleAssignments')
    .withIndex('by_operator', (q) => q.eq('operatorId', operatorId))
    .collect();

  // Filter out expired assignments
  const now = Date.now();
  const activeAssignments = assignments.filter(
    (a) => !a.expiresAt || a.expiresAt > now,
  );

  // Get all roles
  const roleIds = activeAssignments.map((a) => a.roleId);
  const roles = await Promise.all(roleIds.map((id) => ctx.db.get(id)));

  // Collect all permissions (deduplicated)
  const permissionSet = new Set<string>();
  for (const role of roles) {
    if (role) {
      for (const permission of role.permissions) {
        permissionSet.add(permission);
      }
    }
  }

  return Array.from(permissionSet);
}

/**
 * Check if operator has a specific permission
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permission: string,
): Promise<boolean> {
  const permissions = await getOperatorPermissions(ctx, operatorId);
  return permissions.includes(permission);
}

/**
 * Check if operator has any of the specified permissions
 */
export async function hasAnyPermission(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permissions: string[],
): Promise<boolean> {
  const operatorPermissions = await getOperatorPermissions(ctx, operatorId);
  return permissions.some((p) => operatorPermissions.includes(p));
}

/**
 * Check if operator has all of the specified permissions
 */
export async function hasAllPermissions(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permissions: string[],
): Promise<boolean> {
  const operatorPermissions = await getOperatorPermissions(ctx, operatorId);
  return permissions.every((p) => operatorPermissions.includes(p));
}

/**
 * Require a specific permission (throws if not authorized)
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permission: string,
): Promise<void> {
  const allowed = await hasPermission(ctx, operatorId, permission);
  if (!allowed) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require any of the specified permissions (throws if not authorized)
 */
export async function requireAnyPermission(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permissions: string[],
): Promise<void> {
  const allowed = await hasAnyPermission(ctx, operatorId, permissions);
  if (!allowed) {
    throw new Error(
      `Permission denied: requires one of [${permissions.join(', ')}]`,
    );
  }
}

/**
 * Require all of the specified permissions (throws if not authorized)
 */
export async function requireAllPermissions(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  permissions: string[],
): Promise<void> {
  const allowed = await hasAllPermissions(ctx, operatorId, permissions);
  if (!allowed) {
    throw new Error(
      `Permission denied: requires all of [${permissions.join(', ')}]`,
    );
  }
}

/**
 * Check if operator has a specific role
 */
export async function hasRole(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
  roleName: string,
): Promise<boolean> {
  // Get operator
  const operator = await ctx.db.get(operatorId);
  if (!operator) return false;

  // Get role by name
  const role = await ctx.db
    .query('roles')
    .withIndex('by_name', (q) => q.eq('tenantId', operator.tenantId).eq('name', roleName))
    .first();

  if (!role) return false;

  // Check if operator has this role
  const assignment = await ctx.db
    .query('roleAssignments')
    .withIndex('by_operator', (q) => q.eq('operatorId', operatorId))
    .filter((q) => q.eq(q.field('roleId'), role._id))
    .first();

  if (!assignment) return false;

  // Check if not expired
  const now = Date.now();
  return !assignment.expiresAt || assignment.expiresAt > now;
}

/**
 * Check if operator is admin
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
): Promise<boolean> {
  return await hasRole(ctx, operatorId, 'Admin');
}

/**
 * Check if operator is super admin
 */
export async function isSuperAdmin(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
): Promise<boolean> {
  return await hasRole(ctx, operatorId, 'Super Admin');
}

/**
 * Get operator's roles
 */
export async function getOperatorRoles(
  ctx: QueryCtx | MutationCtx,
  operatorId: Id<'operators'>,
): Promise<any[]> {
  // Get assignments
  const assignments = await ctx.db
    .query('roleAssignments')
    .withIndex('by_operator', (q) => q.eq('operatorId', operatorId))
    .collect();

  // Filter out expired
  const now = Date.now();
  const activeAssignments = assignments.filter(
    (a) => !a.expiresAt || a.expiresAt > now,
  );

  // Get roles
  const roles = await Promise.all(
    activeAssignments.map((a) => ctx.db.get(a.roleId)),
  );

  return roles.filter((r) => r !== null);
}
