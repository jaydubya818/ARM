/**
 * Notifications System
 * 
 * Event-driven notifications with preferences and delivery channels.
 */

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * List notifications for an operator
 */
export const list = query({
  args: {
    operatorId: v.id("operators"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .order("desc");

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("read"), false));
    }

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get unread count
 */
export const getUnreadCount = query({
  args: {
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) =>
        q.eq("operatorId", args.operatorId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) =>
        q.eq("operatorId", args.operatorId).eq("read", false)
      )
      .collect();

    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        read: true,
        readAt: now,
      });
    }

    return { success: true, count: unread.length };
  },
});

/**
 * Delete a notification
 */
export const remove = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

/**
 * Get notification preferences for an operator
 */
export const getPreferences = query({
  args: {
    operatorId: v.id("operators"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationPreferences")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect();
  },
});

/**
 * Update notification preferences
 */
export const updatePreferences = mutation({
  args: {
    operatorId: v.id("operators"),
    eventType: v.string(),
    enabled: v.boolean(),
    channels: v.array(v.string()),
    frequency: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if preference exists
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_event", (q) =>
        q.eq("operatorId", args.operatorId).eq("eventType", args.eventType)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        channels: args.channels,
        frequency: args.frequency,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("notificationPreferences", {
        operatorId: args.operatorId,
        eventType: args.eventType,
        enabled: args.enabled,
        channels: args.channels,
        frequency: args.frequency,
      });
    }
  },
});

/**
 * Create a notification event (internal)
 */
export const createEvent = mutation({
  args: {
    tenantId: v.id("tenants"),
    type: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("notificationEvents", {
      tenantId: args.tenantId,
      type: args.type,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      payload: args.payload,
      timestamp: Date.now(),
      processed: false,
    });

    // Trigger processing (async)
    await ctx.scheduler.runAfter(0, internal.notificationProcessor.processEvent, {
      eventId,
    });

    return eventId;
  },
});

/**
 * Get pending notification events
 */
export const getPendingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notificationEvents")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("asc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Mark event as processed
 */
export const markEventProcessed = mutation({
  args: {
    eventId: v.id("notificationEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      processed: true,
    });
    return { success: true };
  },
});
