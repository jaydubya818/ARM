# PII Security Fixes - Implementation Summary

## Overview

This document summarizes the security and privacy fixes implemented to address PII handling issues in the ARM platform.

## Issues Fixed

### Issue 1: Email PII Exposure in operators.js:create

**Problem:**
- Email addresses were being logged in plaintext in error messages
- No encryption/hashing protections for stored emails
- Missing access control checks
- No GDPR/CCPA compliance controls

**Solution:**
1. **Email Masking**: All query responses now mask email addresses
   - `list()`, `get()`, `getByAuth()` return masked emails
   - Format: `j***@e***.com`

2. **Secure Logging**: Error messages no longer include plaintext emails
   - Generic error messages used
   - Audit logs use pseudonymous identifiers

3. **Access Controls**: Enforced via tenant isolation
   - Operators can only access data within their tenant
   - Email field access restricted in all queries

4. **GDPR/CCPA Compliance**:
   - Consent tracking fields added to schema
   - Right to erasure implemented (`remove()` mutation)
   - Pseudonymous audit trail
   - Legal basis documented

**Files Modified:**
- `convex/operators.ts` - All mutations and queries updated
- `convex/schema.ts` - Added consent tracking fields
- `convex/utils/pii.ts` - Created PII utility functions

### Issue 2: PII in Audit Logs (auditLogs.js:write)

**Problem:**
- IP addresses and user agents stored in plaintext
- No anonymization before persistence
- No retention policy or TTL
- Missing documentation on legal basis

**Solution:**
1. **Automatic Anonymization**:
   - IP addresses: Last octet zeroed (IPv4) or last 80 bits (IPv6)
   - User agents: Version numbers and identifiers removed
   - Applied before database insertion

2. **Retention Policy**:
   - Default: 90 days
   - Configurable per tenant
   - `cleanupOldLogs()` mutation for enforcement

3. **Documentation**:
   - Legal basis: Legitimate interest for security
   - Purpose limitation documented
   - Data minimization principles applied

**Files Modified:**
- `convex/auditLogs.ts` - Updated `write()` and added `cleanupOldLogs()`
- `convex/utils/pii.ts` - Added anonymization functions

### Issue 3: Hardcoded Convex URL in function_spec

**Problem:**
- Sensitive infrastructure URL hardcoded in committed file
- Security risk if repository is public
- Deployment flexibility limited

**Solution:**
1. **Environment Variable Placeholder**:
   - Replaced hardcoded URL with `${CONVEX_URL}`
   - Must be loaded from environment at runtime
   - Clear error if missing

2. **Documentation**:
   - Usage instructions in PII_COMPLIANCE.md
   - Example code for loading configuration

**Files Modified:**
- `function_spec_1770775290568.json` - URL replaced with placeholder

## New Files Created

### 1. `convex/utils/pii.ts`
Utility functions for PII handling:
- `maskEmail()` - Masks email for display
- `hashSensitiveData()` - SHA-256 one-way hash
- `anonymizeIpAddress()` - Anonymizes IP addresses
- `anonymizeUserAgent()` - Anonymizes user agent strings
- `generatePseudonymousId()` - Creates pseudonymous identifiers

### 2. `convex/utils/PII_COMPLIANCE.md`
Comprehensive documentation covering:
- Sensitive data fields and handling
- Implementation details
- Data subject rights
- Retention policies
- Environment configuration
- Compliance checklist
- Best practices

### 3. `PII_SECURITY_FIXES.md`
This file - implementation summary and migration guide

## Migration Guide

### For Existing Deployments

1. **Deploy Updated Code**:
   ```bash
   npx convex deploy
   ```

2. **Set Environment Variable**:
   ```bash
   # In your deployment environment
   export CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. **Update Function Spec Loading**:
   ```typescript
   // In code that reads function_spec.json
   const spec = JSON.parse(fs.readFileSync('function_spec.json', 'utf8'));
   const convexUrl = process.env.CONVEX_URL;
   if (!convexUrl) {
     throw new Error('CONVEX_URL environment variable is required');
   }
   spec.url = spec.url.replace('${CONVEX_URL}', convexUrl);
   ```

4. **Schedule Audit Log Cleanup** (Recommended):
   ```typescript
   // Add to crons.ts or similar
   {
     name: "cleanup-audit-logs",
     schedule: "0 2 * * *", // Daily at 2 AM
     handler: async (ctx) => {
       const tenants = await ctx.db.query("tenants").collect();
       for (const tenant of tenants) {
         await ctx.runMutation(api.auditLogs.cleanupOldLogs, {
           tenantId: tenant._id,
           retentionDays: 90, // Or from tenant settings
         });
       }
     },
   }
   ```

5. **Update Privacy Policy**:
   - Document email handling practices
   - Explain IP/user agent anonymization
   - List retention periods
   - Describe data subject rights

### For New Deployments

1. Follow standard deployment process
2. Set `CONVEX_URL` environment variable
3. Configure retention policies in tenant settings
4. Schedule audit log cleanup cron job

## Testing

### Manual Testing Checklist

- [ ] Create operator - verify email is masked in response
- [ ] List operators - verify all emails are masked
- [ ] Get operator by ID - verify email is masked
- [ ] Update operator email - verify audit log doesn't contain plaintext
- [ ] Delete operator - verify audit log uses pseudonymous ID
- [ ] Write audit log with IP - verify IP is anonymized
- [ ] Write audit log with user agent - verify UA is anonymized
- [ ] Run cleanup - verify old logs are deleted
- [ ] Load function spec - verify URL is loaded from environment

### Automated Testing

```typescript
// Example test cases
describe('PII Handling', () => {
  it('should mask email in operator list', async () => {
    const operators = await ctx.runQuery(api.operators.list, { tenantId });
    operators.forEach(op => {
      expect(op.email).toMatch(/\*\*\*/);
      expect(op.email).not.toContain('@example.com');
    });
  });

  it('should anonymize IP addresses', async () => {
    const ip = '192.168.1.100';
    const anonymized = anonymizeIpAddress(ip);
    expect(anonymized).toBe('192.168.1.0');
  });

  it('should anonymize user agents', async () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110';
    const anonymized = anonymizeUserAgent(ua);
    expect(anonymized).not.toContain('96.0.4664.110');
    expect(anonymized).toContain('Chrome');
  });
});
```

## Security Considerations

### What's Protected

✅ Email addresses masked in all API responses
✅ No plaintext email in error messages or logs
✅ IP addresses anonymized before storage
✅ User agents anonymized before storage
✅ Pseudonymous audit trail
✅ Right to erasure implemented
✅ Retention policies enforced
✅ Sensitive URLs not committed to repository

### What's Not Protected (By Design)

- Email addresses in database (encrypted at rest by Convex)
- Admin access to full data (required for operations)
- Tenant isolation (assumed secure)

### Recommendations

1. **Enable Convex Encryption**: Ensure Convex encryption at rest is enabled
2. **Audit Admin Access**: Log all admin queries that access PII
3. **Regular Security Reviews**: Review PII handling quarterly
4. **Penetration Testing**: Test tenant isolation boundaries
5. **Privacy Impact Assessment**: Conduct PIA for new features

## Compliance Status

### GDPR

- [x] Lawfulness of processing (Article 6)
- [x] Data minimization (Article 5)
- [x] Storage limitation (Article 5)
- [x] Right to erasure (Article 17)
- [x] Data protection by design (Article 25)
- [ ] Data protection impact assessment (Article 35) - Recommended
- [ ] Records of processing activities (Article 30) - Recommended

### CCPA

- [x] Right to delete (Section 1798.105)
- [x] Data minimization
- [x] Reasonable security procedures
- [ ] Privacy policy disclosure - Update required
- [ ] Consumer request mechanism - Recommended

## Support

For questions or issues:
1. Review `convex/utils/PII_COMPLIANCE.md`
2. Check implementation in `convex/operators.ts` and `convex/auditLogs.ts`
3. Contact security team for privacy concerns

## References

- GDPR Text: https://gdpr-info.eu/
- CCPA Text: https://oag.ca.gov/privacy/ccpa
- Convex Security: https://docs.convex.dev/security
- OWASP Privacy: https://owasp.org/www-project-top-10-privacy-risks/
