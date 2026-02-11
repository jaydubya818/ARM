/**
 * Tenant Context Helpers
 * 
 * Ensures all operations are scoped to the correct tenant.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getOperatorByIdentity } from "./rbac";

/**
 * Get the tenant ID for the current authenticated operator
 */
export async function getTenantContext(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"tenants">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const operator = await getOperatorByIdentity(ctx, identity);
  if (!operator) {
    throw new Error("Operator not found");
  }

  return operator.tenantId;
}

/**
 * Validate that a resource belongs to the operator's tenant
 */
export async function validateTenantAccess(
  ctx: QueryCtx | MutationCtx,
  resourceTenantId: Id<"tenants">
): Promise<void> {
  const operatorTenantId = await getTenantContext(ctx);

  if (operatorTenantId !== resourceTenantId) {
    throw new Error("Access denied: Resource belongs to different tenant");
  }
}

/**
 * Get operator from current auth context
 */
export async function getCurrentOperator(
  ctx: QueryCtx | MutationCtx
): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const operator = await getOperatorByIdentity(ctx, identity);
  if (!operator) {
    throw new Error("Operator not found");
  }

  return operator;
}
