# ARM - AI Operating Manual

**READ THIS FIRST EVERY SESSION**

This file contains rules, constraints, and patterns that AI must follow when working on ARM.

---

## Project Identity

**Name:** ARM (Agent Resource Management)  
**Purpose:** Enterprise system of record for AI agent fleets  
**Current Phase:** P1.1 Complete ✅, P1.2 Next  
**Tech Stack:** Convex + React + TypeScript + Tailwind  

---

## Critical Rules (NEVER VIOLATE)

### 1. Immutable Version Genome
❌ **FORBIDDEN:** Mutating `genome` or `genomeHash` fields in agentVersions  
✅ **REQUIRED:** Create new version with `parentVersionId` for any genome change  
✅ **REQUIRED:** Compute SHA-256 hash on version creation  

**Why:** Version integrity depends on immutability. Tampering detection requires stable hashes.

---

### 2. Documentation First, Code Second
❌ **FORBIDDEN:** Writing code before updating relevant docs  
✅ **REQUIRED:** Update PRD.md, APP_FLOW.md, or BACKEND_STRUCTURE.md first  
✅ **REQUIRED:** Update progress.txt after completing any step  

**Why:** Documentation is the source of truth. Code implements docs, not the other way around.

---

### 3. Change Records for All Mutations
❌ **FORBIDDEN:** Mutations without corresponding change record  
✅ **REQUIRED:** Write ChangeRecord after every insert/update/delete  
✅ **REQUIRED:** Use correct event type from taxonomy  

**Why:** Audit trail is non-negotiable for compliance and debugging.

---

### 4. No Forbidden Dependencies
❌ **FORBIDDEN:** Redux, Apollo, Axios, Lodash, Moment.js, jQuery, Bootstrap, Material-UI  
✅ **ALLOWED:** Only dependencies in TECH_STACK.md  
✅ **REQUIRED:** Ask before adding new dependencies  

**Why:** Keep bundle small, avoid conflicts with Convex patterns.

---

### 5. Semantic Tailwind Tokens Only
❌ **FORBIDDEN:** `bg-gray-900`, `text-white`, `border-gray-700`  
✅ **REQUIRED:** `bg-arm-surface`, `text-arm-text`, `border-arm-border`  

**Why:** Consistent theming, easy to change colors globally.

---

## Tech Stack (Locked)

### Frontend
- React 18.2.0
- React Router DOM 6.22.0
- Convex 1.9.0
- Tailwind CSS 3.4.1
- Vite 5.1.0
- TypeScript 5.3.3

### Backend
- Convex (latest)
- Web Crypto API (SHA-256)

### Package Manager
- pnpm 10.15.0+

**Never add dependencies not listed in TECH_STACK.md without approval.**

---

## File Organization

### Naming Conventions
```
Components: PascalCase (VersionDrawer.tsx)
Views: PascalCase + View suffix (DirectoryView.tsx)
Utilities: camelCase (genomeHash.ts)
Types: PascalCase (version.ts exports AgentVersion)
```

### Import Order
```typescript
// 1. React
import { useState } from 'react'

// 2. External libraries
import { useQuery } from 'convex/react'

// 3. Convex generated
import { api } from '../../convex/_generated/api'

// 4. Local components
import { Sidebar } from './components/Sidebar'

// 5. Types
import { AgentVersion } from '@arm/shared'
```

### Component Structure
```typescript
// 1. Imports
// 2. Props interface
// 3. Component function
//    a. Hooks (useState, useQuery)
//    b. Event handlers
//    c. Render
// 4. Named export (no default exports)
```

---

## Convex Patterns

### Query Pattern
```typescript
export const functionName = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tableName")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
```

### Mutation Pattern
```typescript
export const functionName = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // 1. Validate
    // 2. Insert/update
    const id = await ctx.db.insert("tableName", data);
    
    // 3. Write change record (REQUIRED)
    await ctx.db.insert("changeRecords", {
      tenantId: args.tenantId,
      type: "EVENT_TYPE",
      targetEntity: "entityName",
      targetId: id,
      payload: {},
      timestamp: Date.now(),
    });
    
    return id;
  },
});
```

---

## UI Patterns

### Page Layout
```tsx
<div className="p-6">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-arm-text mb-2">Title</h1>
    <p className="text-arm-textMuted">Description</p>
  </div>

  {/* Content */}
  <div className="bg-arm-surfaceLight rounded-lg border border-arm-border">
    {/* Content */}
  </div>
</div>
```

### Status Chips
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-accent text-white">
  {status}
</span>
```

### Buttons
```tsx
// Primary
<button className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue">

// Secondary
<button className="px-4 py-2 border border-arm-border text-arm-text rounded hover:bg-arm-surface">

// Text
<button className="text-arm-accent hover:text-arm-blue">
```

---

## State Management

### Convex Queries (Data)
```tsx
const data = useQuery(api.module.function, { args })
```

### Local State (UI Only)
```tsx
const [isOpen, setIsOpen] = useState(false)
```

### No Global State
- No Redux, Zustand, or Context for data
- Convex handles all data state
- Local state for UI only (modals, tabs, etc.)

---

## Error Handling

### Queries
```tsx
if (data === undefined) return <LoadingSpinner />
if (data === null) return <NotFound />
return <Content data={data} />
```

### Mutations
```tsx
try {
  await mutation({ args })
  showToast('Success')
} catch (error) {
  showToast('Error: ' + error.message)
}
```

---

## Performance Rules

### Hash Verification
- ✅ **DO:** Verify on detail reads (`agentVersions.get()`)
- ❌ **DON'T:** Verify on list queries (`agentVersions.list()`)

**Why:** List queries can return 1000s of versions. Verification is O(n) per version.

### Indexing
- ✅ **DO:** Use `.withIndex()` for queries
- ❌ **DON'T:** Use `.filter()` for indexed fields

**Why:** Indexes are O(log n), filters are O(n).

### Memoization
- ✅ **DO:** Use `useMemo` for expensive computations
- ✅ **DO:** Use `useCallback` for callbacks passed to children
- ❌ **DON'T:** Memoize everything (premature optimization)

---

## Git Workflow

### Branch Strategy
```bash
main          # Production-ready code
develop       # Integration branch (future)
feature/*     # Feature branches
fix/*         # Bug fix branches
```

### Commit Frequency
- Commit after each logical step
- Small commits (1 feature/fix per commit)
- Never commit broken code

### Commit Messages
```bash
# Good
feat: add policy evaluation engine
fix: version drawer scroll issue

# Bad
update stuff
WIP
fixed bug
```

---

## Documentation Maintenance

### Update These Docs When:

**PRD.md:**
- Adding/removing features
- Changing scope
- Updating success criteria

**APP_FLOW.md:**
- Adding new views
- Changing navigation
- Adding user flows

**TECH_STACK.md:**
- Adding dependencies
- Upgrading versions
- Changing build tools

**FRONTEND_GUIDELINES.md:**
- Adding UI patterns
- Changing design system
- Adding components

**BACKEND_STRUCTURE.md:**
- Adding tables
- Changing schema
- Adding API contracts

**IMPLEMENTATION_PLAN.md:**
- Completing phases
- Adjusting timeline
- Adding/removing steps

**progress.txt:**
- After EVERY coding session
- After completing ANY step
- Before ending session

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Mutating genome
await ctx.db.patch(versionId, {
  genome: newGenome  // FORBIDDEN!
})

// Using wrong colors
<div className="bg-gray-900">  // Use bg-arm-surface

// Skipping change records
await ctx.db.insert("agentTemplates", data)
// Missing: change record write

// Any type
const data: any = {}  // Use proper types

// Default exports
export default function Component() {}  // Use named exports
```

### ✅ Do This Instead
```typescript
// Create new version for genome changes
await ctx.db.insert("agentVersions", {
  ...oldVersion,
  genome: newGenome,
  parentVersionId: oldVersionId
})

// Use semantic tokens
<div className="bg-arm-surface">

// Always write change records
await ctx.db.insert("agentTemplates", data)
await ctx.db.insert("changeRecords", { /* ... */ })

// Proper types
const data: AgentVersion = {}

// Named exports
export function Component() {}
```

---

## Session Workflow

### Starting a Session
1. Read `progress.txt` to see current status
2. Read relevant docs (PRD, APP_FLOW, etc.)
3. Check git status and recent commits
4. Identify next step from IMPLEMENTATION_PLAN.md
5. Start coding

### During Session
1. Follow patterns in this file
2. Reference FRONTEND_GUIDELINES.md and BACKEND_STRUCTURE.md
3. Write small, atomic commits
4. Test after each step

### Ending Session
1. Commit all work
2. Update `progress.txt` with status
3. Update IMPLEMENTATION_PLAN.md if timeline changed
4. Note any blockers or questions

---

## Quick Reference

### Create New Feature
1. Update PRD.md (add to scope)
2. Update APP_FLOW.md (add user flow)
3. Update BACKEND_STRUCTURE.md (add schema/API)
4. Implement schema in `convex/schema.ts`
5. Add types in `packages/shared/src/types/`
6. Implement Convex module
7. Implement UI component
8. Test manually
9. Update progress.txt
10. Commit with clear message

### Fix Bug
1. Reproduce bug
2. Identify root cause
3. Write fix
4. Test fix
5. Update progress.txt
6. Commit: `fix: description`

### Refactor Code
1. Identify code smell
2. Plan refactoring
3. Implement changes
4. Verify behavior unchanged
5. Update progress.txt
6. Commit: `refactor: description`

---

## Questions to Ask Before Coding

1. **Is this in scope?** Check PRD.md
2. **What's the user flow?** Check APP_FLOW.md
3. **What's the schema?** Check BACKEND_STRUCTURE.md
4. **What are the UI patterns?** Check FRONTEND_GUIDELINES.md
5. **Is this the right phase?** Check IMPLEMENTATION_PLAN.md
6. **What's the current status?** Check progress.txt

**If any answer is unclear, update the relevant doc first, then code.**

---

## Emergency Procedures

### If Build Breaks
1. Check TypeScript errors: `pnpm typecheck`
2. Check Convex logs: `npx convex logs`
3. Check browser console
4. Revert last commit if needed: `git revert HEAD`

### If Convex Deploy Fails
1. Check schema syntax
2. Check for breaking changes
3. Rollback schema in Convex dashboard
4. Fix locally and redeploy

### If UI Won't Load
1. Check .env.local has correct Convex URL
2. Check Convex dev server running
3. Check browser console for errors
4. Restart UI: `cd ui && pnpm dev`

---

## Contact & Resources

### Documentation
- [PRD.md](docs/PRD.md) - What we're building
- [APP_FLOW.md](docs/APP_FLOW.md) - User flows
- [TECH_STACK.md](docs/TECH_STACK.md) - Dependencies
- [FRONTEND_GUIDELINES.md](docs/FRONTEND_GUIDELINES.md) - UI patterns
- [BACKEND_STRUCTURE.md](docs/BACKEND_STRUCTURE.md) - Schema & API
- [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Build sequence

### External Resources
- [Convex Docs](https://docs.convex.dev)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)

---

**Last Updated:** February 10, 2026  
**Update This:** When patterns change or new rules added  
**Read This:** At the start of EVERY session
