/**
 * Authorization Middleware
 * 
 * Wraps queries and mutations with permission checks and audit logging.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { requirePermission, requireAnyPermission } from "./rbac";
import { getCurrentOperator, getTenantContext } from "./tenantContext";

/**
 * Authorization result for audit logging
 */
export interface AuthResult {
  allowed: boolean;
  operatorId: Id<"operators">;
  tenantId: Id<"tenants">;
  permission: string | string[];
  reason?: string;
}

/**
 * Wrap a query with permission check
 *
 * Note: Queries cannot write to the database, so audit logging is not
 * performed here. Use withPermissionMutation for operations that need
 * audit logging.
 */
export async function withPermission<T>(
  ctx: QueryCtx,
  permission: string,
  handler: () => Promise<T>
): Promise<T> {
  const operator = await getCurrentOperator(ctx);

  await requirePermission(ctx, operator._id, permission);

  return await handler();
}

/**
 * Wrap a mutation with permission check
 */
export async function withPermissionMutation<T>(
  ctx: MutationCtx,
  permission: string,
  handler: () => Promise<T>
): Promise<T> {
  const operator = await getCurrentOperator(ctx);
  const tenantId = await getTenantContext(ctx);

  try {
    await requirePermission(ctx, operator._id, permission);

    // Log successful access
    await ctx.db.insert("auditLogs", {
      tenantId,
      operatorId: operator._id,
      action: "ACCESS_GRANTED",
      resource: permission,
      details: {
        permission,
      },
      timestamp: Date.now(),
      severity: "INFO",
    });

    return await handler();
  } catch (error) {
    // Log denied access
    await ctx.db.insert("auditLogs", {
      tenantId,
      operatorId: operator._id,
      action: "ACCESS_DENIED",
      resource: permission,
      details: {
        permission,
        reason: (error as Error).message,
      },
      timestamp: Date.now(),
      severity: "WARNING",
    });

    throw error;
  }
}

/**
 * Wrap a query with "any of" permission check
 *
 * Note: Queries cannot write to the database, so audit logging is not
 * performed here. Use withAnyPermissionMutation for operations that need
 * audit logging.
 */
export async function withAnyPermission<T>(
  ctx: QueryCtx,
  permissions: string[],
  handler: () => Promise<T>
): Promise<T> {
  const operator = await getCurrentOperator(ctx);

  await requireAnyPermission(ctx, operator._id, permissions);

  return await handler();
}

/**
 * Wrap a mutation with "any of" permission check
 */
export async function withAnyPermissionMutation<T>(
  ctx: MutationCtx,
  permissions: string[],
  handler: () => Promise<T>
): Promise<T> {
  const operator = await getCurrentOperator(ctx);
  const tenantId = await getTenantContext(ctx);

  try {
    await requireAnyPermission(ctx, operator._id, permissions);

    await ctx.db.insert("auditLogs", {
      tenantId,
      operatorId: operator._id,
      action: "ACCESS_GRANTED",
      resource: permissions.join(", "),
      details: {
        permission: permissions.join(", "),
      },
      timestamp: Date.now(),
      severity: "INFO",
    });

    return await handler();
  } catch (error) {
    await ctx.db.insert("auditLogs", {
      tenantId,
      operatorId: operator._id,
      action: "ACCESS_DENIED",
      resource: permissions.join(", "),
      details: {
        permission: permissions.join(", "),
        reason: (error as Error).message,
      },
      timestamp: Date.now(),
      severity: "WARNING",
    });

    throw error;
  }
}

/**
 * Check permission without throwing (for conditional UI)
 */
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
): Promise<boolean> {
  try {
    const operator = await getCurrentOperator(ctx);
    await requirePermission(ctx, operator._id, permission);
    return true;
  } catch {
    return false;
  }
}
