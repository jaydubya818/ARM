# Testing Guide

**ARM Testing Strategy**  
**Last Updated:** February 10, 2026  
**Version:** 1.0.0

---

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing](#manual-testing)
- [Test Data](#test-data)
- [CI/CD Integration](#cicd-integration)

---

## Overview

ARM follows a **pragmatic testing approach**:
- **Unit tests** for business logic (genome hashing, policy evaluation)
- **Integration tests** for Convex functions
- **E2E tests** for critical user flows
- **Manual testing** for UI/UX validation

**Current Status:** P1 (Walking Skeleton) - Manual testing only  
**Planned:** P2.0+ - Automated test suite

---

## Testing Philosophy

### Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  10% - Critical flows
        │   (Manual)  │
        ├─────────────┤
        │ Integration │  30% - Convex functions
        │   (Vitest)  │
        ├─────────────┤
        │    Unit     │  60% - Business logic
        │  (Vitest)   │
        └─────────────┘
```

### Testing Principles

1. **Test Behavior, Not Implementation**
   - ✅ "Version creation computes correct hash"
   - ❌ "computeGenomeHash() calls createHash()"

2. **Arrange-Act-Assert Pattern**
   ```typescript
   test("policy evaluation denies unlisted tools", () => {
     // Arrange
     const policy = { allowedTools: ["tool-a"], autonomyTier: 3 }
     const request = { toolId: "tool-b" }
     
     // Act
     const result = evaluatePolicy(request, policy)
     
     // Assert
     expect(result.decision).toBe("DENY")
   })
   ```

3. **Isolation**: Each test is independent
4. **Determinism**: Tests always produce same result
5. **Fast**: Unit tests run in milliseconds

---

## Test Types

### 1. Unit Tests

**Purpose:** Test pure functions in isolation

**Location:** `convex/lib/*.test.ts`

**Examples:**
- Genome hashing
- Policy evaluation
- State machine validation
- Approval logic

### 2. Integration Tests

**Purpose:** Test Convex functions with database

**Location:** `convex/*.test.ts`

**Examples:**
- CRUD operations
- State transitions
- Change record creation
- Query filtering

### 3. End-to-End Tests

**Purpose:** Test complete user flows

**Location:** `tests/e2e/*.spec.ts`

**Examples:**
- Create template → version → instance
- Policy evaluation → approval workflow
- Version transition with integrity check

### 4. Manual Tests

**Purpose:** UI/UX validation

**Location:** Manual test plan (below)

---

## Unit Testing

### Setup

```bash
# Install Vitest
pnpm add -D vitest @vitest/ui

# Add test script to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Example: Genome Hashing

```typescript
// convex/lib/genomeHash.test.ts
import { describe, it, expect } from 'vitest'
import { computeGenomeHash, canonicalizeGenome } from './genomeHash'

describe('genomeHash', () => {
  describe('canonicalizeGenome', () => {
    it('sorts keys alphabetically', () => {
      const genome = {
        toolManifest: [],
        modelConfig: {},
        promptBundleHash: "abc",
      }
      
      const canonical = canonicalizeGenome(genome)
      const keys = Object.keys(JSON.parse(canonical))
      
      expect(keys).toEqual(['modelConfig', 'promptBundleHash', 'toolManifest'])
    })

    it('produces same output for equivalent genomes', () => {
      const genome1 = { a: 1, b: 2 }
      const genome2 = { b: 2, a: 1 }
      
      expect(canonicalizeGenome(genome1)).toBe(canonicalizeGenome(genome2))
    })
  })

  describe('computeGenomeHash', () => {
    it('produces 64-character hex string', () => {
      const genome = {
        modelConfig: { provider: "anthropic", model: "claude-3" },
        promptBundleHash: "abc123",
        toolManifest: [],
      }
      
      const hash = computeGenomeHash(genome)
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produces same hash for same genome', () => {
      const genome = { modelConfig: {}, promptBundleHash: "abc", toolManifest: [] }
      
      const hash1 = computeGenomeHash(genome)
      const hash2 = computeGenomeHash(genome)
      
      expect(hash1).toBe(hash2)
    })

    it('produces different hash for different genomes', () => {
      const genome1 = { modelConfig: {}, promptBundleHash: "abc", toolManifest: [] }
      const genome2 = { modelConfig: {}, promptBundleHash: "xyz", toolManifest: [] }
      
      const hash1 = computeGenomeHash(genome1)
      const hash2 = computeGenomeHash(genome2)
      
      expect(hash1).not.toBe(hash2)
    })
  })
})
```

### Example: Policy Evaluation

```typescript
// convex/lib/policyEvaluator.test.ts
import { describe, it, expect } from 'vitest'
import { evaluatePolicy } from './policyEvaluator'

describe('policyEvaluator', () => {
  describe('evaluatePolicy', () => {
    it('allows tool in whitelist', () => {
      const policy = {
        allowedTools: ["zendesk_search"],
        autonomyTier: 3,
      }
      const request = { toolId: "zendesk_search" }
      
      const result = evaluatePolicy(request, policy)
      
      expect(result.decision).toBe("ALLOW")
    })

    it('denies tool not in whitelist', () => {
      const policy = {
        allowedTools: ["zendesk_search"],
        autonomyTier: 3,
      }
      const request = { toolId: "database_delete" }
      
      const result = evaluatePolicy(request, policy)
      
      expect(result.decision).toBe("DENY")
      expect(result.violations).toContain("Tool 'database_delete' not in allowed tools list")
    })

    it('denies when daily token limit exceeded', () => {
      const policy = {
        allowedTools: ["api_call"],
        autonomyTier: 3,
        costLimits: { dailyTokens: 1000 },
      }
      const request = {
        toolId: "api_call",
        dailyTokensUsed: 900,
        estimatedCost: 200,
      }
      
      const result = evaluatePolicy(request, policy)
      
      expect(result.decision).toBe("DENY")
      expect(result.reason).toContain("Daily token limit")
    })

    it('requires approval for critical risk at tier 1', () => {
      const policy = {
        allowedTools: ["database_delete"],
        autonomyTier: 1,
      }
      const request = { toolId: "database_delete" }
      
      const result = evaluatePolicy(request, policy)
      
      expect(result.decision).toBe("NEEDS_APPROVAL")
      expect(result.riskLevel).toBe("critical")
    })
  })
})
```

---

## Integration Testing

### Setup

```bash
# Convex provides test helpers
pnpm add -D convex-test
```

### Example: Version CRUD

```typescript
// convex/agentVersions.test.ts
import { convexTest } from "convex-test"
import { describe, it, expect } from "vitest"
import schema from "./schema"
import { create, get, transition } from "./agentVersions"

describe("agentVersions", () => {
  it("creates version with computed hash", async () => {
    const t = convexTest(schema)
    
    // Arrange
    const tenantId = await t.run(async (ctx) => {
      return await ctx.db.insert("tenants", { name: "Test", slug: "test" })
    })
    
    const templateId = await t.run(async (ctx) => {
      return await ctx.db.insert("agentTemplates", {
        tenantId,
        name: "Test Template",
        owners: [],
        tags: [],
      })
    })
    
    // Act
    const versionId = await t.mutation(create, {
      templateId,
      tenantId,
      versionLabel: "v1.0.0",
      genome: {
        modelConfig: { provider: "anthropic", model: "claude-3" },
        promptBundleHash: "abc123",
        toolManifest: [],
      },
    })
    
    // Assert
    const result = await t.query(get, { versionId })
    expect(result.integrityStatus).toBe("VALID")
    expect(result.version.genomeHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("validates state transitions", async () => {
    const t = convexTest(schema)
    
    // Create version in DRAFT state
    const versionId = await t.mutation(create, { /* ... */ })
    
    // Act: Try invalid transition
    const promise = t.mutation(transition, {
      versionId,
      newState: "APPROVED", // Invalid: DRAFT → APPROVED
    })
    
    // Assert
    await expect(promise).rejects.toThrow("Cannot transition")
  })
})
```

---

## End-to-End Testing

### Setup (Playwright)

```bash
# Install Playwright
pnpm add -D @playwright/test

# Initialize
npx playwright install
```

### Example: Create Template Flow

```typescript
// tests/e2e/create-template.spec.ts
import { test, expect } from '@playwright/test'

test('create template flow', async ({ page }) => {
  // Navigate to directory
  await page.goto('http://localhost:5173/directory')
  
  // Click create button
  await page.click('button:has-text("Create Template")')
  
  // Fill form
  await page.fill('input[name="name"]', 'Test Template')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="owners"]', 'test@example.com')
  await page.fill('input[name="tags"]', 'test, automation')
  
  // Submit
  await page.click('button:has-text("Create Template")')
  
  // Verify success toast
  await expect(page.locator('text=Template created successfully')).toBeVisible()
  
  // Verify template appears in list
  await expect(page.locator('text=Test Template')).toBeVisible()
})
```

### Example: Approval Workflow

```typescript
// tests/e2e/approval-workflow.spec.ts
import { test, expect } from '@playwright/test'

test('approval workflow', async ({ page }) => {
  // Navigate to approvals
  await page.goto('http://localhost:5173/approvals')
  
  // Verify pending count
  const pendingBadge = page.locator('text=/\\d+ Pending/')
  await expect(pendingBadge).toBeVisible()
  
  // Click approve on first pending
  await page.click('button:has-text("Approve"):first')
  
  // Enter reason
  await page.fill('input[type="text"]', 'Approved for testing')
  await page.click('button:has-text("OK")')
  
  // Verify success toast
  await expect(page.locator('text=Request approved successfully')).toBeVisible()
  
  // Verify status updated
  await page.click('button:has-text("APPROVED")')
  await expect(page.locator('text=APPROVED').first()).toBeVisible()
})
```

---

## Manual Testing

### Test Plan

#### 1. Template Management

- [ ] **Create Template**
  - Navigate to Directory → Templates
  - Click "Create Template"
  - Fill form with valid data
  - Submit
  - Verify template appears in list
  - Verify toast notification

- [ ] **Create Template (Validation)**
  - Try duplicate name → Error
  - Try invalid email → Error
  - Try empty owners → Error

#### 2. Version Management

- [ ] **Create Version**
  - Navigate to Directory → Versions
  - Click "Create Version"
  - Select template
  - Enter version label (v1.0.0)
  - Configure model
  - Add tools
  - Submit
  - Verify version appears in list

- [ ] **View Version Details**
  - Click "View Details" on version
  - Verify drawer opens
  - Check genome display
  - Check computed hash matches
  - Check integrity status is VALID
  - Check lineage (if parent exists)
  - Check change history

- [ ] **Version State Transition**
  - Open version drawer
  - Transition DRAFT → TESTING
  - Verify state updates
  - Try invalid transition (DRAFT → APPROVED)
  - Verify error message

#### 3. Policy Management

- [ ] **Create Policy**
  - Navigate to Policies
  - Click "Create Policy"
  - Enter name
  - Select autonomy tier (0-5)
  - Add allowed tools (comma-separated)
  - Add cost limits (optional)
  - Submit
  - Verify policy appears in list

- [ ] **Delete Policy**
  - Click "Delete" on policy
  - Confirm deletion
  - Verify policy removed
  - Verify toast notification

#### 4. Approval Workflow

- [ ] **View Approvals**
  - Navigate to Approvals
  - Verify pending count badge
  - Filter by status (ALL, PENDING, APPROVED, DENIED)
  - Verify list updates

- [ ] **Approve Request**
  - Click "Approve" on pending request
  - Enter reason (optional)
  - Verify status changes to APPROVED
  - Verify toast notification

- [ ] **Deny Request**
  - Click "Deny" on pending request
  - Enter reason (optional)
  - Verify status changes to DENIED

- [ ] **Cancel Request**
  - Click "Cancel" on pending request
  - Enter reason (optional)
  - Verify status changes to CANCELLED

#### 5. Search and Filters

- [ ] **Search Templates**
  - Navigate to Directory → Templates
  - Enter search query
  - Verify filtered results

- [ ] **Search Versions**
  - Navigate to Directory → Versions
  - Enter search query (version label or hash)
  - Verify filtered results

- [ ] **Filter Versions by Status**
  - Select status filter (DRAFT, TESTING, etc.)
  - Verify filtered results

- [ ] **Filter Instances by Status**
  - Navigate to Directory → Instances
  - Select status filter
  - Verify filtered results

#### 6. Error Handling

- [ ] **Network Error**
  - Disconnect internet
  - Try to load data
  - Verify error message

- [ ] **Invalid Input**
  - Try to create version with invalid semver
  - Verify validation error
  - Try to create policy with tier > 5
  - Verify validation error

- [ ] **Error Boundary**
  - Trigger React error (modify code to throw)
  - Verify error boundary catches it
  - Verify error UI displays
  - Click "Try Again"
  - Verify recovery

---

## Test Data

### Seed Script

```bash
# Run seed script
npx convex run seedARM

# This creates:
# - 1 tenant (Acme Corp)
# - 1 environment (production)
# - 1 operator (ops@acme.com)
# - 1 provider (local)
# - 2 templates (Customer Support, Code Review)
# - 4 versions (v1.0.0, v1.1.0, v2.0.0, v2.1.0)
# - 2 instances (ACTIVE, QUARANTINED)
```

### Test Data Guidelines

**Use realistic data:**
- ✅ Real-looking names ("Customer Support Agent")
- ✅ Valid email addresses ("ops@acme.com")
- ✅ Realistic version labels ("v1.0.0")
- ❌ Generic names ("Test 1", "Test 2")

**Cover edge cases:**
- Empty lists
- Maximum values
- Minimum values
- Special characters
- Unicode characters

---

## CI/CD Integration

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Build
        run: cd ui && pnpm build
```

### Pre-commit Hooks (Future)

```bash
# Install husky
pnpm add -D husky

# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit "pnpm lint && pnpm test"
```

---

## Testing Checklist

### Before Committing

- [ ] All linter errors resolved (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Manual testing completed
- [ ] No console errors in browser
- [ ] Toast notifications work
- [ ] Loading states display correctly
- [ ] Empty states display correctly

### Before Merging PR

- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Branch up to date with `main`

---

## Test Coverage Goals

### Current (P1)

- **Unit Tests**: 0% (planned for P2.0)
- **Integration Tests**: 0% (planned for P2.0)
- **E2E Tests**: 0% (planned for P2.0)
- **Manual Tests**: 100% (all features manually tested)

### Target (P2.0+)

- **Unit Tests**: 80%+ for business logic
- **Integration Tests**: 70%+ for Convex functions
- **E2E Tests**: 90%+ for critical flows
- **Manual Tests**: 100% for UI/UX

---

## Common Test Patterns

### 1. Testing Mutations

```typescript
test("creates change record", async () => {
  const t = convexTest(schema)
  
  // Create entity
  const id = await t.mutation(create, { /* args */ })
  
  // Verify change record exists
  const changes = await t.run(async (ctx) => {
    return await ctx.db
      .query("changeRecords")
      .withIndex("by_target", (q) =>
        q.eq("targetEntity", "template").eq("targetId", id)
      )
      .collect()
  })
  
  expect(changes).toHaveLength(1)
  expect(changes[0].type).toBe("TEMPLATE_CREATED")
})
```

### 2. Testing Queries

```typescript
test("filters by tenant", async () => {
  const t = convexTest(schema)
  
  // Create data for two tenants
  const tenant1 = await t.run(async (ctx) => {
    return await ctx.db.insert("tenants", { name: "Tenant 1", slug: "t1" })
  })
  
  const tenant2 = await t.run(async (ctx) => {
    return await ctx.db.insert("tenants", { name: "Tenant 2", slug: "t2" })
  })
  
  await t.run(async (ctx) => {
    await ctx.db.insert("agentTemplates", { tenantId: tenant1, name: "T1", owners: [], tags: [] })
    await ctx.db.insert("agentTemplates", { tenantId: tenant2, name: "T2", owners: [], tags: [] })
  })
  
  // Query for tenant 1
  const templates = await t.query(list, { tenantId: tenant1 })
  
  // Verify isolation
  expect(templates).toHaveLength(1)
  expect(templates[0].name).toBe("T1")
})
```

### 3. Testing State Machines

```typescript
test("validates state transition", async () => {
  const { validateVersionTransition } = await import("./lib/approvalEngine")
  
  // Valid transition
  const valid = validateVersionTransition("DRAFT", "TESTING", "NOT_RUN")
  expect(valid.valid).toBe(true)
  
  // Invalid transition
  const invalid = validateVersionTransition("DRAFT", "APPROVED", "NOT_RUN")
  expect(invalid.valid).toBe(false)
  expect(invalid.error).toContain("Cannot transition")
  
  // Guard violation
  const guardViolation = validateVersionTransition("TESTING", "CANDIDATE", "NOT_RUN")
  expect(guardViolation.valid).toBe(false)
  expect(guardViolation.error).toContain("passing evaluation")
})
```

---

## Performance Testing

### Load Testing (Future)

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/create-versions.js
```

### Example Load Test

```javascript
// tests/load/create-versions.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
}

export default function () {
  const payload = JSON.stringify({
    templateId: 'template-id',
    versionLabel: `v1.0.${__VU}`,
    genome: { /* ... */ },
  })
  
  const res = http.post('https://your-project.convex.cloud/api/agentVersions/create', payload)
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

---

## Debugging Tests

### Enable Debug Logging

```typescript
// In test file
import { convexTest } from "convex-test"

const t = convexTest(schema, {
  debug: true, // Enable debug logging
})
```

### Inspect Database State

```typescript
test("debug database state", async () => {
  const t = convexTest(schema)
  
  // ... test logic ...
  
  // Inspect database
  const allTemplates = await t.run(async (ctx) => {
    return await ctx.db.query("agentTemplates").collect()
  })
  
  console.log("Templates:", allTemplates)
})
```

---

## Best Practices

### 1. Test Names

```typescript
// ✅ Good: Descriptive, behavior-focused
test("creates version with computed genome hash")
test("denies tool not in policy whitelist")
test("requires approval for critical risk at tier 1")

// ❌ Bad: Vague, implementation-focused
test("create function works")
test("policy evaluation")
test("test 1")
```

### 2. Test Organization

```typescript
// ✅ Good: Grouped by feature
describe("policyEvaluator", () => {
  describe("evaluatePolicy", () => {
    it("allows whitelisted tools", () => { /* ... */ })
    it("denies non-whitelisted tools", () => { /* ... */ })
  })
  
  describe("classifyRisk", () => {
    it("classifies database_delete as critical", () => { /* ... */ })
  })
})

// ❌ Bad: Flat structure
test("test 1", () => { /* ... */ })
test("test 2", () => { /* ... */ })
```

### 3. Assertions

```typescript
// ✅ Good: Specific assertions
expect(result.decision).toBe("DENY")
expect(result.violations).toHaveLength(1)
expect(result.violations[0]).toContain("not in allowed tools list")

// ❌ Bad: Vague assertions
expect(result).toBeTruthy()
expect(result.decision).not.toBe("ALLOW")
```

---

## Resources

- **Vitest Docs**: [vitest.dev](https://vitest.dev)
- **Playwright Docs**: [playwright.dev](https://playwright.dev)
- **Convex Testing**: [docs.convex.dev/testing](https://docs.convex.dev)
- **Testing Library**: [testing-library.com](https://testing-library.com)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Team
