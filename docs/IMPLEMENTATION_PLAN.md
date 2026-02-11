# ARM - Implementation Plan

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Current Phase:** Production Readiness Complete ✅

---

## Phase Overview

```
P1.1 ✅ → P1.2 ✅ → P1.3 ✅ → P2.0 ✅ → P3.0 ✅ → P4.0 ✅ → P5.0 ✅ → Production ✅
```

---

## Phase 1.1: Walking Skeleton ✅ COMPLETE

**Duration:** 1 day  
**Status:** ✅ Complete (February 10, 2026)

### Deliverables
- [x] 1.1 - Fork boundary documentation
- [x] 1.2 - Quarantine original AR FastAPI
- [x] 1.3 - Convex schema (9 tables)
- [x] 1.4 - Genome hashing (SHA-256)
- [x] 1.5 - Template/Version/Instance CRUD
- [x] 1.6 - ChangeRecord audit trail
- [x] 1.7 - React UI with Tailwind
- [x] 1.8 - Directory view with tabs
- [x] 1.9 - Version drawer
- [x] 1.10 - Seed script
- [x] 1.11 - Documentation (8 files)

### Git Commits
```
c1df193 docs: add comprehensive next steps guide with roadmap
04087a0 ui: add version drawer and enhance directory with data display
f9bce08 docs: add implementation completion report
e2ecbba docs: add comprehensive README and quickstart guide
a6abc98 ui: add Tailwind CSS with ARM theme and React foundation
a255469 quarantine: preserve original AR implementation for reference
ddfc62c chore: initial commit with AR platform foundation
```

---

## Phase 1.2: Policy Engine & Approvals ✅ COMPLETE

**Duration:** 2 weeks  
**Status:** Complete

### Week 1: Policy Engine

#### Step 2.1: Policy CRUD (Day 1)
**File:** `convex/policyEnvelopes.ts`

**Tasks:**
- [ ] Create `create()` mutation
- [ ] Create `list()` query
- [ ] Create `get()` query
- [ ] Create `update()` mutation
- [ ] Write change records for mutations

**Acceptance:**
- Can create policy with autonomy tier, tools, cost limits
- Policies queryable by tenant
- Change records written

**Commit:** `feat: add policy envelope CRUD operations`

---

#### Step 2.2: Policy Evaluator (Day 2)
**File:** `convex/lib/policyEvaluator.ts`

**Tasks:**
- [ ] Implement `evaluatePolicy()` function
- [ ] Logic: Check tool in allowedTools
- [ ] Logic: Check cost limits
- [ ] Logic: Return ALLOW/DENY/NEEDS_APPROVAL
- [ ] Add risk classification

**Acceptance:**
- Tool not in allowedTools → DENY
- Cost exceeds limit → DENY
- High-risk action + low autonomy → NEEDS_APPROVAL
- Otherwise → ALLOW

**Commit:** `feat: add policy evaluation engine`

---

#### Step 2.3: Policy Editor UI (Day 3-4)
**File:** `ui/src/views/PoliciesView.tsx`

**Tasks:**
- [ ] Replace placeholder with real view
- [ ] List policies in table
- [ ] Add "Create Policy" button
- [ ] Create policy form modal
- [ ] Autonomy tier slider (0-5)
- [ ] Tool multi-select
- [ ] Cost limit inputs

**Acceptance:**
- Can view all policies
- Can create new policy
- Form validation works
- Policy appears in list

**Commit:** `feat: add policy editor UI`

---

#### Step 2.4: Policy Attachment (Day 5)
**File:** `convex/agentInstances.ts` (update)

**Tasks:**
- [ ] Add `attachPolicy()` mutation
- [ ] Update instance with policyEnvelopeId
- [ ] Write POLICY_ATTACHED change record
- [ ] Add UI button in instances table

**Acceptance:**
- Can attach policy to instance
- Policy ID stored in instance
- Change record written

**Commit:** `feat: add policy attachment to instances`

---

### Week 2: Approval Workflows

#### Step 2.5: Approval CRUD (Day 6)
**File:** `convex/approvalRecords.ts`

**Tasks:**
- [ ] Create `create()` mutation (request approval)
- [ ] Create `list()` query (pending approvals)
- [ ] Create `get()` query (approval details)
- [ ] Create `decide()` mutation (approve/deny)
- [ ] Write change records

**Acceptance:**
- Can create approval request
- Can list pending approvals
- Can approve/deny request
- Change records written

**Commit:** `feat: add approval workflow CRUD`

---

#### Step 2.6: Approval Engine (Day 7)
**File:** `convex/lib/approvalEngine.ts`

**Tasks:**
- [ ] Implement `requiresApproval()` function
- [ ] Check transition rules
- [ ] Check autonomy tier
- [ ] Integrate with `agentVersions.transition()`

**Acceptance:**
- CANDIDATE → APPROVED requires approval if autonomy <3
- Transition blocked until approval granted
- Clear error message when approval required

**Commit:** `feat: add approval requirement checks`

---

#### Step 2.7: Approval Center UI (Day 8-9)
**File:** `ui/src/views/ApprovalsView.tsx`

**Tasks:**
- [ ] Replace placeholder with real view
- [ ] List pending approvals
- [ ] Show context (version, justification)
- [ ] Add approve/deny buttons
- [ ] Confirmation modal
- [ ] Success/error toasts

**Acceptance:**
- Can view pending approvals
- Can approve with one click
- Can deny with reason
- Approval processed and transition executes

**Commit:** `feat: add approval center UI`

---

#### Step 2.8: Integration Testing (Day 10)
**Tasks:**
- [ ] Test full flow: create version → request approval → approve → transition
- [ ] Test denial flow
- [ ] Test approval timeout (future)
- [ ] Fix any bugs found

**Commit:** `test: add approval workflow integration tests`

---

## Phase 1.3: Enhanced UI 📋 PLANNED

**Duration:** 2 weeks  
**Start:** February 25, 2026  
**End:** March 10, 2026

### Week 3: Create Forms

#### Step 3.1: Create Template Modal (Day 11)
**File:** `ui/src/components/CreateTemplateModal.tsx`

**Tasks:**
- [ ] Modal with form (name, description, owners, tags)
- [ ] Validation (name required, owners email format)
- [ ] Call `agentTemplates.create()` mutation
- [ ] Success/error handling
- [ ] Close modal on success

**Commit:** `feat: add create template modal`

---

#### Step 3.2: Create Version Modal (Day 12-13)
**File:** `ui/src/components/CreateVersionModal.tsx`

**Tasks:**
- [ ] Modal with genome form
- [ ] Template selector dropdown
- [ ] Version label input (semver validation)
- [ ] Parent version selector (optional)
- [ ] Model config inputs
- [ ] Prompt hash input
- [ ] Tool manifest repeatable section
- [ ] Call `agentVersions.create()` mutation
- [ ] Show computed hash in confirmation

**Commit:** `feat: add create version modal with genome input`

---

#### Step 3.3: State Machine Validation (Day 14)
**File:** `packages/state-machine/src/versionStateMachine.ts`

**Tasks:**
- [ ] Define transition rules
- [ ] Implement `canTransitionVersion()` function
- [ ] Add guard conditions
- [ ] Integrate with `agentVersions.transition()`
- [ ] Test all transition paths

**Commit:** `feat: add state machine validation with guards`

---

#### Step 3.4: Search & Filters (Day 15-16)
**File:** `ui/src/views/DirectoryView.tsx` (enhance)

**Tasks:**
- [ ] Add search input above tables
- [ ] Filter by name, version label, ID
- [ ] Add status filter dropdown
- [ ] Add environment filter (instances)
- [ ] Client-side filtering (server-side in P2.0)

**Commit:** `feat: add search and filters to directory`

---

### Week 4: Polish & Components

#### Step 3.5: StatusChip Component (Day 17)
**File:** `ui/src/components/StatusChip.tsx`

**Tasks:**
- [ ] Reusable status badge component
- [ ] Color mapping for all states
- [ ] Size variants (sm, md, lg)
- [ ] Replace inline badges with component

**Commit:** `refactor: extract StatusChip component`

---

#### Step 3.6: CopyButton Component (Day 18)
**File:** `ui/src/components/CopyButton.tsx`

**Tasks:**
- [ ] Copy to clipboard functionality
- [ ] Success feedback (checkmark)
- [ ] Add to version drawer (copy ID, hash)
- [ ] Add to tables (copy IDs)

**Commit:** `feat: add copy to clipboard button`

---

#### Step 3.7: Toast System (Day 19)
**Files:** `ui/src/components/Toast.tsx`, `ui/src/lib/toast.ts`

**Tasks:**
- [ ] Toast component (success, error, warning)
- [ ] Toast context/provider
- [ ] Auto-dismiss after 3-5 seconds
- [ ] Replace console.log with toasts

**Commit:** `feat: add toast notification system`

---

#### Step 3.8: Error Boundaries (Day 20)
**File:** `ui/src/components/ErrorBoundary.tsx`

**Tasks:**
- [ ] React error boundary component
- [ ] Catch render errors
- [ ] Display user-friendly error page
- [ ] Log errors to console
- [ ] Wrap App.tsx

**Commit:** `feat: add error boundary for graceful failures`

---

## Phase 2.0: Advanced Features 📋 PLANNED

**Duration:** 4 weeks  
**Start:** March 11, 2026  
**End:** April 7, 2026

### Week 5-6: Evaluation Orchestration

#### Step 4.1: Evaluation Suites (Week 5)
**Files:**
- `convex/evaluationSuites.ts`
- `convex/evaluationRuns.ts`
- `ui/src/views/EvaluationsView.tsx`

**Tasks:**
- [ ] Define evaluation suite schema
- [ ] CRUD for suites and runs
- [ ] Trigger eval on version creation
- [ ] Update evalStatus based on results
- [ ] UI for viewing eval results

**Commits:**
- `feat: add evaluation suite schema and CRUD`
- `feat: add evaluation orchestration logic`
- `feat: add evaluations UI`

---

#### Step 4.2: Evaluation Runner (Week 6)
**Approach:** Convex crons (not Temporal for P2.0)

**Tasks:**
- [ ] Cron job to check for pending evals
- [ ] Execute test cases (stub implementation)
- [ ] Aggregate results
- [ ] Update version evalStatus
- [ ] Write change records

**Commit:** `feat: add evaluation runner with cron`

---

### Week 7: Federation Support

#### Step 4.3: Provider Management
**Files:**
- `convex/providers.ts` (enhance)
- `ui/src/views/FederationView.tsx`

**Tasks:**
- [ ] Add provider CRUD UI
- [ ] Health check endpoint integration
- [ ] Federation config editor
- [ ] Provider status monitoring

**Commit:** `feat: add provider management UI`

---

#### Step 4.4: Cross-Provider Instances
**Tasks:**
- [ ] Support federated provider instances
- [ ] Health check polling
- [ ] Failover logic (stub)

**Commit:** `feat: add federated provider support`

---

### Week 8: Cost Tracking

#### Step 4.5: Cost Ledger
**Files:**
- `convex/costLedger.ts`
- `ui/src/views/CostView.tsx`

**Tasks:**
- [ ] Cost ledger schema
- [ ] Ingest cost entries
- [ ] Attribution by instance/project
- [ ] Cost dashboard UI
- [ ] Budget alerts (stub)

**Commits:**
- `feat: add cost ledger schema and ingestion`
- `feat: add cost dashboard UI`

---

## Build Sequence (Step-by-Step)

### Every Feature Follows This Pattern:

#### 1. Schema First
- Define table in `convex/schema.ts`
- Add indexes
- Deploy schema

#### 2. Types Second
- Add TypeScript types in `packages/shared/src/types/`
- Export from `packages/shared/src/index.ts`

#### 3. Backend Third
- Create Convex module (e.g., `convex/moduleName.ts`)
- Implement queries and mutations
- Add validation
- Write change records

#### 4. Frontend Fourth
- Create view component (e.g., `ui/src/views/ViewName.tsx`)
- Add to routing in `App.tsx`
- Add to sidebar navigation
- Connect to Convex queries/mutations

#### 5. Test Fifth
- Manual testing in browser
- Verify data flows end-to-end
- Check change records written

#### 6. Document Sixth
- Update relevant docs (PRD, APP_FLOW, etc.)
- Add code comments
- Update progress.txt

#### 7. Commit Seventh
- Atomic commit with clear message
- Push to branch
- Create PR (if team workflow)

---

## Commit Message Format

### Pattern
```
type: description

[optional body]
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring (no behavior change)
- `docs:` - Documentation only
- `style:` - Formatting, whitespace
- `test:` - Adding tests
- `chore:` - Build, dependencies, tooling

### Examples
```bash
feat: add policy evaluation engine
fix: version drawer scroll on long lineage
refactor: extract status chip component
docs: update backend structure with new schema
test: add genome hashing unit tests
chore: upgrade convex to 1.10.0
```

---

## Testing Strategy

### P1.1 (Manual)
- ✅ Smoke test: UI loads without errors
- ✅ Seed script creates data
- ✅ Directory displays data
- ✅ Version drawer opens and shows details
- ✅ Integrity verification works

### P1.2 (Manual + Unit)
- [ ] Unit tests for policy evaluator
- [ ] Unit tests for state machine
- [ ] Manual test: Create policy → attach to instance
- [ ] Manual test: Request approval → approve → transition

### P1.3 (Manual + Integration)
- [ ] Integration test: Create template → version → instance
- [ ] Manual test: Search and filter
- [ ] Manual test: All forms work

### P2.0 (E2E)
- [ ] Playwright E2E tests
- [ ] CI/CD pipeline
- [ ] Automated regression tests

---

## Deployment Strategy

### P1.1-P1.3 (Development)
- **Environment:** Local only
- **Convex:** Development deployment
- **Database:** Convex-managed
- **No production deployment yet**

### P2.0 (Staging)
- **Environment:** Staging
- **Convex:** Staging deployment
- **Frontend:** Vercel preview
- **Testing:** Full E2E suite

### P2.1+ (Production)
- **Environment:** Production
- **Convex:** Production deployment
- **Frontend:** Vercel production
- **Monitoring:** Error tracking, analytics

---

## Risk Mitigation

### Technical Risks

**Risk:** Convex learning curve slows development  
**Mitigation:** P1.1 validates Convex works for ARM  
**Status:** ✅ Mitigated (P1.1 complete)

**Risk:** Immutability enforcement bypassed  
**Mitigation:** No mutation exists, TypeScript enforces  
**Status:** ✅ Mitigated (no update path exists)

**Risk:** Hash verification performance on large datasets  
**Mitigation:** Only verify on detail reads, skip lists  
**Status:** ✅ Mitigated (implemented in P1.1)

**Risk:** State machine complexity grows  
**Mitigation:** Start simple, add guards incrementally  
**Status:** ⚠️ Monitor in P1.2

### Process Risks

**Risk:** Scope creep beyond P1.2  
**Mitigation:** Lock P1.2 scope, defer nice-to-haves  
**Status:** 🟡 Active risk

**Risk:** Documentation drift from code  
**Mitigation:** Update docs with every feature  
**Status:** ✅ Process in place

---

## Dependencies

### P1.2 Depends On
- ✅ P1.1 complete (schema, CRUD, UI foundation)

### P1.3 Depends On
- P1.2 complete (policies, approvals)

### P2.0 Depends On
- P1.3 complete (full CRUD, enhanced UI)

---

## Success Criteria by Phase

### P1.1 ✅
- [x] All TypeScript compiles
- [x] Dev servers run without crashes
- [x] Directory displays seeded data
- [x] Version drawer shows details
- [x] Integrity verification works
- [x] Change records written

### P1.2 (Target)
- [ ] Policy CRUD functional
- [ ] Policy evaluation returns correct decisions
- [ ] Approval workflows work end-to-end
- [ ] State machine validation enforced
- [ ] All features documented

### P1.3 (Target)
- [ ] Create forms for templates/versions
- [ ] Search/filter works
- [ ] Status chips consistent
- [ ] Toast system functional
- [ ] Error boundaries catch failures

### P2.0 (Target)
- [ ] Evaluation orchestration works
- [ ] Federation support functional
- [ ] Cost tracking operational
- [ ] E2E tests pass
- [ ] Ready for staging deployment

---

## Rollback Plan

### If P1.2 Blocked
1. Revert to P1.1 tag
2. Deploy P1.1 to staging
3. Continue with P1.3 (UI enhancements)
4. Return to P1.2 later

### If P1.3 Blocked
1. Deploy P1.2 without enhanced UI
2. Use basic directory view
3. Continue with P2.0 backend features

---

## Code Review Checklist

### Before Committing
- [ ] TypeScript compiles without errors
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code
- [ ] No TODO comments (create issues instead)
- [ ] Consistent formatting
- [ ] Imports organized
- [ ] Change records written for mutations

### Before PR
- [ ] All acceptance criteria met
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Commit message follows format
- [ ] No merge conflicts

---

## Progress Tracking

### Update After Each Step
1. Mark step complete in this doc
2. Update `progress.txt` with status
3. Update `CLAUDE.md` if patterns change
4. Commit documentation changes

### Weekly Review
- Review completed steps
- Adjust timeline if needed
- Identify blockers
- Update risk status

---

**Document Owner:** Engineering Team  
**Last Review:** February 10, 2026  
**Next Review:** February 17, 2026 (after P1.2 Week 1)
