# Security Policy

**ARM Security Practices**  
**Last Updated:** February 10, 2026  
**Version:** 1.0.0

---

## Table of Contents

- [Reporting Security Issues](#reporting-security-issues)
- [Security Principles](#security-principles)
- [Authentication & Authorization](#authentication--authorization)
- [Data Security](#data-security)
- [API Security](#api-security)
- [Dependency Security](#dependency-security)
- [Deployment Security](#deployment-security)
- [Compliance](#compliance)

---

## Reporting Security Issues

### Responsible Disclosure

If you discover a security vulnerability, please report it responsibly:

**DO:**
- ✅ Email security@your-domain.com with details
- ✅ Provide steps to reproduce
- ✅ Allow 90 days for fix before public disclosure
- ✅ Work with us to verify the fix

**DON'T:**
- ❌ Open public GitHub issues for security bugs
- ❌ Exploit the vulnerability
- ❌ Share details publicly before fix

### What to Include

```markdown
**Vulnerability Type:** [e.g., SQL Injection, XSS, CSRF]
**Affected Component:** [e.g., agentVersions.create mutation]
**Severity:** [Critical/High/Medium/Low]
**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Impact:**
What can an attacker do?

**Suggested Fix:**
If you have ideas
```

### Response Timeline

- **Initial Response**: Within 48 hours
- **Severity Assessment**: Within 1 week
- **Fix Development**: Within 30 days (critical), 90 days (others)
- **Public Disclosure**: After fix is deployed + 7 days

---

## Security Principles

### 1. Defense in Depth

Multiple layers of security:
- **Frontend**: Input validation, XSS prevention
- **API**: Authentication, authorization, rate limiting
- **Database**: Multi-tenant isolation, encrypted at rest
- **Network**: HTTPS, CORS, CSP headers

### 2. Least Privilege

Users and systems have minimum necessary permissions:
- Operators can only access their tenant's data
- Viewers have read-only access
- Approvers can only decide on approvals
- Admins have full access

### 3. Fail Secure

Default to denying access:
```typescript
// ✅ Good: Explicit allow
if (hasPermission(user, "write")) {
  // Allow operation
} else {
  throw new Error("Unauthorized")
}

// ❌ Bad: Implicit allow
if (!hasPermission(user, "write")) {
  throw new Error("Unauthorized")
}
// Operation proceeds even if hasPermission() errors
```

### 4. Audit Everything

All mutations write change records:
```typescript
await ctx.db.insert("changeRecords", {
  tenantId,
  type: "VERSION_CREATED",
  targetEntity: "agentVersion",
  targetId: versionId,
  operatorId: ctx.auth.getUserIdentity()?.subject,
  payload: { versionLabel, genomeHash },
  timestamp: Date.now(),
})
```

---

## Authentication & Authorization

### Current State (P1)

**Development Mode:**
- No authentication required
- Single-tenant demo data
- All operations allowed

**⚠️ Warning:** Not suitable for production

### Planned (P2.0+)

**Convex Auth Integration:**

```typescript
// Require authentication
export const create = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }
    
    // Map to operator
    const operator = await ctx.db
      .query("operators")
      .withIndex("by_auth", (q) => q.eq("authIdentity", identity.subject))
      .first()
    
    if (!operator) {
      throw new Error("Operator not found")
    }
    
    // Check permissions
    if (!hasPermission(operator, "templates:create")) {
      throw new Error("Insufficient permissions")
    }
    
    // Proceed with operation
  },
})
```

**Supported Auth Providers:**
- GitHub OAuth
- Google OAuth
- Email + Password
- SAML (Enterprise)

### Role-Based Access Control

| Role | Templates | Versions | Instances | Policies | Approvals |
|------|-----------|----------|-----------|----------|-----------|
| **Viewer** | Read | Read | Read | Read | Read |
| **Operator** | CRUD | CRUD | CRUD | Read | Request |
| **Approver** | Read | Read | Read | Read | Decide |
| **Admin** | CRUD | CRUD | CRUD | CRUD | Decide |

---

## Data Security

### Multi-Tenant Isolation

**Enforcement:**
```typescript
// Every query MUST filter by tenantId
const templates = await ctx.db
  .query("agentTemplates")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect()

// ❌ NEVER query without tenant filter
const templates = await ctx.db.query("agentTemplates").collect()
```

**Validation:**
```typescript
// Verify tenant ownership before operations
const version = await ctx.db.get(versionId)
if (version.tenantId !== operator.tenantId) {
  throw new Error("Access denied: cross-tenant access")
}
```

### Data Encryption

**At Rest:**
- Convex encrypts all data at rest (AES-256)
- Automatic, no configuration required

**In Transit:**
- All connections use TLS 1.3
- HTTPS enforced
- No plaintext transmission

### Sensitive Data

**Secrets Management:**
```typescript
// ✅ Good: Store reference, not value
{
  secretRef: "vault://prod/zendesk-api-key"
}

// ❌ Bad: Store secret directly
{
  apiKey: "sk-live-abc123..."
}
```

**PII Handling:**
```typescript
// Minimize PII storage
{
  operatorId: "op-123",
  email: "ops@acme.com", // Required for notifications
  // ❌ Don't store: SSN, credit cards, passwords
}
```

---

## API Security

### Input Validation

**Convex Validators:**
```typescript
export const create = mutation({
  args: {
    name: v.string(), // Type validation
    autonomyTier: v.number(), // Type validation
  },
  handler: async (ctx, args) => {
    // Business logic validation
    if (args.autonomyTier < 0 || args.autonomyTier > 5) {
      throw new Error("Invalid autonomy tier")
    }
    
    // Sanitization
    const sanitizedName = args.name.trim()
    if (!sanitizedName) {
      throw new Error("Name cannot be empty")
    }
    
    // Proceed
  },
})
```

### Rate Limiting

**Convex Built-in:**
- 1000 mutations/minute per user
- Automatic throttling
- No configuration required

**Custom Rate Limiting (future):**
```typescript
// Track requests per tenant
const recentRequests = await ctx.db
  .query("changeRecords")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .filter((q) => q.gt(q.field("timestamp"), Date.now() - 60000))
  .collect()

if (recentRequests.length > 100) {
  throw new Error("Rate limit exceeded")
}
```

### CORS Configuration

**Convex Auto-CORS:**
- Automatically allows your frontend domain
- No manual configuration needed

**Custom CORS (if needed):**
```typescript
// Convex dashboard → Settings → CORS
// Add allowed origins:
// - https://arm.your-domain.com
// - https://staging.your-domain.com
```

### XSS Prevention

**React Built-in:**
- Automatic escaping of user input
- No `dangerouslySetInnerHTML` used

**Additional Protection:**
```typescript
// ✅ Good: Sanitize before display
<div>{sanitize(userInput)}</div>

// ❌ Bad: Raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### CSRF Prevention

**Convex Built-in:**
- Token-based authentication
- No cookies used
- CSRF not applicable

---

## Dependency Security

### Audit Dependencies

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update dependencies
pnpm update
```

### Dependency Policy

**Allowed:**
- ✅ Well-maintained packages (updated within 6 months)
- ✅ Popular packages (1000+ GitHub stars)
- ✅ Security-audited packages

**Forbidden:**
- ❌ Unmaintained packages (no updates in 1+ year)
- ❌ Packages with known vulnerabilities
- ❌ Packages with suspicious code

**Review Process:**
```bash
# Before adding dependency
1. Check npm page (weekly downloads, last publish)
2. Check GitHub (stars, issues, activity)
3. Check Snyk/npm audit (vulnerabilities)
4. Review source code (if critical)
```

### Lock Files

**Always commit lock files:**
- `pnpm-lock.yaml` (root)
- `pnpm-lock.yaml` (ui/)

**Why:**
- Ensures reproducible builds
- Prevents supply chain attacks
- Locks transitive dependencies

---

## Deployment Security

### Environment Variables

**Never commit secrets:**
```bash
# ✅ Good: Use .env files (gitignored)
CONVEX_DEPLOY_KEY=secret-key

# ❌ Bad: Hard-code in source
const apiKey = "sk-live-abc123..."
```

**Production Secrets:**
```bash
# Set in Convex dashboard
convex env set API_KEY "secret-value" --prod

# Set in Vercel dashboard
# Settings → Environment Variables
```

### HTTPS Enforcement

**Automatic on:**
- Vercel
- Netlify
- Cloudflare Pages
- Convex Cloud

**Verify:**
```bash
# Check SSL certificate
curl -I https://your-domain.com

# Should see:
# HTTP/2 200
# strict-transport-security: max-age=31536000
```

### Security Headers

**Recommended Headers:**

```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

### Content Security Policy

```typescript
// Future: Add CSP header
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.convex.cloud"
}
```

---

## Compliance

### Data Retention

**Change Records:**
- Retained indefinitely (audit requirement)
- Compressed after 90 days
- Archived after 1 year

**Approval Records:**
- Retained for 7 years (compliance)
- Cannot be deleted (audit requirement)

**User Data:**
- Retained while account active
- Deleted within 30 days of account closure
- Backup retention: 90 days

### GDPR Compliance

**Data Subject Rights:**
- **Right to Access**: Export user data via API
- **Right to Rectification**: Update operator records
- **Right to Erasure**: Delete operator (with audit trail)
- **Right to Portability**: JSON export of all data

**Implementation (future):**
```typescript
// Export user data
export const exportUserData = query({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    // Collect all data for operator
    const operator = await ctx.db.get(args.operatorId)
    const changeRecords = await ctx.db
      .query("changeRecords")
      .withIndex("by_operator", (q) => q.eq("operatorId", args.operatorId))
      .collect()
    
    return { operator, changeRecords }
  },
})
```

### SOC 2 Compliance (Future)

**Requirements:**
- [ ] Access controls (RBAC)
- [ ] Audit logging (Change records)
- [ ] Encryption (at rest + in transit)
- [ ] Incident response plan
- [ ] Security training
- [ ] Vendor management

---

## Security Checklist

### Development

- [ ] No secrets in source code
- [ ] Input validation on all mutations
- [ ] Output sanitization in UI
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies audited (`pnpm audit`)
- [ ] Linter rules enforced

### Deployment

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Environment variables set
- [ ] Secrets stored in vault
- [ ] CORS configured
- [ ] Rate limiting enabled

### Operations

- [ ] Regular security audits
- [ ] Dependency updates monthly
- [ ] Access logs monitored
- [ ] Incident response plan documented
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Data breach, system compromise | Immediate |
| **High** | Vulnerability with exploit | 24 hours |
| **Medium** | Vulnerability without exploit | 1 week |
| **Low** | Minor security issue | 30 days |

### Response Process

1. **Detection**: Identify security incident
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Remediation**: Deploy fix
5. **Communication**: Notify affected users
6. **Post-Mortem**: Document lessons learned

### Example Incident Response

**Scenario:** Unauthorized access to tenant data

```bash
# 1. Containment
# - Revoke compromised credentials
convex env set API_KEY "new-key" --prod

# 2. Investigation
# - Check change records for unauthorized access
# - Identify affected tenants

# 3. Remediation
# - Deploy fix (add authorization check)
# - Rotate all API keys

# 4. Communication
# - Email affected tenants
# - Post incident report

# 5. Post-Mortem
# - Document in docs/incidents/2026-02-10-unauthorized-access.md
# - Update security checklist
```

---

## Security Best Practices

### Code Review

**Security-Focused Review:**
- [ ] Input validation present?
- [ ] Output sanitization present?
- [ ] Authentication checked?
- [ ] Authorization checked?
- [ ] Tenant isolation enforced?
- [ ] Secrets handled correctly?
- [ ] Error messages safe?

### Secure Coding

```typescript
// ✅ Good: Parameterized queries (Convex handles this)
const user = await ctx.db.get(userId)

// ✅ Good: Input validation
if (!/^v\d+\.\d+\.\d+$/.test(versionLabel)) {
  throw new Error("Invalid version format")
}

// ✅ Good: Tenant isolation
const templates = await ctx.db
  .query("agentTemplates")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect()

// ❌ Bad: String concatenation (SQL injection risk - not applicable to Convex)
// ❌ Bad: No input validation
// ❌ Bad: Global query (cross-tenant access)
```

### Secret Management

```typescript
// ✅ Good: Environment variables
const apiKey = process.env.ZENDESK_API_KEY

// ✅ Good: Secret references
{
  secretRef: "vault://prod/zendesk-api-key"
}

// ❌ Bad: Hard-coded secrets
const apiKey = "sk-live-abc123..."

// ❌ Bad: Secrets in database
await ctx.db.insert("config", { apiKey: "secret" })
```

---

## Monitoring & Alerting

### Security Monitoring

**Monitor for:**
- Failed authentication attempts
- Unauthorized access attempts
- Unusual API usage patterns
- Integrity check failures
- Policy violations

**Implementation (future):**
```typescript
// Alert on integrity failures
const integrityFailures = await ctx.db
  .query("changeRecords")
  .withIndex("by_type", (q) =>
    q.eq("tenantId", tenantId).eq("type", "INTEGRITY_FAILED")
  )
  .filter((q) => q.gt(q.field("timestamp"), Date.now() - 3600000))
  .collect()

if (integrityFailures.length > 0) {
  await sendAlert({
    severity: "HIGH",
    message: `${integrityFailures.length} integrity failures in last hour`,
  })
}
```

### Logging

**What to Log:**
- ✅ Authentication events
- ✅ Authorization failures
- ✅ State transitions
- ✅ Policy violations
- ✅ Integrity failures

**What NOT to Log:**
- ❌ Passwords
- ❌ API keys
- ❌ PII (unless required)
- ❌ Full request bodies (may contain secrets)

---

## Vulnerability Management

### Regular Audits

**Schedule:**
- **Weekly**: `pnpm audit` (automated)
- **Monthly**: Dependency updates
- **Quarterly**: Security review
- **Annually**: Penetration testing

### Vulnerability Tracking

**Process:**
1. Identify vulnerability (audit, report, monitoring)
2. Assess severity (CVSS score)
3. Create GitHub issue (private security advisory)
4. Develop fix
5. Test fix
6. Deploy fix
7. Verify fix
8. Close issue
9. Public disclosure (if applicable)

### Known Vulnerabilities

**Current:** None

**Historical:** (Example format)
```markdown
### CVE-2026-XXXXX (Fixed in v1.0.1)
**Severity:** Medium
**Component:** Policy evaluation
**Impact:** Policy bypass under specific conditions
**Fix:** Added additional validation in policyEvaluator.ts
**Affected Versions:** v1.0.0
**Fixed In:** v1.0.1
```

---

## Security Training

### For Developers

**Required Knowledge:**
- OWASP Top 10
- Secure coding practices
- Convex security model
- ARM security principles

**Resources:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Convex Security](https://docs.convex.dev/security)
- [ARM Security Policy](SECURITY.md) (this document)

### For Operators

**Required Knowledge:**
- How to report security issues
- How to handle sensitive data
- How to use approval workflows
- How to respond to incidents

---

## Contact

**Security Team:** security@your-domain.com  
**Bug Bounty:** Not currently available  
**PGP Key:** Available on request

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Maintainer:** ARM Security Team
