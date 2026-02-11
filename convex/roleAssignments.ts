/**
 * Role Assignments CRUD Operations
 *
 * Manages operator-role mappings.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * List all role assignments for a tenant
 */
export const list = query({
  args: {
    tenantId: v.id('tenants'),
  },
  handler: async (ctx, args) => await ctx.db
    .query('roleAssignments')
    .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
    .collect(),
});

/**
 * Get role assignments for a specific operator
 */
export const getByOperator = query({
  args: {
    operatorId: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('roleAssignments')
      .withIndex('by_operator', (q) => q.eq('operatorId', args.operatorId))
      .collect();

    // Filter out expired assignments
    const now = Date.now();
    return assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > now,
    );
  },
});

/**
 * Get all operators with a specific role
 */
export const getOperatorsWithRole = query({
  args: {
    roleId: v.id('roles'),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('roleAssignments')
      .withIndex('by_role', (q) => q.eq('roleId', args.roleId))
      .collect();

    // Filter out expired assignments
    const now = Date.now();
    const activeAssignments = assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > now,
    );

    // Get operator details
    const operators = await Promise.all(
      activeAssignments.map((a) => ctx.db.get(a.operatorId)),
    );

    return operators.filter((op) => op !== null);
  },
});

/**
 * Assign a role to an operator
 */
export const assign = mutation({
  args: {
    tenantId: v.id('tenants'),
    operatorId: v.id('operators'),
    roleId: v.id('roles'),
    assignedBy: v.id('operators'),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate operator exists and belongs to tenant
    const operator = await ctx.db.get(args.operatorId);
    if (!operator) {
      throw new Error('Operator not found');
    }
    if (operator.tenantId !== args.tenantId) {
      throw new Error('Operator does not belong to this tenant');
    }

    // Validate role exists and belongs to tenant (or is system role)
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    if (!role.isSystem && role.tenantId !== args.tenantId) {
      throw new Error('Role does not belong to this tenant');
    }

    // Check if assignment already exists
    const existing = await ctx.db
      .query('roleAssignments')
      .withIndex('by_operator', (q) => q.eq('operatorId', args.operatorId))
      .filter((q) => q.eq(q.field('roleId'), args.roleId))
      .first();

    if (existing) {
      // Update expiration if provided
      if (args.expiresAt !== undefined) {
        await ctx.db.patch(existing._id, {
          expiresAt: args.expiresAt,
          assignedBy: args.assignedBy,
          assignedAt: Date.now(),
        });
        return existing._id;
      }
      throw new Error('Role already assigned to this operator');
    }

    // Create assignment
    const now = Date.now();
    const assignmentId = await ctx.db.insert('roleAssignments', {
      tenantId: args.tenantId,
      operatorId: args.operatorId,
      roleId: args.roleId,
      assignedBy: args.assignedBy,
      assignedAt: now,
      expiresAt: args.expiresAt,
    });

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId: args.tenantId,
      type: 'ROLE_ASSIGNED',
      targetEntity: 'operator',
      targetId: args.operatorId,
      payload: {
        roleId: args.roleId,
        roleName: role.name,
        assignedBy: args.assignedBy,
        expiresAt: args.expiresAt,
      },
      timestamp: now,
    });

    return assignmentId;
  },
});

/**
 * Revoke a role assignment
 */
export const revoke = mutation({
  args: {
    assignmentId: v.id('roleAssignments'),
    revokedBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Get role details for change record
    const role = await ctx.db.get(assignment.roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if this is the last admin role
    if (role.name === 'Admin') {
      const adminRole = await ctx.db
        .query('roles')
        .withIndex('by_name', (q) => q.eq('tenantId', assignment.tenantId).eq('name', 'Admin'))
        .first();

      if (adminRole) {
        const adminAssignments = await ctx.db
          .query('roleAssignments')
          .withIndex('by_role', (q) => q.eq('roleId', adminRole._id))
          .collect();

        const now = Date.now();
        const activeAdmins = adminAssignments.filter(
          (a) => a._id !== args.assignmentId
            && (!a.expiresAt || a.expiresAt > now),
        );

        if (activeAdmins.length === 0) {
          throw new Error('Cannot revoke last admin role');
        }
      }
    }

    // Delete assignment
    await ctx.db.delete(args.assignmentId);

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId: assignment.tenantId,
      type: 'ROLE_REVOKED',
      targetEntity: 'operator',
      targetId: assignment.operatorId,
      payload: {
        roleId: assignment.roleId,
        roleName: role.name,
        revokedBy: args.revokedBy,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Revoke all role assignments for an operator
 */
export const revokeAll = mutation({
  args: {
    operatorId: v.id('operators'),
    revokedBy: v.id('operators'),
  },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query('roleAssignments')
      .withIndex('by_operator', (q) => q.eq('operatorId', args.operatorId))
      .collect();

    if (assignments.length === 0) {
      return { success: true, revoked: 0 };
    }

    const { tenantId } = assignments[0];

    // Check if this would remove the last admin
    const operator = await ctx.db.get(args.operatorId);
    if (operator) {
      const adminRole = await ctx.db
        .query('roles')
        .withIndex('by_name', (q) => q.eq('tenantId', tenantId).eq('name', 'Admin'))
        .first();

      if (adminRole) {
        const hasAdminRole = assignments.some(
          (a) => a.roleId === adminRole._id,
        );

        if (hasAdminRole) {
          const allAdminAssignments = await ctx.db
            .query('roleAssignments')
            .withIndex('by_role', (q) => q.eq('roleId', adminRole._id))
            .collect();

          const now = Date.now();
          const otherActiveAdmins = allAdminAssignments.filter(
            (a) => a.operatorId !== args.operatorId
              && (!a.expiresAt || a.expiresAt > now),
          );

          if (otherActiveAdmins.length === 0) {
            throw new Error('Cannot revoke all roles: would remove last admin');
          }
        }
      }
    }

    // Delete all assignments
    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Write change record
    await ctx.db.insert('changeRecords', {
      tenantId,
      type: 'ALL_ROLES_REVOKED',
      targetEntity: 'operator',
      targetId: args.operatorId,
      payload: {
        count: assignments.length,
        revokedBy: args.revokedBy,
      },
      timestamp: Date.now(),
    });

    return { success: true, revoked: assignments.length };
  },
});
