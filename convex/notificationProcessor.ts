/**
 * Notification Event Processor
 * 
 * Processes notification events and creates notifications for operators.
 */

import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Process a single notification event
 */
export const processEvent = internalAction({
  args: {
    eventId: v.id("notificationEvents"),
  },
  handler: async (ctx, args) => {
    // Get event
    const event = await ctx.runQuery(async (ctx) => {
      return await ctx.db.get(args.eventId);
    });

    if (!event) {
      console.error("Event not found:", args.eventId);
      return { success: false, error: "Event not found" };
    }

    if (event.processed) {
      console.log("Event already processed:", args.eventId);
      return { success: true, skipped: true };
    }

    try {
      // Get all operators for the tenant
      const operators = await ctx.runQuery(async (ctx) => {
        return await ctx.db
          .query("operators")
          .withIndex("by_tenant", (q) => q.eq("tenantId", event.tenantId))
          .collect();
      });

      // Get notification preferences for each operator
      for (const operator of operators) {
        const preferences = await ctx.runQuery(async (ctx) => {
          return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_event", (q) =>
              q.eq("operatorId", operator._id).eq("eventType", event.type)
            )
            .first();
        });

        // Check if operator wants this notification
        if (preferences && !preferences.enabled) {
          continue;
        }

        // Create notification
        const notification = await ctx.runMutation(internal.notificationProcessor.createNotification, {
          tenantId: event.tenantId,
          operatorId: operator._id,
          eventId: args.eventId,
          type: event.type,
          payload: event.payload,
        });

        console.log(`Created notification ${notification} for operator ${operator._id}`);
      }

      // Mark event as processed
      await ctx.runMutation(internal.notificationProcessor.markProcessed, {
        eventId: args.eventId,
      });

      return { success: true };
    } catch (error) {
      console.error("Error processing event:", error);
      return { success: false, error: (error as Error).message };
    }
  },
});

/**
 * Create a notification (internal)
 */
export const createNotification = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    operatorId: v.id("operators"),
    eventId: v.id("notificationEvents"),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Generate notification content based on event type
    const { title, message, severity } = generateNotificationContent(
      args.type,
      args.payload
    );

    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      operatorId: args.operatorId,
      eventId: args.eventId,
      title,
      message,
      severity,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark event as processed (internal)
 */
export const markProcessed = internalMutation({
  args: {
    eventId: v.id("notificationEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      processed: true,
    });
  },
});

/**
 * Generate notification content based on event type
 */
function generateNotificationContent(
  type: string,
  payload: any
): { title: string; message: string; severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR" } {
  switch (type) {
    case "EVAL_COMPLETED":
      return {
        title: "Evaluation Complete",
        message: `Evaluation run for suite "${payload.suiteName}" completed with ${payload.passRate}% pass rate.`,
        severity: payload.passRate >= 80 ? "SUCCESS" : "WARNING",
      };

    case "EVAL_FAILED":
      return {
        title: "Evaluation Failed",
        message: `Evaluation run for suite "${payload.suiteName}" failed: ${payload.error}`,
        severity: "ERROR",
      };

    case "VERSION_APPROVED":
      return {
        title: "Version Approved",
        message: `Agent version ${payload.versionLabel} has been approved and is ready for deployment.`,
        severity: "SUCCESS",
      };

    case "VERSION_REJECTED":
      return {
        title: "Version Rejected",
        message: `Agent version ${payload.versionLabel} was rejected: ${payload.reason}`,
        severity: "WARNING",
      };

    case "INSTANCE_FAILED":
      return {
        title: "Instance Failed",
        message: `Agent instance in ${payload.environment} has failed. Immediate attention required.`,
        severity: "ERROR",
      };

    case "APPROVAL_REQUIRED":
      return {
        title: "Approval Required",
        message: `${payload.requestType} requires your approval: ${payload.description}`,
        severity: "INFO",
      };

    case "POLICY_VIOLATION":
      return {
        title: "Policy Violation",
        message: `Policy "${payload.policyName}" was violated: ${payload.reason}`,
        severity: "WARNING",
      };

    case "CUSTOM_FUNCTION_ERROR":
      return {
        title: "Custom Function Error",
        message: `Custom scoring function "${payload.functionName}" encountered an error: ${payload.error}`,
        severity: "ERROR",
      };

    default:
      return {
        title: "Notification",
        message: `Event: ${type}`,
        severity: "INFO",
      };
  }
}
