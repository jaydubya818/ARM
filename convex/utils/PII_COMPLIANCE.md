# PII Compliance Documentation

## Overview

This document describes the Personally Identifiable Information (PII) handling practices implemented in the ARM platform to ensure GDPR and CCPA compliance.

## Sensitive Data Fields

### Email Addresses (operators.email)

**Storage:**
- Stored in plaintext in the database (Convex provides encryption at rest)
- Access controlled via tenant isolation
- Never logged in plaintext in error messages or audit logs

**Access:**
- Masked in all query responses using `maskEmail()` function
- Example: `john.doe@example.com` → `j***@e***.com`
- Full email only accessible via direct database access (admin only)

**Audit Trail:**
- Uses pseudonymous identifiers (SHA-256 hash prefix) instead of email
- Example: `user_a3f5e8b2c1d4f6a9`

**Retention:**
- Subject to tenant data retention policies
- Can be erased via data subject request (GDPR Article 17)

**Legal Basis:**
- Legitimate interest for user account management
- Consent tracking available via optional fields

### IP Addresses (auditLogs.details.ipAddress)

**Storage:**
- Automatically anonymized before persistence
- IPv4: Last octet zeroed (e.g., `192.168.1.100` → `192.168.1.0`)
- IPv6: Last 80 bits zeroed (e.g., `2001:db8:85a3::8a2e:370:7334` → `2001:db8:85a3::`)

**Purpose:**
- Geographic region identification for security monitoring
- Insufficient for individual identification (GDPR compliant)

**Retention:**
- Default: 90 days
- Configurable per tenant
- Automatic cleanup via `cleanupOldLogs()` mutation

**Legal Basis:**
- Legitimate interest for security and fraud prevention

### User Agent Strings (auditLogs.details.userAgent)

**Storage:**
- Automatically anonymized before persistence
- Version numbers removed
- Specific identifiers stripped
- Example: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0.4664.110` → `Mozilla (Windows) Chrome`

**Purpose:**
- Browser/OS family identification for compatibility
- Insufficient for device fingerprinting (GDPR compliant)

**Retention:**
- Same as IP addresses (default 90 days)

**Legal Basis:**
- Legitimate interest for technical support and compatibility

## Implementation

### Utility Functions

Located in `convex/utils/pii.ts`:

- `maskEmail(email: string)`: Masks email for display
- `hashSensitiveData(data: string)`: One-way SHA-256 hash
- `anonymizeIpAddress(ip: string)`: Anonymizes IP addresses
- `anonymizeUserAgent(ua: string)`: Anonymizes user agent strings
- `generatePseudonymousId(email: string)`: Creates pseudonymous identifier

### Modified Functions

**operators.ts:**
- `create()`: Stores email securely, logs with pseudonymous ID
- `update()`: Masks email in audit logs
- `remove()`: Implements right to erasure
- `list()`, `get()`, `getByAuth()`: Return masked emails

**auditLogs.ts:**
- `write()`: Automatically anonymizes IP and user agent
- `cleanupOldLogs()`: Implements retention policy

## Data Subject Rights

### Right to Access (GDPR Article 15)
- Operators can view their own data via standard queries
- Email addresses are masked in responses
- Full data export available via admin tools

### Right to Rectification (GDPR Article 16)
- Implemented via `operators.update()` mutation
- Changes are audited with pseudonymous identifiers

### Right to Erasure (GDPR Article 17)
- Implemented via `operators.remove()` mutation
- Deletion is logged with pseudonymous identifier
- Related records should be handled separately

### Right to Restriction (GDPR Article 18)
- Can be implemented via account status flags (future enhancement)

### Right to Data Portability (GDPR Article 20)
- Export functionality available via admin tools (future enhancement)

## Retention Policies

### Audit Logs
- **Default Retention:** 90 days
- **Configurable:** Yes, per tenant
- **Cleanup:** Automatic via `cleanupOldLogs()` mutation
- **Should be scheduled:** Via cron job (recommended daily)

### Operator Records
- **Retention:** Until account deletion or tenant termination
- **Erasure:** Via data subject request or account closure

## Environment Configuration

### Required Environment Variables

For code that reads the function spec:

```bash
# Convex deployment URL (replaces ${CONVEX_URL} placeholder)
CONVEX_URL=https://your-deployment.convex.cloud
```

### Loading Configuration

```typescript
// Example: Loading function spec with environment variable
const spec = JSON.parse(fs.readFileSync('function_spec.json', 'utf8'));
const convexUrl = process.env.CONVEX_URL || 'http://localhost:3000';
spec.url = spec.url.replace('${CONVEX_URL}', convexUrl);
```

## Compliance Checklist

- [x] Email addresses masked in all query responses
- [x] No plaintext email in error messages
- [x] Pseudonymous identifiers in audit logs
- [x] IP addresses anonymized before storage
- [x] User agents anonymized before storage
- [x] Retention policy implemented
- [x] Right to erasure implemented
- [x] Consent tracking available
- [x] Hardcoded URLs removed from committed files
- [ ] Scheduled cleanup job for audit logs (recommended)
- [ ] Data export functionality (future enhancement)
- [ ] Account restriction functionality (future enhancement)

## Best Practices

1. **Never log PII in plaintext**
   - Use `maskEmail()` for display
   - Use pseudonymous IDs for audit trails

2. **Always anonymize network data**
   - IP addresses and user agents are automatically handled
   - Don't bypass the anonymization functions

3. **Respect retention policies**
   - Schedule regular cleanup jobs
   - Document retention periods in privacy policy

4. **Handle data subject requests promptly**
   - Use provided erasure functions
   - Document all data processing activities

5. **Secure configuration**
   - Never commit sensitive URLs or credentials
   - Use environment variables for deployment-specific values

## References

- GDPR: https://gdpr-info.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa
- Convex Security: https://docs.convex.dev/security
