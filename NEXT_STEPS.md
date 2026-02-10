# ARM - What's Next?

**Current Status:** P1.1 Walking Skeleton Complete ✅  
**Latest Addition:** Version drawer + enhanced directory view ✅

---

## 🚀 Immediate Action (Do This First!)

### Get ARM Running Locally

```bash
# 1. Install dependencies
cd /Users/jaywest/AMS/agent-resources-platform
pnpm install

# 2. Start Convex (Terminal 1)
npx convex dev
# → Login/create account
# → Create project: "arm-dev"
# → Copy deployment URL shown

# 3. Update .env.local (Terminal 2)
# Paste your Convex URL:
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# 4. Seed test data
npx convex run seedARM

# 5. Start UI (Terminal 3)
cd ui && pnpm dev

# 6. Open browser
open http://localhost:5173
```

**Expected Result:**
- Directory view shows 1 template, 2 versions, 1 instance
- Click "View Details →" on a version to open drawer
- Drawer shows genome, hash, lineage, change history

---

## 📋 Development Roadmap

### Phase 1.2 (Weeks 1-2) - Policy & Approvals

#### Week 1: Policy Engine
**Goal:** Enable policy-based governance

**Tasks:**
- [ ] Create `convex/policyEnvelopes.ts` (CRUD)
- [ ] Create `convex/lib/policyEvaluator.ts` (evaluation logic)
- [ ] Update `ui/src/views/PoliciesView.tsx` (replace placeholder)
- [ ] Add policy editor form
- [ ] Test policy evaluation (ALLOW/DENY/NEEDS_APPROVAL)

**Files to Create:**
```typescript
// convex/policyEnvelopes.ts
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    autonomyTier: v.number(),
    allowedTools: v.array(v.string()),
    costLimits: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("policyEnvelopes", args);
  },
});

// convex/lib/policyEvaluator.ts
export function evaluatePolicy(
  policy: PolicyEnvelope,
  action: ToolCall
): { decision: 'ALLOW' | 'DENY' | 'NEEDS_APPROVAL'; reason: string } {
  // Evaluation logic
}
```

#### Week 2: Approval Workflows
**Goal:** Add human-in-the-loop approvals

**Tasks:**
- [ ] Create `convex/approvalRecords.ts` (CRUD)
- [ ] Create `convex/lib/approvalEngine.ts` (workflow logic)
- [ ] Update `ui/src/views/ApprovalsView.tsx` (replace placeholder)
- [ ] Add approval center UI
- [ ] Integrate with version transitions

---

### Phase 1.3 (Week 3) - Enhanced UI

#### Create Forms
**Goal:** Allow creating templates/versions via UI

**Tasks:**
- [ ] Create `ui/src/components/CreateTemplateModal.tsx`
- [ ] Create `ui/src/components/CreateVersionModal.tsx`
- [ ] Add "Create" buttons to directory tabs
- [ ] Form validation
- [ ] Success/error toasts

**Example Modal:**
```typescript
// ui/src/components/CreateVersionModal.tsx
export function CreateVersionModal({ templateId, onClose }: Props) {
  const createVersion = useMutation(api.agentVersions.create);
  
  const handleSubmit = async (data: FormData) => {
    await createVersion({
      templateId,
      tenantId,
      versionLabel: data.versionLabel,
      genome: {
        modelConfig: data.modelConfig,
        promptBundleHash: data.promptHash,
        toolManifest: data.tools,
        provenance: {
          builtAt: new Date().toISOString(),
          builtBy: currentUser.email,
        },
      },
    });
    onClose();
  };
  
  return (
    <Modal>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </Modal>
  );
}
```

#### State Machine Validation
**Goal:** Enforce transition rules

**Tasks:**
- [ ] Import state machine package in Convex
- [ ] Update `convex/agentVersions.ts` transition()
- [ ] Add validation before state changes
- [ ] Return clear error messages
- [ ] Test all transition paths

**Code Update:**
```typescript
// convex/agentVersions.ts
import { canTransitionVersion } from '../packages/state-machine/src/versionStateMachine';

export const transition = mutation({
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    
    // Validate transition
    const validation = canTransitionVersion(
      version.lifecycleState,
      args.newState,
      version.evalStatus
    );
    
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }
    
    // ... proceed with transition
  }
});
```

---

### Phase 2.0 (Weeks 4-6) - Advanced Features

#### Evaluation Orchestration (Stub)
**Goal:** Automated version testing

**Tasks:**
- [ ] Create `convex/evaluationSuites.ts`
- [ ] Create `convex/evaluationRuns.ts`
- [ ] Add eval trigger on version creation
- [ ] Update evalStatus based on results
- [ ] UI for eval results

#### Federation Support
**Goal:** Multi-provider agents

**Tasks:**
- [ ] Enhance provider registry
- [ ] Add federation config UI
- [ ] Health check endpoints
- [ ] Cross-provider instance management

#### Cost Tracking
**Goal:** Economic accountability

**Tasks:**
- [ ] Create `convex/costLedger.ts`
- [ ] Add cost attribution fields
- [ ] Cost dashboard UI
- [ ] Budget alerts

---

## 🎯 Quick Wins (Pick 1-2 This Week)

### Quick Win #1: Search & Filters (2 hours)
Add search to directory view:

```typescript
// ui/src/views/DirectoryView.tsx
const [search, setSearch] = useState('')

const filteredVersions = versions?.filter(v =>
  v.versionLabel.toLowerCase().includes(search.toLowerCase())
)

// Add search input above table
<input
  type="text"
  placeholder="Search versions..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="px-4 py-2 bg-arm-surface border border-arm-border rounded"
/>
```

### Quick Win #2: Status Chip Component (1 hour)
Reusable status badges:

```typescript
// ui/src/components/StatusChip.tsx
export function StatusChip({ status, type }: Props) {
  const colors = {
    DRAFT: 'bg-gray-500',
    APPROVED: 'bg-arm-success',
    ACTIVE: 'bg-arm-success',
    QUARANTINED: 'bg-arm-danger',
    // ... more
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs text-white ${colors[status]}`}>
      {status}
    </span>
  )
}
```

### Quick Win #3: Copy ID Button (30 mins)
Copy IDs to clipboard:

```typescript
// ui/src/components/CopyButton.tsx
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button onClick={handleCopy} className="text-arm-accent hover:text-arm-blue">
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Future)
```bash
# Add testing framework
pnpm add -D vitest @testing-library/react

# Test files
convex/lib/genomeHash.test.ts
packages/state-machine/src/versionStateMachine.test.ts
ui/src/components/VersionDrawer.test.tsx
```

### Integration Tests
```typescript
// Test version creation → hash computation → integrity verification
// Test state transitions → change records written
// Test lineage chain → parent references
```

### E2E Tests (Playwright)
```typescript
// Test full user flows:
// 1. Create template → create version → deploy instance
// 2. View version details → verify integrity
// 3. Transition version → approval workflow
```

---

## 📊 Success Metrics

### P1.2 Completion Criteria
- [ ] Policy CRUD functional
- [ ] Policy evaluation returns correct decisions
- [ ] Approval workflows work end-to-end
- [ ] State machine validation enforced
- [ ] UI has create forms for templates/versions
- [ ] Search/filter works in directory
- [ ] All features documented

### Performance Targets
- Directory list: <500ms for 1000 items
- Version detail: <200ms with hash verification
- Policy evaluation: <100ms
- Approval decision: <150ms

---

## 🔧 Development Tips

### Hot Reload
- **Convex:** Auto-deploys on save (watch terminal for errors)
- **UI:** Auto-reloads on save (check browser console)

### Debugging
```bash
# Convex logs
npx convex logs

# Convex dashboard (query data)
npx convex dashboard

# UI console
# Open browser DevTools → Console
```

### Common Issues
1. **"No data showing"** → Check .env.local has correct URL
2. **"Convex error"** → Check `npx convex logs` for details
3. **"UI won't start"** → Run `cd ui && pnpm install`

---

## 📚 Resources

### Documentation
- [Convex Docs](https://docs.convex.dev) - Backend queries/mutations
- [React Query](https://tanstack.com/query) - Data fetching patterns
- [Tailwind CSS](https://tailwindcss.com) - Styling reference

### ARM Docs
- [ARM_BUILD_PLAN.md](ARM_BUILD_PLAN.md) - Architecture
- [QUICKSTART.md](QUICKSTART.md) - Setup guide
- [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) - What's built

### Code Examples
- `convex/agentVersions.ts` - Complex CRUD with hashing
- `ui/src/components/VersionDrawer.tsx` - Side panel pattern
- `packages/shared/src/types/` - Type definitions

---

## 🎯 Recommended Next Actions

### This Week
1. ✅ Get ARM running locally
2. ✅ Test version drawer functionality
3. ⬜ Add search/filter to directory
4. ⬜ Create StatusChip component
5. ⬜ Start policy CRUD implementation

### Next Week
1. ⬜ Complete policy engine
2. ⬜ Add policy editor UI
3. ⬜ Start approval workflows
4. ⬜ Add create template/version forms

### Month 1 Goal
- ✅ P1.1 Complete
- ⬜ P1.2 Complete (policies + approvals)
- ⬜ Enhanced UI with all CRUD operations
- ⬜ State machine validation enforced
- ⬜ Ready for production deployment

---

**You're on a solid foundation. Pick a quick win and start building!** 🚀

Questions? Check the docs or review existing code patterns.
