# Convex Cron Jobs

**ARM Automated Processing**  
**Last Updated:** February 10, 2026  
**Version:** 1.0.0

---

## Overview

ARM uses Convex's built-in cron scheduler for automated background tasks. Cron jobs run on a schedule and process pending work without manual intervention.

---

## Active Cron Jobs

### 1. Process Evaluations

**Schedule:** Every 5 minutes  
**Function:** `internal.evaluationCron.processPendingEvaluations`  
**Purpose:** Execute pending evaluation runs

**What It Does:**
1. Queries all tenants
2. For each tenant, gets up to 5 pending evaluation runs
3. Executes each run via `evaluationActions.executeRun`
4. Updates run status and version evalStatus
5. Logs results

**Configuration:**
```typescript
// convex/crons.ts
crons.interval(
  "process-evaluations",
  { minutes: 5 },
  internal.evaluationCron.processPendingEvaluations
);
```

**Monitoring:**
```bash
# View cron logs in Convex dashboard
convex dashboard --prod

# Navigate to: Functions → Cron Jobs → process-evaluations
```

**Expected Output:**
```
🔄 Processing pending evaluations...
✅ Processed 2 runs for tenant: Acme Corp
✅ Processed 0 runs for tenant: Beta Inc
🎉 Cron complete: 2 total runs processed
```

---

## Planned Cron Jobs

### 2. Cleanup Old Evaluations (Future)

**Schedule:** Daily at 2 AM UTC  
**Function:** `internal.evaluationCron.cleanupOldRuns`  
**Purpose:** Archive completed runs older than 90 days

**Configuration (commented out):**
```typescript
crons.daily(
  "cleanup-old-evaluations",
  { hourUTC: 2, minuteUTC: 0 },
  internal.evaluationCron.cleanupOldRuns
);
```

### 3. Health Check (Future)

**Schedule:** Every 15 minutes  
**Function:** `internal.evaluationCron.healthCheck`  
**Purpose:** Monitor evaluation system health and alert on issues

---

## Cron Job Development

### Creating a New Cron Job

#### 1. Define the Internal Function

```typescript
// convex/yourCron.ts
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

export const yourCronFunction = internalAction({
  handler: async (ctx) => {
    console.log("🔄 Starting cron job...");
    
    // Your logic here
    
    console.log("🎉 Cron job complete");
    
    return { success: true };
  },
});
```

#### 2. Register in crons.ts

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "your-cron-name",
  { minutes: 10 },
  internal.yourCron.yourCronFunction
);

export default crons;
```

#### 3. Deploy

```bash
# Deploy to development
npx convex dev

# Deploy to production
convex deploy --prod
```

### Schedule Options

**Interval:**
```typescript
// Every N minutes
crons.interval("name", { minutes: 5 }, handler)

// Every N hours
crons.interval("name", { hours: 1 }, handler)
```

**Daily:**
```typescript
// Daily at specific time (UTC)
crons.daily("name", { hourUTC: 2, minuteUTC: 30 }, handler)
```

**Weekly:**
```typescript
// Weekly on specific day and time (UTC)
crons.weekly("name", {
  dayOfWeek: "monday",
  hourUTC: 9,
  minuteUTC: 0,
}, handler)
```

**Monthly:**
```typescript
// Monthly on specific day and time (UTC)
crons.monthly("name", {
  day: 1, // 1-31
  hourUTC: 0,
  minuteUTC: 0,
}, handler)
```

**Cron Expression:**
```typescript
// Custom cron expression
crons.cron("name", "0 */6 * * *", handler) // Every 6 hours
```

---

## Best Practices

### 1. Use Internal Functions

Cron jobs should call `internalAction` or `internalMutation`:

```typescript
// ✅ Good: Internal function
export const myCron = internalAction({ ... })

// ❌ Bad: Public action (security risk)
export const myCron = action({ ... })
```

### 2. Batch Processing

Process items in batches to avoid timeouts:

```typescript
export const processBatch = internalAction({
  handler: async (ctx) => {
    const items = await ctx.runQuery(api.items.getPending, {
      limit: 10, // Process 10 at a time
    });

    for (const item of items) {
      await processItem(item);
    }
  },
});
```

### 3. Error Handling

Handle errors gracefully and log them:

```typescript
export const myCron = internalAction({
  handler: async (ctx) => {
    try {
      // Process items
    } catch (error) {
      console.error("Cron error:", error);
      // Don't throw - let cron continue on next run
      return { success: false, error: (error as Error).message };
    }
  },
});
```

### 4. Idempotency

Ensure cron jobs can be run multiple times safely:

```typescript
// ✅ Good: Check if already processed
const item = await ctx.db.get(itemId);
if (item.processed) {
  console.log("Already processed, skipping");
  return;
}

// Process item
await processItem(item);

// Mark as processed
await ctx.db.patch(itemId, { processed: true });
```

### 5. Logging

Log progress for monitoring:

```typescript
export const myCron = internalAction({
  handler: async (ctx) => {
    console.log("🔄 Starting cron job");
    
    const items = await getItems();
    console.log(`📊 Found ${items.length} items to process`);
    
    for (const item of items) {
      console.log(`⚙️ Processing item: ${item.id}`);
      await processItem(item);
    }
    
    console.log("🎉 Cron job complete");
  },
});
```

---

## Monitoring

### View Cron Logs

```bash
# Open Convex dashboard
convex dashboard

# Navigate to: Functions → Cron Jobs
# Click on cron job name to view logs
```

### Check Cron Status

```bash
# List all cron jobs
convex crons list

# View specific cron job
convex crons get process-evaluations
```

### Manual Trigger

```bash
# Trigger cron job manually (for testing)
convex run internal:evaluationCron:processPendingEvaluations
```

---

## Troubleshooting

### Cron Job Not Running

**Possible Causes:**
1. Cron not deployed
2. Function error on execution
3. Convex dashboard shows error

**Solutions:**
```bash
# Redeploy
convex deploy

# Check logs
convex dashboard

# Test manually
convex run internal:evaluationCron:processPendingEvaluations
```

### Cron Job Timing Out

**Cause:** Processing too many items

**Solution:** Reduce batch size
```typescript
// Before
const items = await ctx.runQuery(api.items.getPending, { limit: 100 })

// After
const items = await ctx.runQuery(api.items.getPending, { limit: 10 })
```

### Cron Job Failing

**Cause:** Unhandled errors

**Solution:** Add error handling
```typescript
try {
  await processItem(item);
} catch (error) {
  console.error(`Failed to process ${item.id}:`, error);
  // Continue with next item
}
```

---

## Performance

### Execution Limits

**Convex Cron Limits:**
- **Timeout**: 10 minutes per execution
- **Frequency**: Minimum 1 minute interval
- **Concurrency**: 1 execution at a time per cron job

### Optimization

**Parallel Processing:**
```typescript
// Process items in parallel
const promises = items.map(item => processItem(item));
await Promise.all(promises);
```

**Early Exit:**
```typescript
// Exit early if no work
const pending = await ctx.runQuery(api.items.getPending);
if (pending.length === 0) {
  console.log("No pending items, exiting");
  return { processed: 0 };
}
```

---

## Security

### Internal Functions Only

Cron jobs should only call internal functions:

```typescript
// ✅ Good
export const myCron = internalAction({ ... })

// ❌ Bad
export const myCron = action({ ... }) // Publicly callable
```

### No User Input

Cron jobs run automatically without user input:

```typescript
// ✅ Good: No args
export const myCron = internalAction({
  handler: async (ctx) => { ... }
});

// ❌ Bad: Requires args
export const myCron = internalAction({
  args: { userId: v.id("users") }, // Who provides this?
  handler: async (ctx, args) => { ... }
});
```

---

## Testing

### Local Testing

```bash
# Start Convex dev server
npx convex dev

# In another terminal, trigger manually
npx convex run internal:evaluationCron:processPendingEvaluations

# View output in dev server logs
```

### Production Testing

```bash
# Trigger in production
convex run internal:evaluationCron:processPendingEvaluations --prod

# Monitor in dashboard
convex dashboard --prod
```

---

## References

- **Convex Cron Docs**: [docs.convex.dev/scheduling/cron-jobs](https://docs.convex.dev/scheduling/cron-jobs)
- **ARM Evaluation System**: [docs/API_REFERENCE.md](API_REFERENCE.md#evaluation-runs)
- **Convex Actions**: [docs.convex.dev/functions/actions](https://docs.convex.dev/functions/actions)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Team
