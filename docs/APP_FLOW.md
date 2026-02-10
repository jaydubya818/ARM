# ARM - Application Flow

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** P1.1 Complete

---

## Screen Inventory

### Implemented (P1.1)
1. **Directory** - `/directory` - Main registry view
2. **Policies** - `/policies` - Placeholder (P1.2)
3. **Evaluations** - `/evaluations` - Placeholder (P1.2)
4. **Incidents** - `/incidents` - Placeholder (P2.0)
5. **Cost** - `/cost` - Placeholder (P2.0)
6. **Audit** - `/audit` - Placeholder (P2.0)
7. **Federation** - `/federation` - Placeholder (P2.0)

### Components (P1.1)
- **Sidebar** - Left navigation (persistent)
- **Version Drawer** - Right side panel (overlay)

---

## User Flows

### Flow 1: View Agent Directory (P1.1 ✅)

**Trigger:** User navigates to app root `/`

**Steps:**
1. App redirects to `/directory`
2. Directory view loads with 3 tabs: Templates | Versions | Instances
3. Default tab: Templates (active)
4. Fetch templates for current tenant
5. Display templates in table:
   - Columns: Name, Description, Owners, Tags
   - Empty state if no data: "Run seed script" message

**Success:** User sees list of templates

**Error Paths:**
- No tenant found → Show "No tenant configured" message
- Convex connection failed → Show "Connection error" toast
- No templates → Show empty state with seed instructions

---

### Flow 2: Switch Directory Tabs (P1.1 ✅)

**Trigger:** User clicks tab (Templates | Versions | Instances)

**Steps:**
1. User clicks tab button
2. Tab becomes active (blue underline)
3. Content area updates:
   - **Templates tab:** Show templates table
   - **Versions tab:** Show versions table with "View Details" buttons
   - **Instances tab:** Show instances table with state chips
4. Fetch data for selected tab

**Success:** User sees data for selected tab

**Error Paths:**
- No data → Show empty state with seed instructions
- Fetch failed → Show error message

---

### Flow 3: View Version Details (P1.1 ✅)

**Trigger:** User clicks "View Details →" button on version row

**Steps:**
1. User clicks "View Details" button
2. Version drawer slides in from right (600px wide)
3. Drawer displays:
   - **Header:** Version label, close button
   - **Status chips:** Lifecycle state, eval status, integrity status
   - **Genome hash:** Full SHA-256 hash (monospace)
   - **Model config:** Provider, model, temperature, maxTokens
   - **Tool manifest:** List of tools with permissions
   - **Lineage:** Parent version chain (if exists)
   - **Change history:** Last 10 change records
4. Integrity verification runs automatically:
   - Recompute genome hash
   - Compare with stored hash
   - Display VERIFIED or TAMPERED status
   - Write change record for verification result

**Success:** User sees complete version details with integrity status

**Error Paths:**
- Version not found → Show "Version not found" error
- Integrity check failed → Show TAMPERED status in red
- Fetch failed → Show error message in drawer

**Close Actions:**
- Click X button → Drawer slides out
- Click outside drawer → Drawer stays open (no backdrop dismiss)

---

### Flow 4: Navigate Sidebar (P1.1 ✅)

**Trigger:** User clicks sidebar navigation item

**Steps:**
1. User clicks nav item (Directory, Policies, etc.)
2. Nav item becomes active (blue background)
3. Route changes to corresponding path
4. Main content area updates:
   - **Directory:** Show directory view
   - **Policies/Evaluations/etc.:** Show placeholder view
5. Placeholder views display:
   - Title (e.g., "Policies")
   - Message: "Coming in Phase 1.2+"

**Success:** User navigates to selected view

**Error Paths:**
- Route not found → Redirect to `/directory`

---

### Flow 5: Create Template (P1.2 - PLANNED)

**Trigger:** User clicks "Create Template" button in Directory → Templates tab

**Steps:**
1. User clicks "Create Template" button
2. Modal opens with form:
   - **Name:** Text input (required)
   - **Description:** Textarea (optional)
   - **Owners:** Comma-separated emails (required)
   - **Tags:** Comma-separated tags (optional)
3. User fills form and clicks "Create"
4. Validation:
   - Name required and unique
   - Owners valid email format
5. Call `agentTemplates.create()` mutation
6. Show success toast: "Template created"
7. Modal closes
8. Templates table refreshes with new template
9. Change record written: TEMPLATE_CREATED

**Success:** Template appears in table

**Error Paths:**
- Validation failed → Show inline errors
- Name already exists → Show "Name must be unique" error
- Mutation failed → Show error toast
- Network error → Show "Connection failed" toast

**Cancel Actions:**
- Click "Cancel" button → Close modal, no changes
- Click outside modal → Close modal, no changes
- Press Escape → Close modal, no changes

---

### Flow 6: Create Version with Lineage (P1.2 - PLANNED)

**Trigger:** User clicks "Create Version" button in Directory → Versions tab

**Steps:**
1. User clicks "Create Version" button
2. Modal opens with form:
   - **Template:** Dropdown (required)
   - **Version Label:** Text input (required, semver format)
   - **Parent Version:** Dropdown (optional, for lineage)
   - **Model Provider:** Dropdown (anthropic, openai, etc.)
   - **Model Name:** Text input (required)
   - **Temperature:** Number input (0-1)
   - **Max Tokens:** Number input
   - **Prompt Bundle Hash:** Text input (required, SHA-256)
   - **Tools:** Repeatable section:
     - Tool ID, Schema Version, Permissions
     - Add/Remove tool buttons
3. User fills form and clicks "Create"
4. Validation:
   - Version label unique for template
   - Prompt hash valid SHA-256 format
   - At least one tool defined
5. Compute genome hash:
   - Canonicalize genome (deep sort keys)
   - SHA-256 hash
6. Call `agentVersions.create()` mutation
7. Show success toast: "Version created"
8. Modal closes
9. Versions table refreshes with new version
10. Change record written: VERSION_CREATED

**Success:** Version appears in table with computed hash

**Error Paths:**
- Validation failed → Show inline errors
- Version label exists → Show "Version must be unique" error
- Hash computation failed → Show error toast
- Mutation failed → Show error toast

**Cancel Actions:**
- Click "Cancel" → Close modal, no changes
- Click outside modal → Close modal, no changes

---

### Flow 7: Transition Version State (P1.2 - PLANNED)

**Trigger:** User clicks "Transition" button in version drawer

**Steps:**
1. User opens version drawer
2. User clicks "Transition" button
3. Dropdown shows allowed transitions:
   - From DRAFT: [TESTING]
   - From TESTING: [CANDIDATE, DRAFT]
   - From CANDIDATE: [APPROVED, DRAFT]
   - From APPROVED: [DEPRECATED]
   - From DEPRECATED: [RETIRED]
4. User selects target state
5. State machine validation:
   - Check if transition allowed
   - Check guards (e.g., TESTING → CANDIDATE requires evalStatus=PASS)
6. If validation passes:
   - Call `agentVersions.transition()` mutation
   - Show success toast: "Version transitioned to {state}"
   - Drawer updates with new state
   - Change record written: VERSION_TRANSITIONED
7. If validation fails:
   - Show error toast with reason
   - No state change

**Success:** Version state updated, change record written

**Error Paths:**
- Invalid transition → Show "Cannot transition from {from} to {to}" error
- Guard failed → Show "Cannot promote without passing evaluation" error
- Mutation failed → Show error toast

---

### Flow 8: Attach Policy to Instance (P1.2 - PLANNED)

**Trigger:** User clicks "Attach Policy" button in instance row

**Steps:**
1. User clicks "Attach Policy" button
2. Modal opens with:
   - **Policy Envelope:** Dropdown of available policies
   - Policy preview showing:
     - Autonomy tier
     - Allowed tools
     - Cost limits
3. User selects policy and clicks "Attach"
4. Call `agentInstances.update()` mutation
5. Show success toast: "Policy attached"
6. Modal closes
7. Instance row updates with policy badge
8. Change record written: POLICY_ATTACHED

**Success:** Policy attached to instance

**Error Paths:**
- No policies available → Show "Create a policy first" message
- Mutation failed → Show error toast

---

### Flow 9: Request Approval (P1.2 - PLANNED)

**Trigger:** Version transition requires approval (CANDIDATE → APPROVED)

**Steps:**
1. User attempts transition (Flow 7)
2. State machine detects approval required
3. Modal opens: "This transition requires approval"
4. User enters justification (textarea)
5. User clicks "Request Approval"
6. Call `approvalRecords.create()` mutation:
   - Request type: VERSION_PROMOTION
   - Target ID: version ID
   - Requested by: current operator
   - Status: PENDING
7. Show success toast: "Approval requested"
8. Modal closes
9. Version state remains unchanged
10. Change record written: APPROVAL_REQUESTED

**Success:** Approval request created, operator notified

**Error Paths:**
- Justification empty → Show "Justification required" error
- Mutation failed → Show error toast

---

### Flow 10: Approve/Deny Request (P1.2 - PLANNED)

**Trigger:** Approver navigates to Approvals view

**Steps:**
1. User navigates to `/approvals`
2. Approvals view displays pending requests:
   - Request type, target, requested by, timestamp
   - Context: version details, justification
3. User clicks "Approve" or "Deny" button
4. Modal opens with confirmation
5. User confirms decision
6. Call `approvalRecords.decide()` mutation:
   - Decision: APPROVED or DENIED
   - Decided by: current operator
   - Timestamp
7. If APPROVED:
   - Execute original transition
   - Show success toast: "Approved and transitioned"
   - Change record written: APPROVAL_DECIDED + VERSION_TRANSITIONED
8. If DENIED:
   - No state change
   - Show success toast: "Request denied"
   - Change record written: APPROVAL_DECIDED

**Success:** Approval processed, requester notified

**Error Paths:**
- Not authorized → Show "Insufficient permissions" error
- Target version deleted → Show "Version no longer exists" error
- Mutation failed → Show error toast

---

## Navigation Map

```
Root (/)
  ↓ redirect
Directory (/directory)
  ├─ Templates tab [default]
  ├─ Versions tab
  │   └─ Click "View Details" → Version Drawer (overlay)
  └─ Instances tab

Policies (/policies) [P1.2]
  ├─ Policy list
  └─ Click "Create" → Create Policy Modal

Evaluations (/evaluations) [P1.2]
  ├─ Evaluation suites list
  └─ Click suite → Evaluation runs view

Incidents (/incidents) [P2.0]
  └─ Placeholder

Cost (/cost) [P2.0]
  └─ Placeholder

Audit (/audit) [P2.0]
  └─ Placeholder

Federation (/federation) [P2.0]
  └─ Placeholder
```

---

## Decision Points

### When to Show Empty State
- **Condition:** No data returned from query AND query succeeded
- **Action:** Show centered message with seed instructions
- **Example:** "No templates yet. Run: npx convex run seedARM"

### When to Show Error State
- **Condition:** Query failed OR mutation failed
- **Action:** Show error toast with retry button
- **Example:** "Failed to load templates. [Retry]"

### When to Show Loading State
- **Condition:** Query in progress (data === undefined)
- **Action:** Show skeleton loaders or spinner
- **Duration:** Max 3 seconds before timeout

### When to Open Drawer vs. Modal
- **Drawer:** View-only content (version details, lineage)
- **Modal:** Forms and confirmations (create, delete, approve)

---

## Error Handling

### Network Errors
- **Toast:** "Connection failed. Check your network."
- **Action:** Retry button
- **Persistence:** Toast auto-dismisses after 5 seconds

### Validation Errors
- **Inline:** Red text below input field
- **Toast:** None (inline only)
- **Action:** Fix input and resubmit

### Authorization Errors
- **Toast:** "Insufficient permissions"
- **Action:** None (contact admin)
- **Redirect:** No redirect (stay on current page)

### Not Found Errors
- **Toast:** "{Resource} not found"
- **Action:** Close modal/drawer
- **Redirect:** Return to list view

---

## Success Feedback

### Create Actions
- **Toast:** "{Resource} created successfully"
- **Duration:** 3 seconds
- **Action:** Auto-dismiss

### Update Actions
- **Toast:** "{Resource} updated successfully"
- **Duration:** 3 seconds
- **Action:** Auto-dismiss

### Delete Actions
- **Toast:** "{Resource} deleted successfully"
- **Duration:** 3 seconds
- **Action:** Auto-dismiss

---

## Loading States

### Initial Page Load
- **Sidebar:** Render immediately (static)
- **Main content:** Show skeleton loaders
- **Duration:** Until data fetched

### Tab Switch
- **Previous tab:** Fade out
- **New tab:** Fade in with skeleton
- **Duration:** Until data fetched

### Drawer Open
- **Drawer:** Slide in immediately
- **Content:** Show spinner while fetching
- **Duration:** Until data fetched

---

**Document Owner:** Product Team  
**Reviewers:** Engineering, Design  
**Last Review:** February 10, 2026
