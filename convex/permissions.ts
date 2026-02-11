/**
 * Permissions Registry
 *
 * Manages the global permission registry.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * List all permissions
 */
export const list = query({
  handler: async (ctx) => await ctx.db.query('permissions').collect(),
});

/**
 * Get permissions by resource
 */
export const getByResource = query({
  args: {
    resource: v.string(),
  },
  handler: async (ctx, args) => await ctx.db
    .query('permissions')
    .withIndex('by_resource', (q) => q.eq('resource', args.resource))
    .collect(),
});

/**
 * Get permissions by category
 */
export const getByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => await ctx.db
    .query('permissions')
    .withIndex('by_category', (q) => q.eq('category', args.category))
    .collect(),
});

/**
 * Seed initial permissions
 *
 * This should be called once during initial setup.
 */
export const seed = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query('permissions').first();
    if (existing) {
      console.log('Permissions already seeded');
      return { success: true, seeded: 0 };
    }

    const permissions = [
      // Core Resources - Templates
      {
        resource: 'templates', action: 'read', description: 'View agent templates', category: 'core',
      },
      {
        resource: 'templates', action: 'write', description: 'Create/update templates', category: 'core',
      },
      {
        resource: 'templates', action: 'delete', description: 'Delete templates', category: 'core',
      },

      // Core Resources - Versions
      {
        resource: 'versions', action: 'read', description: 'View agent versions', category: 'core',
      },
      {
        resource: 'versions', action: 'write', description: 'Create/update versions', category: 'core',
      },
      {
        resource: 'versions', action: 'delete', description: 'Delete versions', category: 'core',
      },
      {
        resource: 'versions', action: 'approve', description: 'Approve version transitions', category: 'core',
      },
      {
        resource: 'versions', action: 'transition', description: 'Trigger lifecycle transitions', category: 'core',
      },

      // Core Resources - Instances
      {
        resource: 'instances', action: 'read', description: 'View agent instances', category: 'core',
      },
      {
        resource: 'instances', action: 'write', description: 'Create/update instances', category: 'core',
      },
      {
        resource: 'instances', action: 'delete', description: 'Delete instances', category: 'core',
      },
      {
        resource: 'instances', action: 'start', description: 'Start instances', category: 'core',
      },
      {
        resource: 'instances', action: 'stop', description: 'Stop instances', category: 'core',
      },

      // Evaluation
      {
        resource: 'evaluations', action: 'read', description: 'View evaluation suites and runs', category: 'evaluation',
      },
      {
        resource: 'evaluations', action: 'write', description: 'Create/update suites', category: 'evaluation',
      },
      {
        resource: 'evaluations', action: 'delete', description: 'Delete suites', category: 'evaluation',
      },
      {
        resource: 'evaluations', action: 'execute', description: 'Trigger evaluation runs', category: 'evaluation',
      },
      {
        resource: 'evaluations', action: 'cancel', description: 'Cancel running evaluations', category: 'evaluation',
      },

      // Policies
      {
        resource: 'policies', action: 'read', description: 'View policy envelopes', category: 'policies',
      },
      {
        resource: 'policies', action: 'write', description: 'Create/update policies', category: 'policies',
      },
      {
        resource: 'policies', action: 'delete', description: 'Delete policies', category: 'policies',
      },
      {
        resource: 'policies', action: 'evaluate', description: 'Evaluate policy decisions', category: 'policies',
      },

      // Approvals
      {
        resource: 'approvals', action: 'read', description: 'View approval requests', category: 'approvals',
      },
      {
        resource: 'approvals', action: 'write', description: 'Create approval requests', category: 'approvals',
      },
      {
        resource: 'approvals', action: 'approve', description: 'Approve requests', category: 'approvals',
      },
      {
        resource: 'approvals', action: 'reject', description: 'Reject requests', category: 'approvals',
      },

      // Administration - Operators
      {
        resource: 'operators', action: 'read', description: 'View operators', category: 'admin',
      },
      {
        resource: 'operators', action: 'write', description: 'Create/update operators', category: 'admin',
      },
      {
        resource: 'operators', action: 'delete', description: 'Delete operators', category: 'admin',
      },

      // Administration - Roles
      {
        resource: 'roles', action: 'read', description: 'View roles', category: 'admin',
      },
      {
        resource: 'roles', action: 'write', description: 'Create/update roles', category: 'admin',
      },
      {
        resource: 'roles', action: 'delete', description: 'Delete roles', category: 'admin',
      },
      {
        resource: 'roles', action: 'assign', description: 'Assign roles to operators', category: 'admin',
      },
      {
        resource: 'roles', action: 'revoke', description: 'Revoke role assignments', category: 'admin',
      },

      // Administration - Permissions
      {
        resource: 'permissions', action: 'read', description: 'View permissions', category: 'admin',
      },
      {
        resource: 'permissions', action: 'manage', description: 'Manage permission registry', category: 'admin',
      },

      // Administration - Tenant
      {
        resource: 'tenant', action: 'read', description: 'View tenant details', category: 'admin',
      },
      {
        resource: 'tenant', action: 'write', description: 'Update tenant settings', category: 'admin',
      },
      {
        resource: 'tenant', action: 'manage', description: 'Full tenant administration', category: 'admin',
      },

      // Audit & Monitoring
      {
        resource: 'audit', action: 'read', description: 'View audit logs', category: 'audit',
      },
      {
        resource: 'audit', action: 'export', description: 'Export audit logs', category: 'audit',
      },
      {
        resource: 'metrics', action: 'read', description: 'View analytics metrics', category: 'audit',
      },

      // Advanced Features - Custom Functions
      {
        resource: 'custom-functions', action: 'read', description: 'View custom scoring functions', category: 'advanced',
      },
      {
        resource: 'custom-functions', action: 'write', description: 'Create/update functions', category: 'advanced',
      },
      {
        resource: 'custom-functions', action: 'delete', description: 'Delete functions', category: 'advanced',
      },
      {
        resource: 'custom-functions', action: 'execute', description: 'Execute functions', category: 'advanced',
      },

      // Advanced Features - Notifications
      {
        resource: 'notifications', action: 'read', description: 'View notifications', category: 'advanced',
      },
      {
        resource: 'notifications', action: 'write', description: 'Create notifications', category: 'advanced',
      },
      {
        resource: 'notifications', action: 'manage', description: 'Manage notification settings', category: 'advanced',
      },
    ];

    // Insert all permissions
    for (const permission of permissions) {
      await ctx.db.insert('permissions', permission);
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);

    return { success: true, seeded: permissions.length };
  },
});

/**
 * Get all permission strings (for validation)
 */
export const getAllPermissionStrings = query({
  handler: async (ctx) => {
    const permissions = await ctx.db.query('permissions').collect();
    return permissions.map((p) => `${p.action}:${p.resource}`);
  },
});
