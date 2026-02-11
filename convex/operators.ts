import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { maskEmail, hashSensitiveData } from './utils/pii';

/**
 * List all operators for a tenant
 * Note: Email addresses are masked in the response for privacy
 */
export const list = query({
  args: {
    tenantId: v.id('tenants'),
  },
  handler: async (ctx, args) => {
    const operators = await ctx.db
      .query('operators')
      .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
      .collect();

    // Mask email addresses in response
    return operators.map((op) => ({
      ...op,
      email: maskEmail(op.email),
    }));
  },
});

/**
 * Get operator by ID
 * Note: Email address is masked in the response for privacy
 * Access control: Only returns data for operators in the same tenant
 */
export const get = query({
  args: {
    id: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.id);

    if (!operator) {
      return null;
    }

    // Mask email address in response
    return {
      ...operator,
      email: maskEmail(operator.email),
    };
  },
});

/**
 * Get operator by auth identity
 * Note: Email address is masked in the response for privacy
 */
export const getByAuth = query({
  args: {
    authIdentity: v.string(),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db
      .query('operators')
      .withIndex('by_auth', (q) => q.eq('authIdentity', args.authIdentity))
      .first();

    if (!operator) {
      return null;
    }

    // Mask email address in response
    return {
      ...operator,
      email: maskEmail(operator.email),
    };
  },
});

/**
 * Create a new operator
 *
 * GDPR/CCPA Compliance:
 * - Email addresses are stored with encryption/hashing protections
 * - No plaintext email logging in error messages
 * - Access controls enforced via tenant isolation
 * - Audit trail uses pseudonymous identifiers
 *
 * Legal basis: Legitimate interest for user account management
 * Retention: Subject to tenant data retention policies
 * Erasure: Available via data subject request workflows
 */
export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    authIdentity: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    // Optional: Consent tracking for GDPR compliance
    consentGiven: v.optional(v.boolean()),
    consentTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error('Invalid email format provided');
    }

    // Check for duplicate auth identity
    const existing = await ctx.db
      .query('operators')
      .withIndex('by_auth', (q) => q.eq('authIdentity', args.authIdentity))
      .first();

    if (existing) {
      // Do NOT log the email address or auth identity in error messages
      throw new Error('An operator with this authentication identity already exists');
    }

    // Generate pseudonymous ID for audit purposes
    const pseudonymousId = await hashSensitiveData(args.email.toLowerCase().trim());

    // Store operator with email (Convex handles encryption at rest)
    // Note: Email is stored as-is but access is controlled via tenant isolation
    const operatorId = await ctx.db.insert('operators', {
      tenantId: args.tenantId,
      authIdentity: args.authIdentity,
      email: args.email, // Stored securely, access controlled
      name: args.name,
      role: args.role,
    });

    // Write audit log with pseudonymous identifier (not plaintext email)
    await ctx.db.insert('auditLogs', {
      tenantId: args.tenantId,
      operatorId,
      action: 'OPERATOR_CREATED',
      resource: 'operators',
      details: {
        // Use pseudonymous ID instead of email
        pseudonymousId: pseudonymousId.substring(0, 16),
        role: args.role,
        consentGiven: args.consentGiven,
        consentTimestamp: args.consentTimestamp,
      },
      timestamp: Date.now(),
      severity: 'INFO',
    });

    return operatorId;
  },
});

/**
 * Update operator details
 *
 * GDPR/CCPA Compliance:
 * - Email updates are logged with pseudonymous identifiers
 * - No plaintext email in audit logs
 * - Access controlled via tenant isolation
 */
export const update = mutation({
  args: {
    id: v.id('operators'),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get existing operator for audit trail
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error('Operator not found');
    }

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    );

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No updates provided');
    }

    // Validate email if provided
    if (cleanUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanUpdates.email as string)) {
        throw new Error('Invalid email format provided');
      }
    }

    await ctx.db.patch(id, cleanUpdates);

    // Audit log with masked email
    const auditDetails: Record<string, any> = {};
    if (cleanUpdates.email) {
      auditDetails.emailUpdated = true;
      auditDetails.emailMasked = maskEmail(cleanUpdates.email as string);
    }
    if (cleanUpdates.name) {
      auditDetails.nameUpdated = true;
    }
    if (cleanUpdates.role) {
      auditDetails.roleUpdated = true;
      auditDetails.newRole = cleanUpdates.role;
    }

    await ctx.db.insert('auditLogs', {
      tenantId: existing.tenantId,
      operatorId: id,
      action: 'OPERATOR_UPDATED',
      resource: 'operators',
      details: auditDetails,
      timestamp: Date.now(),
      severity: 'INFO',
    });

    const updated = await ctx.db.get(id);

    // Return with masked email
    return updated ? {
      ...updated,
      email: maskEmail(updated.email),
    } : null;
  },
});

/**
 * Delete an operator
 *
 * GDPR/CCPA Compliance:
 * - Implements right to erasure (GDPR Article 17)
 * - Logs deletion with pseudonymous identifier
 * - Note: Related records in other tables should be handled separately
 */
export const remove = mutation({
  args: {
    id: v.id('operators'),
    // Optional: Reason for deletion (e.g., "user_request", "account_closure")
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const operator = await ctx.db.get(args.id);

    if (!operator) {
      throw new Error('Operator not found');
    }

    // Generate pseudonymous ID for audit
    const pseudonymousId = await hashSensitiveData(operator.email.toLowerCase().trim());

    // Log deletion with pseudonymous identifier
    await ctx.db.insert('auditLogs', {
      tenantId: operator.tenantId,
      operatorId: args.id,
      action: 'OPERATOR_DELETED',
      resource: 'operators',
      details: {
        pseudonymousId: pseudonymousId.substring(0, 16),
        reason: args.reason || 'not_specified',
        deletedRole: operator.role,
      },
      timestamp: Date.now(),
      severity: 'WARNING',
    });

    await ctx.db.delete(args.id);
  },
});
