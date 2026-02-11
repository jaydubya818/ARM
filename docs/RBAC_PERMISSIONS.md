# RBAC Permissions Taxonomy

**Version:** 1.0  
**Created:** February 10, 2026  
**Last Updated:** February 10, 2026

---

## Permission Format

Permissions follow the format: `action:resource`

**Examples:**
- `read:templates`
- `write:versions`
- `delete:instances`
- `approve:versions`

---

## Permission Categories

### 1. Core Resources

#### Templates
```
read:templates       - View agent templates
write:templates      - Create/update templates
delete:templates     - Delete templates
```

#### Versions
```
read:versions        - View agent versions
write:versions       - Create/update versions
delete:versions      - Delete versions
approve:versions     - Approve version transitions
transition:versions  - Trigger lifecycle transitions
```

#### Instances
```
read:instances       - View agent instances
write:instances      - Create/update instances
delete:instances     - Delete instances
start:instances      - Start instances
stop:instances       - Stop instances
```

### 2. Evaluation

#### Suites
```
read:evaluations     - View evaluation suites
write:evaluations    - Create/update suites
delete:evaluations   - Delete suites
```

#### Runs
```
execute:evaluations  - Trigger evaluation runs
cancel:evaluations   - Cancel running evaluations
```

### 3. Policies

```
read:policies        - View policy envelopes
write:policies       - Create/update policies
delete:policies      - Delete policies
evaluate:policies    - Evaluate policy decisions
```

### 4. Approvals

```
read:approvals       - View approval requests
write:approvals      - Create approval requests
approve:approvals    - Approve requests
reject:approvals     - Reject requests
```

### 5. Administration

#### Operators
```
read:operators       - View operators
write:operators      - Create/update operators
delete:operators     - Delete operators
```

#### Roles
```
read:roles           - View roles
write:roles          - Create/update roles
delete:roles         - Delete roles
assign:roles         - Assign roles to operators
revoke:roles         - Revoke role assignments
```

#### Permissions
```
read:permissions     - View permissions
manage:permissions   - Manage permission registry
```

#### Tenant
```
read:tenant          - View tenant details
write:tenant         - Update tenant settings
manage:tenant        - Full tenant administration
```

### 6. Audit & Monitoring

```
read:audit           - View audit logs
export:audit         - Export audit logs
read:metrics         - View analytics metrics
```

### 7. Advanced Features

#### Custom Functions
```
read:custom-functions    - View custom scoring functions
write:custom-functions   - Create/update functions
delete:custom-functions  - Delete functions
execute:custom-functions - Execute functions
```

#### Notifications
```
read:notifications       - View notifications
write:notifications      - Create notifications
manage:notifications     - Manage notification settings
```

---

## System Roles

### 1. Super Admin

**Description:** Full system access across all tenants

**Permissions:**
```
ALL PERMISSIONS
```

**Use Cases:**
- Platform administration
- System configuration
- Cross-tenant operations
- Emergency access

**Restrictions:**
- Cannot be assigned to regular operators
- Reserved for platform administrators
- Not tenant-scoped

---

### 2. Admin

**Description:** Full tenant administration

**Permissions:**
```typescript
[
  // Core Resources
  "read:templates",
  "write:templates",
  "delete:templates",
  "read:versions",
  "write:versions",
  "delete:versions",
  "approve:versions",
  "transition:versions",
  "read:instances",
  "write:instances",
  "delete:instances",
  "start:instances",
  "stop:instances",
  
  // Evaluation
  "read:evaluations",
  "write:evaluations",
  "delete:evaluations",
  "execute:evaluations",
  "cancel:evaluations",
  
  // Policies
  "read:policies",
  "write:policies",
  "delete:policies",
  "evaluate:policies",
  
  // Approvals
  "read:approvals",
  "write:approvals",
  "approve:approvals",
  "reject:approvals",
  
  // Administration
  "read:operators",
  "write:operators",
  "delete:operators",
  "read:roles",
  "write:roles",
  "delete:roles",
  "assign:roles",
  "revoke:roles",
  "read:permissions",
  "read:tenant",
  "write:tenant",
  
  // Audit
  "read:audit",
  "export:audit",
  "read:metrics",
  
  // Advanced
  "read:custom-functions",
  "write:custom-functions",
  "delete:custom-functions",
  "execute:custom-functions",
  "read:notifications",
  "write:notifications",
  "manage:notifications",
]
```

**Use Cases:**
- Tenant administration
- User management
- Configuration management
- Full operational control

---

### 3. Operator

**Description:** Standard operational access

**Permissions:**
```typescript
[
  // Core Resources
  "read:templates",
  "write:templates",
  "read:versions",
  "write:versions",
  "transition:versions",
  "read:instances",
  "write:instances",
  "start:instances",
  "stop:instances",
  
  // Evaluation
  "read:evaluations",
  "write:evaluations",
  "execute:evaluations",
  
  // Policies
  "read:policies",
  "evaluate:policies",
  
  // Approvals
  "read:approvals",
  "write:approvals",
  
  // Administration
  "read:operators",
  "read:roles",
  "read:permissions",
  "read:tenant",
  
  // Audit
  "read:audit",
  "read:metrics",
  
  // Advanced
  "read:custom-functions",
  "execute:custom-functions",
  "read:notifications",
]
```

**Use Cases:**
- Day-to-day operations
- Agent deployment
- Evaluation execution
- Monitoring

**Restrictions:**
- Cannot delete resources
- Cannot manage users
- Cannot approve versions
- Cannot modify roles

---

### 4. Viewer

**Description:** Read-only access

**Permissions:**
```typescript
[
  // Core Resources
  "read:templates",
  "read:versions",
  "read:instances",
  
  // Evaluation
  "read:evaluations",
  
  // Policies
  "read:policies",
  
  // Approvals
  "read:approvals",
  
  // Administration
  "read:operators",
  "read:roles",
  "read:permissions",
  "read:tenant",
  
  // Audit
  "read:audit",
  "read:metrics",
  
  // Advanced
  "read:custom-functions",
  "read:notifications",
]
```

**Use Cases:**
- Auditing
- Monitoring
- Reporting
- Stakeholder visibility

**Restrictions:**
- No write operations
- No execution permissions
- No administrative access

---

## Permission Inheritance

Roles do not inherit from each other. Each role has an explicit permission list.

**Rationale:**
- Explicit is better than implicit
- Easier to audit
- No unexpected permission escalation
- Clear permission boundaries

---

## Custom Roles

Tenants can create custom roles with any combination of permissions.

**Rules:**
1. Custom role names must be unique per tenant
2. Custom roles cannot have more permissions than the creator's role
3. System roles cannot be modified
4. At least one admin role must exist per tenant

**Example Custom Roles:**

### Deployment Manager
```typescript
{
  name: "Deployment Manager",
  permissions: [
    "read:templates",
    "read:versions",
    "read:instances",
    "write:instances",
    "start:instances",
    "stop:instances",
    "transition:versions",
  ]
}
```

### Evaluation Specialist
```typescript
{
  name: "Evaluation Specialist",
  permissions: [
    "read:templates",
    "read:versions",
    "read:evaluations",
    "write:evaluations",
    "execute:evaluations",
    "cancel:evaluations",
    "read:custom-functions",
    "write:custom-functions",
    "execute:custom-functions",
  ]
}
```

### Policy Manager
```typescript
{
  name: "Policy Manager",
  permissions: [
    "read:policies",
    "write:policies",
    "evaluate:policies",
    "read:approvals",
    "write:approvals",
    "approve:approvals",
    "reject:approvals",
  ]
}
```

---

## Permission Checking

### Query Permission Check
```typescript
// Before executing query
const operator = await getOperatorByIdentity(ctx, identity);
const allowed = await hasPermission(operator, "read:templates");
if (!allowed) {
  throw new Error("Permission denied: read:templates");
}
```

### Mutation Permission Check
```typescript
// Before executing mutation
const operator = await getOperatorByIdentity(ctx, identity);
await requirePermission(operator, "write:templates");
```

### Multiple Permission Check
```typescript
// Require any of multiple permissions
const allowed = await hasAnyPermission(operator, [
  "approve:versions",
  "approve:approvals"
]);

// Require all of multiple permissions
const allowed = await hasAllPermissions(operator, [
  "read:templates",
  "write:templates"
]);
```

---

## Permission Errors

### Error Format
```typescript
{
  code: "PERMISSION_DENIED",
  message: "Permission denied: write:templates",
  required: "write:templates",
  operator: "op_abc123",
  tenant: "tenant_xyz789"
}
```

### Error Handling
```typescript
try {
  await requirePermission(operator, "write:templates");
  // Execute operation
} catch (error) {
  if (error.code === "PERMISSION_DENIED") {
    // Log audit event
    await logAudit(ctx, "PERMISSION_DENIED", "template:123", {
      permission: "write:templates",
      operator: operator._id,
    }, "WARNING");
  }
  throw error;
}
```

---

## Audit Logging

All permission checks should be audited:

### Successful Permission Check
```typescript
await logAudit(ctx, "PERMISSION_GRANTED", resource, {
  permission: "write:templates",
  operator: operator._id,
}, "INFO");
```

### Failed Permission Check
```typescript
await logAudit(ctx, "PERMISSION_DENIED", resource, {
  permission: "write:templates",
  operator: operator._id,
  reason: "Role does not include permission",
}, "WARNING");
```

---

## Migration Plan

### Phase 1: Schema Deployment
1. Deploy new schema (roles, roleAssignments, permissions)
2. Seed permissions registry
3. Create system roles

### Phase 2: Operator Migration
1. Assign all existing operators to "Operator" role
2. Identify admins and assign "Admin" role
3. Verify role assignments

### Phase 3: Permission Enforcement
1. Add permission checks to all queries/mutations
2. Test with different roles
3. Monitor audit logs

### Phase 4: Custom Roles
1. Enable custom role creation
2. Document custom role examples
3. Provide UI for role management

---

## Best Practices

### 1. Principle of Least Privilege
- Grant minimum permissions needed
- Use specific permissions, not broad categories
- Review permissions regularly

### 2. Role Assignment
- Assign roles, not individual permissions
- Use system roles when possible
- Create custom roles for specific needs

### 3. Permission Naming
- Use consistent format: `action:resource`
- Use lowercase
- Use hyphens for multi-word resources

### 4. Audit Everything
- Log all permission checks
- Log role assignments/revocations
- Review audit logs regularly

### 5. Testing
- Test with each role
- Test permission boundaries
- Test error handling

---

## Future Enhancements

### 1. Resource-Level Permissions
```
read:template:abc123
write:version:xyz789
```

### 2. Conditional Permissions
```
approve:versions:if:creator
execute:evaluations:if:owner
```

### 3. Time-Based Permissions
```
write:templates:until:2026-12-31
```

### 4. IP-Based Restrictions
```
admin:*:from:10.0.0.0/8
```

---

**Version:** 1.0  
**Created:** February 10, 2026  
**Maintainer:** ARM Team
