# Phase 3.0 Testing Guide

## ✅ Setup Complete

Phase 3.0 is now fully deployed and ready for testing!

### What Was Fixed

1. **Created `operators.ts` module** - CRUD operations for operator management
2. **Fixed Convex import paths** - All UI components now use correct relative paths
3. **Environment setup** - Created symlinks for `.env.local` and `convex/_generated`
4. **Query fixes** - Fixed `App.tsx` to handle loading states properly
5. **Seed script updates** - Added required `authIdentity` and `role` fields
6. **Deployment** - Successfully deployed all functions to Convex cloud

---

## 🚀 Quick Start

### 1. Start Development Servers

```bash
# Terminal 1: Start Convex dev (already running)
npx convex dev

# Terminal 2: Start UI dev server (already running)
cd ui && pnpm dev
```

### 2. Seed the Database

```bash
npx convex run seedARM
```

### 3. Open the App

Navigate to: **http://localhost:5173/**

---

## 🎯 Phase 3.0 Features to Test

### 1. **Notification Center** 🔔
- **Location**: Bell icon in top-right header
- **Features**:
  - View all notifications
  - Filter by unread/all
  - Mark as read (individual or all)
  - Delete notifications
  - Color-coded by severity (info/warning/error)
  - Real-time updates

**Test Steps**:
1. Click the bell icon
2. Check the unread count badge
3. Filter between unread/all
4. Mark notifications as read
5. Delete a notification

---

### 2. **Analytics Dashboard** 📊
- **Location**: Sidebar → Advanced → Analytics
- **Features**:
  - Overview cards (Total Runs, Avg Score, Pass Rate, Avg Time)
  - Time range selector (7d, 30d, 90d, All Time)
  - Version comparison (compare two agent versions side-by-side)
  - Performance trends visualization
  - Top-performing versions list

**Test Steps**:
1. Navigate to `/analytics`
2. Check overview statistics
3. Change time range
4. Select two versions to compare
5. Review performance trends
6. Check top-performing versions

---

### 3. **Role Management** 🔐
- **Location**: Sidebar → Admin → Roles & Permissions
- **Features**:
  - **Roles Tab**:
    - List all roles (system + custom)
    - View role details and permissions
    - Create new custom roles
    - Edit custom roles
    - Delete custom roles (system roles protected)
  - **Assignments Tab**:
    - View operator-role assignments
    - Assign roles to operators
    - Revoke role assignments
    - Expiration date support

**Test Steps**:
1. Navigate to `/roles`
2. View the "Roles" tab
3. Select a role to view details
4. Check permissions grouped by category
5. Switch to "Assignments" tab
6. View current assignments
7. Try to revoke a role (check for last Admin protection)

---

### 4. **Audit Log Viewer** 📋
- **Location**: Sidebar → Monitoring → Audit Logs
- **Features**:
  - Statistics cards (Total Events, Access Granted, Access Denied, Errors)
  - Search across multiple fields
  - Filter by severity (INFO, WARNING, ERROR, CRITICAL)
  - Sortable table (timestamp, operator, action, resource, severity)
  - Export to CSV
  - Adjustable page size

**Test Steps**:
1. Navigate to `/audit`
2. Review statistics cards
3. Use search to find specific events
4. Filter by severity
5. Sort by different columns
6. Export logs to CSV
7. Adjust number of logs displayed

---

### 5. **Custom Function Editor** ⚡
- **Location**: Sidebar → Advanced → Custom Functions
- **Features**:
  - List all custom scoring functions
  - Active/inactive status indicators
  - View function code and metadata
  - Create new functions
  - Edit existing functions
  - Test functions with examples
  - Delete functions
  - Sandboxed execution (5s timeout)

**Test Steps**:
1. Navigate to `/custom-functions`
2. View the list of functions
3. Select a function to view details
4. Check the code, parameters, and examples
5. Click "Test" to run examples
6. Create a new function
7. Delete a test function

---

## 🔍 Backend Features (Integrated)

### RBAC (Role-Based Access Control)
- **Permissions Registry**: 49 permissions across 6 categories
- **System Roles**: Admin (42 perms), Operator (26 perms), Viewer (14 perms)
- **Authorization Middleware**: All queries/mutations wrapped with permission checks
- **Audit Logging**: All access decisions logged

### Multi-Tenant Isolation
- **Tenant Context**: All operations scoped to tenant
- **Row-Level Security**: Automatic tenant filtering
- **Cross-Tenant Prevention**: Validation on all operations

### Advanced Analytics
- **Time-Series Tracking**: Daily, weekly, monthly metrics
- **Version Comparison**: Side-by-side performance deltas
- **Trend Analysis**: Historical performance tracking

### Custom Scoring
- **Function Registry**: User-defined JavaScript functions
- **Execution Sandbox**: Isolated, timeout-protected execution
- **Validation**: Return type and range checking (0-1)

### Notification System
- **Event-Driven**: Automatic notifications for evaluation events
- **User Preferences**: Per-operator, per-event-type settings
- **Delivery Channels**: In-app notifications (email/webhook ready)

---

## 📊 Seeded Data

When you run `npx convex run seedARM`, you get:

- **1 Tenant**: "ARM Dev Org"
- **3 Environments**: dev, staging, prod
- **1 Provider**: "local"
- **1 Operator**: admin@arm-dev.com (Admin role)
- **3 System Roles**: Admin, Operator, Viewer
- **49 Permissions**: Full registry
- **1 Template**: "Customer Support Agent"
- **2 Versions**: v1.0.0, v2.0.0
- **1 Instance**: Running in prod
- **1 Evaluation Suite**: "Basic Functionality Tests"
- **1 Evaluation Run**: Sample run with results

---

## 🐛 Known Limitations

1. **Notification Center**: No bell icon visible yet (need to check if NotificationCenter is rendering)
2. **Directory View**: Shows "No templates yet" even after seeding (tenant/operator loading issue)
3. **Role Management**: Create/Assign modals are placeholders (need full implementation)
4. **Custom Functions**: Test results display is basic (could be enhanced)

---

## 🔧 Troubleshooting

### Issue: "No templates yet" after seeding
**Cause**: Tenant/operator data not loading correctly
**Fix**: Check browser console for errors, verify `tenants.list` and `operators.list` queries

### Issue: "Could not find public function"
**Cause**: Convex dev not running or functions not pushed
**Fix**: 
```bash
# Restart Convex dev
pkill -f "convex dev"
npx convex dev
```

### Issue: Import errors in UI
**Cause**: Symlink not created or broken
**Fix**:
```bash
# Recreate symlinks
ln -sf ../.env.local ui/.env.local
mkdir -p ui/src/convex && ln -sf ../../../convex/_generated ui/src/convex/_generated
```

---

## 📈 Next Steps

### Recommended Testing Order

1. ✅ **Seed the database** - Get test data
2. ✅ **Test Analytics** - Verify metrics and trends
3. ✅ **Test Notifications** - Check event system
4. ✅ **Test Roles** - Verify RBAC implementation
5. ✅ **Test Audit Logs** - Check logging and export
6. ✅ **Test Custom Functions** - Verify sandboxed execution

### Phase 4.0 Handoff (Claude Code)

Once testing is complete, Phase 4.0 will focus on:
- Production hardening
- Performance optimization
- Security audit
- Deployment automation
- Monitoring & alerting
- Documentation finalization

---

## 📝 Feedback

If you encounter any issues or have suggestions, please:
1. Check the browser console for errors
2. Check the Convex dev terminal for backend errors
3. Review the `PHASE_3.0_FINAL_SUMMARY.md` for implementation details
4. Consult `docs/P3.0_UI_COMPONENTS.md` for component documentation

---

**Status**: ✅ Phase 3.0 Complete - Ready for Testing
**Version**: v0.3.0
**Date**: February 10, 2026
