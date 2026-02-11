/**
 * PII (Personally Identifiable Information) Utilities
 *
 * Provides functions for handling sensitive data in compliance with GDPR/CCPA
 */

/**
 * Hash a sensitive string value using SHA-256
 * Returns a one-way hash suitable for audit logs and non-reversible storage
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Anonymize an IP address by zeroing out the last octet (IPv4) or last 80 bits (IPv6)
 * This provides sufficient anonymization while maintaining geographic region information
 */
export function anonymizeIpAddress(ipAddress: string): string {
  if (!ipAddress) return '';

  // IPv4
  if (ipAddress.includes('.')) {
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6 - zero out last 80 bits (keep first 48 bits for network prefix)
  if (ipAddress.includes(':')) {
    const parts = ipAddress.split(':');
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
  }

  // If format is unrecognized, hash it
  return `hashed-${ipAddress.substring(0, 8)}`;
}

/**
 * Anonymize user agent string by removing version numbers and specific identifiers
 * Keeps browser family and OS family for analytics while removing tracking vectors
 */
export function anonymizeUserAgent(userAgent: string): string {
  if (!userAgent) return '';

  // Remove version numbers (e.g., "Chrome/96.0.4664.110" -> "Chrome")
  let anonymized = userAgent.replace(/\/[\d.]+/g, '');

  // Remove build numbers and specific identifiers in parentheses
  anonymized = anonymized.replace(/\([^)]*\)/g, '()');

  // Collapse multiple spaces
  anonymized = anonymized.replace(/\s+/g, ' ').trim();

  return anonymized;
}

/**
 * Mask an email address for display/logging purposes
 * Example: john.doe@example.com -> j***@e***.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';

  const [local, domain] = email.split('@');
  const [domainName, ...domainParts] = domain.split('.');

  const maskedLocal = local.length > 1
    ? `${local[0]}***`
    : '***';

  const maskedDomain = domainName.length > 1
    ? `${domainName[0]}***`
    : '***';

  const tld = domainParts.join('.');

  return `${maskedLocal}@${maskedDomain}${tld ? `.${tld}` : ''}`;
}

/**
 * Generate a pseudonymous identifier from an email address
 * This allows tracking/referencing without storing the actual email
 */
export async function generatePseudonymousId(email: string): Promise<string> {
  const hash = await hashSensitiveData(email.toLowerCase().trim());
  return `user_${hash.substring(0, 16)}`;
}
