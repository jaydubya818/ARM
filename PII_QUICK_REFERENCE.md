# PII Handling - Quick Reference Card

## 🚨 Critical Rules

### NEVER Do This
```typescript
// ❌ DON'T: Log email in plaintext
console.log(`User email: ${user.email}`);
throw new Error(`User ${user.email} not found`);

// ❌ DON'T: Return unmasked email
return { email: operator.email };

// ❌ DON'T: Store IP/UA without anonymization
await ctx.db.insert("logs", { ip: req.ipAddress });
```

### ALWAYS Do This
```typescript
// ✅ DO: Mask email for display
import { maskEmail } from "./utils/pii";
console.log(`User email: ${maskEmail(user.email)}`);

// ✅ DO: Use pseudonymous ID in errors
const pseudoId = await hashSensitiveData(user.email);
throw new Error(`User ${pseudoId.substring(0, 16)} not found`);

// ✅ DO: Return masked email
return { email: maskEmail(operator.email) };

// ✅ DO: Anonymize before storage
import { anonymizeIpAddress } from "./utils/pii";
await ctx.db.insert("logs", { ip: anonymizeIpAddress(req.ipAddress) });
```

---

## 📦 Available Utilities

### Import
```typescript
import { 
  maskEmail, 
  hashSensitiveData, 
  anonymizeIpAddress, 
  anonymizeUserAgent,
  generatePseudonymousId 
} from "./utils/pii";
```

### Functions

#### `maskEmail(email: string): string`
Masks email for display purposes.
```typescript
maskEmail("john.doe@example.com") // "j***@e***.com"
```

#### `hashSensitiveData(data: string): Promise<string>`
One-way SHA-256 hash for audit trails.
```typescript
const hash = await hashSensitiveData("sensitive@data.com");
// "a3f5e8b2c1d4f6a9..."
```

#### `anonymizeIpAddress(ip: string): string`
Anonymizes IP addresses (zeroes last octet/bits).
```typescript
anonymizeIpAddress("192.168.1.100") // "192.168.1.0"
anonymizeIpAddress("2001:db8::1234") // "2001:db8::"
```

#### `anonymizeUserAgent(ua: string): string`
Removes version numbers and identifiers.
```typescript
anonymizeUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/96.0.4664.110")
// "Mozilla (Windows) Chrome"
```

#### `generatePseudonymousId(email: string): Promise<string>`
Creates pseudonymous identifier from email.
```typescript
const id = await generatePseudonymousId("user@example.com");
// "user_a3f5e8b2c1d4f6a9"
```

---

## 🔒 Common Patterns

### Pattern 1: Query with Masked Email
```typescript
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("operators")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    
    // Mask emails before returning
    return items.map(item => ({
      ...item,
      email: maskEmail(item.email),
    }));
  },
});
```

### Pattern 2: Mutation with Audit Trail
```typescript
export const create = mutation({
  args: { email: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    // Create record
    const id = await ctx.db.insert("operators", {
      email: args.email, // Stored securely
      // ...
    });
    
    // Audit with pseudonymous ID
    const pseudoId = await hashSensitiveData(args.email);
    await ctx.db.insert("auditLogs", {
      action: "OPERATOR_CREATED",
      details: {
        pseudonymousId: pseudoId.substring(0, 16), // NOT plaintext email
      },
      // ...
    });
    
    return id;
  },
});
```

### Pattern 3: Error Handling
```typescript
// ❌ DON'T
if (existing) {
  throw new Error(`Operator ${args.email} already exists`);
}

// ✅ DO
if (existing) {
  throw new Error("An operator with this authentication identity already exists");
}
```

### Pattern 4: Audit Log with Network Data
```typescript
await ctx.db.insert("auditLogs", {
  tenantId: args.tenantId,
  action: "ACCESS_ATTEMPT",
  resource: "api",
  details: {
    // These will be auto-anonymized by auditLogs.write()
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    // Other safe fields
    success: true,
  },
  severity: "INFO",
});
```

---

## 📋 Checklist for New Code

Before committing code that handles PII:

- [ ] Email addresses are masked in all responses
- [ ] No plaintext email in error messages
- [ ] No plaintext email in console.log or audit logs
- [ ] Pseudonymous IDs used in audit trails
- [ ] IP addresses anonymized before storage
- [ ] User agents anonymized before storage
- [ ] Access controls enforced (tenant isolation)
- [ ] Retention policies considered
- [ ] GDPR/CCPA rights supported (if applicable)

---

## 🎯 Quick Decision Tree

**Need to display email?**
→ Use `maskEmail()`

**Need to log/audit email?**
→ Use `hashSensitiveData()` and take first 16 chars

**Need to store IP address?**
→ Use `anonymizeIpAddress()` first

**Need to store user agent?**
→ Use `anonymizeUserAgent()` first

**Need to throw error with email?**
→ Use generic message or pseudonymous ID

**Need to return operator data?**
→ Mask email field before returning

---

## 🔧 Environment Setup

### Required Variables
```bash
# .env file (DO NOT COMMIT)
CONVEX_URL=https://your-deployment.convex.cloud
AUDIT_LOG_RETENTION_DAYS=90  # Optional, default: 90
```

### Loading Function Spec
```typescript
import { loadFunctionSpec } from "./convex/utils/loadFunctionSpec.nobundle";

const spec = loadFunctionSpec("./function_spec.json");
console.log(spec.url); // Loaded from CONVEX_URL
```

---

## 📚 Documentation

**Full Documentation:**
- `convex/utils/PII_COMPLIANCE.md` - Comprehensive guide
- `PII_SECURITY_FIXES.md` - Implementation details
- `SECURITY_FIXES_SUMMARY.md` - Executive summary

**Code Examples:**
- `convex/operators.ts` - Email handling patterns
- `convex/auditLogs.ts` - Anonymization patterns
- `convex/utils/pii.ts` - Utility implementations

---

## 🆘 Common Questions

**Q: Can I store email in the database?**
A: Yes, but access must be controlled and responses must be masked.

**Q: Can I log email for debugging?**
A: No, use `maskEmail()` or pseudonymous ID instead.

**Q: What about admin tools?**
A: Admin tools can access full email, but must be audited.

**Q: How long are audit logs kept?**
A: Default 90 days, configurable per tenant.

**Q: What if I need the full email?**
A: Direct database access only, with audit trail.

**Q: Can I use email in error messages?**
A: No, use generic messages or pseudonymous IDs.

---

## 🚀 Quick Start

1. **Import utilities:**
   ```typescript
   import { maskEmail, anonymizeIpAddress } from "./utils/pii";
   ```

2. **Mask emails in responses:**
   ```typescript
   return items.map(item => ({ ...item, email: maskEmail(item.email) }));
   ```

3. **Anonymize network data:**
   ```typescript
   const safeIp = anonymizeIpAddress(request.ip);
   ```

4. **Use pseudonymous IDs in logs:**
   ```typescript
   const pseudoId = await hashSensitiveData(email);
   console.log(`User: ${pseudoId.substring(0, 16)}`);
   ```

---

**Remember:** When in doubt, mask it out! 🎭

**Version:** 1.0  
**Last Updated:** February 10, 2026
