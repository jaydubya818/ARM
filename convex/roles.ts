/**
 * Roles CRUD Operations
 *
 * Manages role definitions with permissions.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * List all roles for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id('tenants'),
  },
  handler: async (ctx, args) => await ctx.db
    .query('roles')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

/**
 * Get a specific role by ID
 */
export const get = query({
  args: {
    roleId: v.id('roles'),
  },
  handler: async (ctx, args) => await ctx.db.get(args.roleId),
});

/**
 * Get a role by name
 */
export const getByName = query({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
  },
  handler: async (ctx, args) => await ctx.db
    .query('roles')
    .withIndex('by_name', (q) => q.eq('tenantId', args.tenantId).eq('name', args.name))
    .first(),
});

/**
 * Get all system roles
 */
export const getSystemRoles = query({
  handler: async (ctx) => await ctx.db
    .query('roles')
    .withIndex('by_system', (q) => q.eq('isSystem', true))
    .collect(),
});

/**
 * Create a new custom role
 */
export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    createdBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    // Validation
    if (!args.name.trim()) {
      throw new Error('Role name is required');
    }

    // Check for duplicate name
    const existing = await ctx.db
      .query('roles')
      .withIndex('by_name', (q) => q.eq('tenantId', args.tenantId).eq('name', args.name))
      .first();

    if (existing) {
      throw new Error(`Role with name "${args.name}" already exists`);
    }

    // Validate permissions exist
    const allPermissions = await ctx.db.query('permissions').collect();
    const validPermissions = new Set(
      allPermissions.map((p) => `${p.action}:${p.resource}`),
    );

    for (const permission of args.permissions) {
      if (!validPermissions.has(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }

    // Create role
    const now = Date.now();
    const roleId = await ctx.db.insert('roles', {
      tenantId: args.tenantId,
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      isSystem: false,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'ROLE_CREATED',
      targetEntity: 'role',
      targetId: roleId,
      payload: {
        name: args.name,
        permissions: args.permissions,
      },
      timestamp: now,
    });

    return roleId;
  },
});

/**
 * Update a role's permissions
 */
export const update = mutation({
  args: {
    roleId: v.id('roles'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    updatedBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Cannot modify system roles
    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    // Validate permissions if provided
    if (args.permissions) {
      const allPermissions = await ctx.db.query('permissions').collect();
      const validPermissions = new Set(
        allPermissions.map((p) => `${p.action}:${p.resource}`),
      );

      for (const permission of args.permissions) {
        if (!validPermissions.has(permission)) {
          throw new Error(`Invalid permission: ${permission}`);
        }
      }
    }

    // Check for duplicate name if changing name
    if (args.name && args.name !== role.name) {
      const newName = args.name;
      const existing = await ctx.db
        .query('roles')
        .withIndex('by_name', (q) => q.eq('tenantId', role.tenantId).eq('name', newName))
        .first();

      if (existing) {
        throw new Error(`Role with name "${args.name}" already exists`);
      }
    }

    // Update role
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.permissions !== undefined) updates.permissions = args.permissions;

    await ctx.db.patch(args.roleId, updates);

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId: role.tenantId,
      type: 'ROLE_UPDATED',
      targetEntity: 'role',
      targetId: args.roleId,
      payload: updates,
      timestamp: Date.now(),
    });

    return args.roleId;
  },
});

/**
 * Delete a role
 */
export const remove = mutation({
  args: {
    roleId: v.id('roles'),
    deletedBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Cannot delete system roles
    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    // Check for active assignments
    const assignments = await ctx.db
      .query('roleAssignments')
      .withIndex('by_role', (q) => q.eq('roleId', args.roleId))
      .collect();

    if (assignments.length > 0) {
      throw new Error(
        `Cannot delete role: ${assignments.length} active assignment(s) exist`,
      );
    }

    // Delete role
    await ctx.db.delete(args.roleId);

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId: role.tenantId,
      type: 'ROLE_DELETED',
      targetEntity: 'role',
      targetId: args.roleId,
      payload: {
        name: role.name,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
