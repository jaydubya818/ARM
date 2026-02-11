# Phase 3.0: Advanced Features - Implementation Plan

**Version:** 1.0  
**Created:** February 10, 2026  
**Duration:** 3-4 weeks  
**Status:** 🚀 Starting

---

## Overview

Phase 3.0 builds enterprise-grade features on top of the evaluation orchestration system:
- **Multi-tenant isolation** - Strict data separation and security
- **Role-based access control (RBAC)** - Granular permissions
- **Advanced analytics** - Trends, comparisons, insights
- **Custom scoring functions** - Extensible evaluation logic
- **Notification system** - Real-time alerts and updates

---

## Phase Structure

```
P3.0: Advanced Features (3-4 weeks)
├─ Step 5.1: RBAC Foundation (Week 1)
│  ├─ 5.1.1: Schema design (roles, permissions)
│  ├─ 5.1.2: Backend implementation
│  └─ 5.1.3: Authorization middleware
│
├─ Step 5.2: Tenant Isolation (Week 1-2)
│  ├─ 5.2.1: Tenant context enforcement
│  ├─ 5.2.2: Data access controls
│  └─ 5.2.3: Audit logging
│
├─ Step 5.3: Advanced Analytics (Week 2)
│  ├─ 5.3.1: Time-series data
│  ├─ 5.3.2: Comparison views
│  └─ 5.3.3: Trend analysis
│
├─ Step 5.4: Custom Scoring (Week 3)
│  ├─ 5.4.1: Function registry
│  ├─ 5.4.2: Execution sandbox
│  └─ 5.4.3: UI for custom functions
│
└─ Step 5.5: Notifications (Week 3-4)
   ├─ 5.5.1: Event system
   ├─ 5.5.2: Notification preferences
   └─ 5.5.3: Delivery channels
```

---

## Step 5.1: RBAC Foundation (Week 1, Days 1-3)

### 5.1.1: Schema Design (Day 1)

**Objective:** Design comprehensive RBAC schema

**New Tables:**
```typescript
// convex/schema.ts

roles: defineTable({
  tenantId: v.id("tenants"),
  name: v.string(),                    // "admin", "operator", "viewer"
  description: v.optional(v.string()),
  permissions: v.array(v.string()),    // ["read:versions", "write:templates"]
  isSystem: v.boolean(),               // true for built-in roles
  createdBy: v.id("operators"),
  createdAt: v.number(),
}).index("by_tenant", ["tenantId"])
  .index("by_name", ["tenantId", "name"]),

roleAssignments: defineTable({
  tenantId: v.id("tenants"),
  operatorId: v.id("operators"),
  roleId: v.id("roles"),
  assignedBy: v.id("operators"),
  assignedAt: v.number(),
  expiresAt: v.optional(v.number()),
}).index("by_operator", ["operatorId"])
  .index("by_role", ["roleId"])
  .index("by_tenant", ["tenantId"]),

permissions: defineTable({
  resource: v.string(),                // "templates", "versions", "instances"
  action: v.string(),                  // "read", "write", "delete", "approve"
  description: v.string(),
  category: v.string(),                // "core", "evaluation", "admin"
}).index("by_resource", ["resource"])
  .index("by_category", ["category"]),
```

**Permission Taxonomy:**
```typescript
// Core Resources
"read:templates"
"write:templates"
"delete:templates"
"read:versions"
"write:versions"
"delete:versions"
"approve:versions"
"read:instances"
"write:instances"
"delete:instances"

// Evaluation
"read:evaluations"
"write:evaluations"
"delete:evaluations"
"execute:evaluations"

// Policies
"read:policies"
"write:policies"
"delete:policies"

// Admin
"manage:operators"
"manage:roles"
"manage:permissions"
"view:audit"
"manage:tenant"
```

**System Roles:**
```typescript
1. Super Admin
   - All permissions
   - Tenant management
   - System configuration

2. Admin
   - All tenant-level permissions
   - User management
   - Role assignment

3. Operator
   - Read/write templates, versions, instances
   - Execute evaluations
   - View policies

4. Viewer
   - Read-only access
   - View evaluations
   - View audit logs
```

**Deliverables:**
- Updated `convex/schema.ts`
- Permission taxonomy document
- System roles definition
- Migration plan for existing operators

**Commit:** `feat: add RBAC schema (roles, permissions, assignments)`

---

### 5.1.2: Backend Implementation (Day 2)

**Objective:** Implement RBAC CRUD operations

**Files to Create:**

**1. `convex/roles.ts`**
```typescript
// Queries
export const list = query(...)           // List roles for tenant
export const get = query(...)            // Get role by ID
export const getByName = query(...)      // Get role by name
export const getSystemRoles = query(...) // Get built-in roles

// Mutations
export const create = mutation(...)      // Create custom role
export const update = mutation(...)      // Update role permissions
export const remove = mutation(...)      // Delete role (if no assignments)
```

**2. `convex/roleAssignments.ts`**
```typescript
// Queries
export const list = query(...)                    // List assignments
export const getByOperator = query(...)           // Get operator's roles
export const getOperatorsWithRole = query(...)    // Get role members

// Mutations
export const assign = mutation(...)               // Assign role to operator
export const revoke = mutation(...)               // Revoke role assignment
export const revokeAll = mutation(...)            // Revoke all for operator
```

**3. `convex/permissions.ts`**
```typescript
// Queries
export const list = query(...)           // List all permissions
export const getByResource = query(...)  // Get resource permissions
export const getByCategory = query(...)  // Get category permissions

// Mutations
export const seed = mutation(...)        // Seed initial permissions
```

**4. `convex/lib/rbac.ts`**
```typescript
// Authorization helpers
export function hasPermission(
  operator: Operator,
  permission: string
): Promise<boolean>

export function requirePermission(
  operator: Operator,
  permission: string
): Promise<void>

export function getOperatorPermissions(
  operatorId: Id<"operators">
): Promise<string[]>

export function checkPermissions(
  operatorId: Id<"operators">,
  permissions: string[]
): Promise<boolean>
```

**Validation Rules:**
- System roles cannot be modified
- Role name must be unique per tenant
- Cannot delete role with active assignments
- Cannot revoke last admin role
- Permissions must exist in registry

**Deliverables:**
- 4 new Convex files
- RBAC helper library
- Seed script for system roles
- Change records for all mutations

**Commit:** `feat: implement RBAC backend (roles, assignments, permissions)`

---

### 5.1.3: Authorization Middleware (Day 3)

**Objective:** Enforce permissions across all operations

**Files to Create:**

**1. `convex/lib/authMiddleware.ts`**
```typescript
import { mutation, query } from "./_generated/server";
import { hasPermission } from "./rbac";

// Wrapper for queries with permission check
export function authorizedQuery<Args, Output>(
  permission: string,
  handler: (ctx: QueryCtx, args: Args) => Promise<Output>
) {
  return query(async (ctx, args: Args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const operator = await getOperatorByIdentity(ctx, identity);
    if (!operator) throw new Error("Operator not found");

    const allowed = await hasPermission(operator, permission);
    if (!allowed) throw new Error(`Permission denied: ${permission}`);

    return handler(ctx, args);
  });
}

// Wrapper for mutations with permission check
export function authorizedMutation<Args, Output>(
  permission: string,
  handler: (ctx: MutationCtx, args: Args) => Promise<Output>
) {
  return mutation(async (ctx, args: Args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const operator = await getOperatorByIdentity(ctx, identity);
    if (!operator) throw new Error("Operator not found");

    const allowed = await hasPermission(operator, permission);
    if (!allowed) throw new Error(`Permission denied: ${permission}`);

    return handler(ctx, args);
  });
}
```

**2. Update Existing Files**

**Pattern:**
```typescript
// Before
export const create = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    // Create logic
  }
});

// After
export const create = authorizedMutation(
  "write:templates",
  async (ctx, args) => {
    // Create logic
  }
);
```

**Files to Update:**
- `convex/agentTemplates.ts`
- `convex/agentVersions.ts`
- `convex/agentInstances.ts`
- `convex/evaluationSuites.ts`
- `convex/evaluationRuns.ts`
- `convex/policyEnvelopes.ts`

**Deliverables:**
- Authorization middleware
- Updated CRUD operations with permission checks
- Error handling for unauthorized access
- Documentation on permission requirements

**Commit:** `feat: add authorization middleware and enforce permissions`

---

## Step 5.2: Tenant Isolation (Week 1-2, Days 4-7)

### 5.2.1: Tenant Context Enforcement (Day 4)

**Objective:** Ensure all operations are scoped to correct tenant

**Files to Create:**

**1. `convex/lib/tenantContext.ts`**
```typescript
// Tenant context helpers
export async function getTenantContext(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"tenants">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const operator = await getOperatorByIdentity(ctx, identity);
  if (!operator) throw new Error("Operator not found");

  return operator.tenantId;
}

export async function validateTenantAccess(
  ctx: QueryCtx | MutationCtx,
  resourceTenantId: Id<"tenants">
): Promise<void> {
  const operatorTenantId = await getTenantContext(ctx);
  
  if (operatorTenantId !== resourceTenantId) {
    throw new Error("Access denied: Resource belongs to different tenant");
  }
}

export function tenantQuery<Args, Output>(
  handler: (
    ctx: QueryCtx,
    args: Args,
    tenantId: Id<"tenants">
  ) => Promise<Output>
) {
  return query(async (ctx, args: Args) => {
    const tenantId = await getTenantContext(ctx);
    return handler(ctx, args, tenantId);
  });
}

export function tenantMutation<Args, Output>(
  handler: (
    ctx: MutationCtx,
    args: Args,
    tenantId: Id<"tenants">
  ) => Promise<Output>
) {
  return mutation(async (ctx, args: Args) => {
    const tenantId = await getTenantContext(ctx);
    return handler(ctx, args, tenantId);
  });
}
```

**2. Update All Queries/Mutations**

**Pattern:**
```typescript
// Before
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentTemplates")
      .withIndex("by_tenant", q => q.eq("tenantId", args.tenantId))
      .collect();
  }
});

// After
export const list = tenantQuery(async (ctx, args, tenantId) => {
  return await ctx.db
    .query("agentTemplates")
    .withIndex("by_tenant", q => q.eq("tenantId", tenantId))
    .collect();
});
```

**Deliverables:**
- Tenant context helpers
- Updated all queries/mutations
- Validation on cross-tenant access
- Audit logging for access attempts

**Commit:** `feat: enforce tenant isolation across all operations`

---

### 5.2.2: Data Access Controls (Day 5)

**Objective:** Implement row-level security

**Files to Create:**

**1. `convex/lib/dataAccess.ts`**
```typescript
// Data access control helpers
export async function canAccessTemplate(
  ctx: QueryCtx,
  templateId: Id<"agentTemplates">
): Promise<boolean> {
  const template = await ctx.db.get(templateId);
  if (!template) return false;

  const tenantId = await getTenantContext(ctx);
  return template.tenantId === tenantId;
}

export async function canAccessVersion(
  ctx: QueryCtx,
  versionId: Id<"agentVersions">
): Promise<boolean> {
  const version = await ctx.db.get(versionId);
  if (!version) return false;

  const tenantId = await getTenantContext(ctx);
  return version.tenantId === tenantId;
}

// Similar for all resources...

export async function requireAccessToTemplate(
  ctx: QueryCtx,
  templateId: Id<"agentTemplates">
): Promise<void> {
  const allowed = await canAccessTemplate(ctx, templateId);
  if (!allowed) {
    throw new Error("Access denied: Template not found or access denied");
  }
}
```

**2. Add Validation to All Get Operations**

**Pattern:**
```typescript
export const get = query({
  args: { templateId: v.id("agentTemplates") },
  handler: async (ctx, args) => {
    await requireAccessToTemplate(ctx, args.templateId);
    return await ctx.db.get(args.templateId);
  }
});
```

**Deliverables:**
- Data access control helpers
- Validation on all get/update/delete operations
- Error messages that don't leak information
- Audit logging for denied access

**Commit:** `feat: implement row-level data access controls`

---

### 5.2.3: Audit Logging (Day 6-7)

**Objective:** Comprehensive audit trail for security events

**Schema Update:**
```typescript
auditLogs: defineTable({
  tenantId: v.id("tenants"),
  operatorId: v.optional(v.id("operators")),
  action: v.string(),                  // "ACCESS_DENIED", "PERMISSION_CHECK"
  resource: v.string(),                // "template:abc123"
  details: v.object({
    permission: v.optional(v.string()),
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }),
  timestamp: v.number(),
  severity: v.union(
    v.literal("INFO"),
    v.literal("WARNING"),
    v.literal("ERROR")
  ),
}).index("by_tenant", ["tenantId"])
  .index("by_operator", ["operatorId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_severity", ["tenantId", "severity"]),
```

**Files to Create:**

**1. `convex/auditLogs.ts`**
```typescript
// Queries
export const list = query(...)           // List audit logs
export const getByOperator = query(...)  // Get operator's logs
export const getBySeverity = query(...)  // Get by severity

// Mutations
export const log = mutation(...)         // Create audit log entry

// Helper
export async function logAudit(
  ctx: MutationCtx,
  action: string,
  resource: string,
  details: object,
  severity: "INFO" | "WARNING" | "ERROR"
): Promise<void>
```

**2. Integrate Audit Logging**

**Events to Log:**
- Authentication attempts
- Permission checks (denied)
- Cross-tenant access attempts
- Role assignments/revocations
- Resource creation/modification/deletion
- Policy violations
- Evaluation runs

**Deliverables:**
- Audit log schema
- Audit log CRUD operations
- Integration in all security-sensitive operations
- Audit log viewer UI (basic)

**Commit:** `feat: add comprehensive audit logging system`

---

## Step 5.3: Advanced Analytics (Week 2, Days 8-10)

### 5.3.1: Time-Series Data (Day 8)

**Objective:** Track metrics over time

**Schema Update:**
```typescript
evaluationMetrics: defineTable({
  tenantId: v.id("tenants"),
  versionId: v.id("agentVersions"),
  suiteId: v.id("evaluationSuites"),
  runId: v.id("evaluationRuns"),
  timestamp: v.number(),
  metrics: v.object({
    overallScore: v.number(),
    passRate: v.number(),
    avgExecutionTime: v.number(),
    testCaseCount: v.number(),
    passedCount: v.number(),
    failedCount: v.number(),
  }),
  period: v.string(),                  // "daily", "weekly", "monthly"
}).index("by_tenant", ["tenantId"])
  .index("by_version", ["versionId"])
  .index("by_suite", ["suiteId"])
  .index("by_timestamp", ["tenantId", "timestamp"]),
```

**Files to Create:**

**1. `convex/evaluationMetrics.ts`**
```typescript
// Queries
export const getTimeSeries = query(...)  // Get metrics over time
export const getByVersion = query(...)   // Get version metrics
export const getBySuite = query(...)     // Get suite metrics
export const getAggregated = query(...)  // Get aggregated metrics

// Mutations
export const record = mutation(...)      // Record metrics
export const aggregate = mutation(...)   // Aggregate metrics
```

**2. `convex/lib/metricsAggregator.ts`**
```typescript
// Aggregate metrics from runs
export async function aggregateMetrics(
  ctx: MutationCtx,
  period: "daily" | "weekly" | "monthly"
): Promise<void>

// Calculate trends
export async function calculateTrends(
  ctx: QueryCtx,
  versionId: Id<"agentVersions">,
  days: number
): Promise<TrendData>
```

**Deliverables:**
- Time-series schema
- Metrics CRUD operations
- Aggregation logic
- Trend calculation

**Commit:** `feat: add time-series metrics tracking`

---

### 5.3.2: Comparison Views (Day 9)

**Objective:** Compare versions, suites, runs

**Files to Create:**

**1. `convex/analytics.ts`**
```typescript
// Queries
export const compareVersions = query(...)  // Compare 2+ versions
export const compareSuites = query(...)    // Compare 2+ suites
export const compareRuns = query(...)      // Compare 2+ runs

// Types
interface ComparisonResult {
  items: Array<{
    id: Id<any>,
    name: string,
    metrics: Metrics,
    rank: number,
    percentDiff: number,
  }>,
  winner: Id<any>,
  insights: string[],
}
```

**2. `ui/src/components/ComparisonView.tsx`**
```typescript
// Comparison UI component
- Side-by-side comparison
- Metric differences highlighted
- Winner indication
- Trend lines
```

**Deliverables:**
- Comparison queries
- Comparison UI component
- Insights generation
- Export functionality

**Commit:** `feat: add comparison views for versions and suites`

---

### 5.3.3: Trend Analysis (Day 10)

**Objective:** Identify patterns and anomalies

**Files to Create:**

**1. `convex/lib/trendAnalysis.ts`**
```typescript
// Trend detection
export function detectTrend(
  data: number[]
): "improving" | "declining" | "stable"

// Anomaly detection
export function detectAnomalies(
  data: number[],
  threshold: number
): number[]

// Forecast
export function forecast(
  data: number[],
  periods: number
): number[]
```

**2. `ui/src/components/TrendChart.tsx`**
```typescript
// Trend visualization
- Line charts
- Trend indicators
- Anomaly markers
- Forecast overlay
```

**Deliverables:**
- Trend analysis algorithms
- Anomaly detection
- Trend visualization
- Insights dashboard

**Commit:** `feat: add trend analysis and forecasting`

---

## Step 5.4: Custom Scoring (Week 3, Days 11-15)

### 5.4.1: Function Registry (Day 11-12)

**Objective:** Store and manage custom scoring functions

**Schema Update:**
```typescript
customScoringFunctions: defineTable({
  tenantId: v.id("tenants"),
  name: v.string(),
  description: v.string(),
  code: v.string(),                    // JavaScript function code
  language: v.string(),                // "javascript"
  version: v.number(),
  isActive: v.boolean(),
  createdBy: v.id("operators"),
  createdAt: v.number(),
  updatedAt: v.number(),
  metadata: v.object({
    parameters: v.array(v.object({
      name: v.string(),
      type: v.string(),
      required: v.boolean(),
      default: v.optional(v.any()),
    })),
    returnType: v.string(),
    examples: v.array(v.object({
      input: v.any(),
      expectedOutput: v.any(),
      score: v.number(),
    })),
  }),
}).index("by_tenant", ["tenantId"])
  .index("by_name", ["tenantId", "name"])
  .index("by_active", ["tenantId", "isActive"]),
```

**Files to Create:**

**1. `convex/customScoringFunctions.ts`**
```typescript
// Queries
export const list = query(...)           // List functions
export const get = query(...)            // Get function
export const getActive = query(...)      // Get active functions

// Mutations
export const create = mutation(...)      // Create function
export const update = mutation(...)      // Update function
export const activate = mutation(...)    // Activate function
export const deactivate = mutation(...) // Deactivate function
export const remove = mutation(...)      // Delete function
```

**Deliverables:**
- Custom function schema
- Function CRUD operations
- Versioning support
- Validation

**Commit:** `feat: add custom scoring function registry`

---

### 5.4.2: Execution Sandbox (Day 13-14)

**Objective:** Safely execute custom functions

**Files to Create:**

**1. `convex/lib/scoringSandbox.ts`**
```typescript
// Safe execution environment
export async function executeCustomFunction(
  functionCode: string,
  input: any,
  expectedOutput: any,
  actualOutput: any
): Promise<number> {
  // Parse and validate function
  // Execute in isolated context
  // Return score (0-1)
}

// Validation
export function validateFunction(
  code: string
): { valid: boolean; errors: string[] }

// Testing
export async function testFunction(
  code: string,
  testCases: Array<{input: any; expected: any; actual: any}>
): Promise<Array<{passed: boolean; score: number; error?: string}>>
```

**Security Measures:**
- Timeout limits (5 seconds)
- No external network access
- No file system access
- Memory limits
- CPU limits
- Whitelist allowed APIs

**Deliverables:**
- Sandbox execution environment
- Function validation
- Test harness
- Security controls

**Commit:** `feat: implement custom function execution sandbox`

---

### 5.4.3: UI for Custom Functions (Day 15)

**Objective:** UI to create and manage custom functions

**Files to Create:**

**1. `ui/src/components/CustomFunctionEditor.tsx`**
```typescript
// Code editor with syntax highlighting
// Parameter configuration
// Test case management
// Validation feedback
// Preview/test execution
```

**2. `ui/src/views/CustomFunctionsView.tsx`**
```typescript
// List custom functions
// Create/edit/delete
// Activate/deactivate
// Test runner
// Usage statistics
```

**Deliverables:**
- Code editor component
- Function management UI
- Test interface
- Documentation

**Commit:** `feat: add UI for custom scoring functions`

---

## Step 5.5: Notifications (Week 3-4, Days 16-20)

### 5.5.1: Event System (Day 16-17)

**Objective:** Event-driven notification system

**Schema Update:**
```typescript
notificationEvents: defineTable({
  tenantId: v.id("tenants"),
  type: v.string(),                    // "EVAL_COMPLETED", "VERSION_APPROVED"
  resourceType: v.string(),            // "evaluationRun", "agentVersion"
  resourceId: v.string(),
  payload: v.any(),
  timestamp: v.number(),
  processed: v.boolean(),
}).index("by_tenant", ["tenantId"])
  .index("by_type", ["type"])
  .index("by_processed", ["processed"]),

notifications: defineTable({
  tenantId: v.id("tenants"),
  operatorId: v.id("operators"),
  eventId: v.id("notificationEvents"),
  title: v.string(),
  message: v.string(),
  severity: v.union(
    v.literal("INFO"),
    v.literal("SUCCESS"),
    v.literal("WARNING"),
    v.literal("ERROR")
  ),
  read: v.boolean(),
  readAt: v.optional(v.number()),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
}).index("by_operator", ["operatorId"])
  .index("by_read", ["operatorId", "read"])
  .index("by_created", ["operatorId", "createdAt"]),
```

**Event Types:**
```typescript
// Evaluation Events
"EVAL_RUN_COMPLETED"
"EVAL_RUN_FAILED"
"EVAL_SUITE_CREATED"

// Version Events
"VERSION_CREATED"
"VERSION_APPROVED"
"VERSION_REJECTED"
"VERSION_DEPLOYED"

// Instance Events
"INSTANCE_STARTED"
"INSTANCE_STOPPED"
"INSTANCE_ERROR"

// Policy Events
"POLICY_VIOLATION"
"APPROVAL_REQUIRED"
"APPROVAL_GRANTED"
"APPROVAL_DENIED"
```

**Files to Create:**

**1. `convex/notificationEvents.ts`**
```typescript
// Mutations
export const emit = mutation(...)        // Emit event
export const process = mutation(...)     // Process event

// Queries
export const getPending = query(...)     // Get unprocessed events
```

**2. `convex/notifications.ts`**
```typescript
// Queries
export const list = query(...)           // List notifications
export const getUnread = query(...)      // Get unread
export const getCount = query(...)       // Get unread count

// Mutations
export const create = mutation(...)      // Create notification
export const markRead = mutation(...)    // Mark as read
export const markAllRead = mutation(...) // Mark all read
export const remove = mutation(...)      // Delete notification
```

**3. `convex/notificationCron.ts`**
```typescript
// Process events and create notifications
export const processEvents = internalAction(...)
```

**Deliverables:**
- Event schema
- Notification schema
- Event emission
- Notification creation
- Cron job for processing

**Commit:** `feat: add event-driven notification system`

---

### 5.5.2: Notification Preferences (Day 18)

**Objective:** User-configurable notification settings

**Schema Update:**
```typescript
notificationPreferences: defineTable({
  operatorId: v.id("operators"),
  eventType: v.string(),
  enabled: v.boolean(),
  channels: v.array(v.string()),       // ["in-app", "email"]
  frequency: v.string(),               // "immediate", "daily", "weekly"
}).index("by_operator", ["operatorId"])
  .index("by_event", ["operatorId", "eventType"]),
```

**Files to Create:**

**1. `convex/notificationPreferences.ts`**
```typescript
// Queries
export const get = query(...)            // Get preferences
export const getByEvent = query(...)     // Get event preferences

// Mutations
export const set = mutation(...)         // Set preference
export const setAll = mutation(...)      // Set all preferences
export const reset = mutation(...)       // Reset to defaults
```

**2. `ui/src/components/NotificationSettings.tsx`**
```typescript
// Notification preferences UI
- Toggle per event type
- Channel selection
- Frequency selection
- Test notification
```

**Deliverables:**
- Preferences schema
- Preferences CRUD
- Settings UI
- Default preferences

**Commit:** `feat: add notification preferences`

---

### 5.5.3: Delivery Channels (Day 19-20)

**Objective:** Multiple notification delivery methods

**Files to Create:**

**1. `ui/src/components/NotificationCenter.tsx`**
```typescript
// In-app notification center
- Notification list
- Unread badge
- Mark as read
- Delete
- Filter by type
```

**2. `ui/src/components/NotificationBell.tsx`**
```typescript
// Notification bell icon
- Unread count badge
- Dropdown with recent notifications
- Link to notification center
```

**3. `convex/lib/notificationDelivery.ts`**
```typescript
// Delivery methods
export async function deliverInApp(...)  // In-app notification
export async function deliverEmail(...)  // Email (stub)
export async function deliverWebhook(...) // Webhook (stub)
```

**Deliverables:**
- In-app notification UI
- Notification bell component
- Delivery infrastructure
- Email/webhook stubs

**Commit:** `feat: add notification delivery channels`

---

## Testing Strategy

### Unit Tests
- RBAC permission checks
- Tenant isolation validation
- Custom function execution
- Notification event processing

### Integration Tests
- End-to-end RBAC flows
- Cross-tenant access attempts
- Custom function lifecycle
- Notification delivery

### Security Tests
- Permission bypass attempts
- Tenant boundary violations
- Custom function exploits
- Audit log completeness

---

## Documentation

### API Documentation
- RBAC endpoints
- Analytics queries
- Custom function API
- Notification API

### User Guides
- Role management
- Permission configuration
- Custom function creation
- Notification settings

### Security Documentation
- RBAC model
- Tenant isolation
- Audit logging
- Custom function security

---

## Success Criteria

### RBAC
- ✅ All operations require appropriate permissions
- ✅ System roles (admin, operator, viewer) work correctly
- ✅ Custom roles can be created and assigned
- ✅ Permission checks are enforced consistently

### Tenant Isolation
- ✅ No cross-tenant data access possible
- ✅ All queries scoped to correct tenant
- ✅ Audit logs capture access attempts
- ✅ Error messages don't leak information

### Analytics
- ✅ Time-series data tracked accurately
- ✅ Comparison views show meaningful insights
- ✅ Trend analysis detects patterns
- ✅ Forecasting provides reasonable predictions

### Custom Scoring
- ✅ Functions can be created and tested
- ✅ Execution is safe and sandboxed
- ✅ Functions integrate with evaluation runs
- ✅ Performance is acceptable (<5s per test case)

### Notifications
- ✅ Events trigger notifications correctly
- ✅ Preferences control delivery
- ✅ In-app notifications work
- ✅ Unread count updates in real-time

---

## Phase 3.0 Completion Checklist

- [ ] All RBAC features implemented
- [ ] Tenant isolation enforced
- [ ] Advanced analytics working
- [ ] Custom scoring functional
- [ ] Notification system operational
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] User acceptance testing complete

---

**Next Phase:** Phase 4.0 - Production Readiness (handled by Claude Code)

**Created:** February 10, 2026  
**Version:** 1.0  
**Status:** 🚀 Ready to Start
