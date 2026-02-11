/**
 * Security Utilities
 *
 * Provides security utilities including CSRF protection,
 * secure token generation, and security headers.
 */

import crypto from 'crypto';

/**
 * Security headers for HTTP responses
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Vite HMR
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
  ].join('; '),

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
};

/**
 * CSRF token management
 */
export class CSRFTokenManager {
  private tokens: Map<string, { token: string; expiresAt: number }>;

  private readonly tokenLifetime: number;

  constructor(tokenLifetimeMs = 3600000) { // 1 hour default
    this.tokens = new Map();
    this.tokenLifetime = tokenLifetimeMs;
  }

  /**
   * Generate CSRF token for session
   */
  generate(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.tokenLifetime;

    this.tokens.set(sessionId, { token, expiresAt });

    // Clean up expired tokens
    this.cleanup();

    return token;
  }

  /**
   * Verify CSRF token
   */
  verify(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token),
    );
  }

  /**
   * Invalidate token
   */
  invalidate(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Clean up expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

/**
 * Global CSRF token manager
 */
export const csrfManager = new CSRFTokenManager();

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  const prefix = 'arm_';
  const key = crypto.randomBytes(32).toString('base64url');
  return `${prefix}${key}`;
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(data + actualSalt)
    .digest('hex');
  return `${hash}:${actualSalt}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  const [hash, salt] = hashedData.split(':');
  const newHash = crypto
    .createHash('sha256')
    .update(data + salt)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(newHash));
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return maskSensitiveData(email);

  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);

  return `${maskedLocal}@${domain}`;
}

/**
 * Validate content security
 */
export const ContentSecurity = {
  /**
   * Check for potential XSS
   */
  hasXSS: (value: string): boolean => {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];
    return xssPatterns.some((pattern) => pattern.test(value));
  },

  /**
   * Check for SQL injection
   */
  hasSQLInjection: (value: string): boolean => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /--/,
      /\/\*/,
      /;/,
      /'\s*(OR|AND)\s*'?\d/i,
    ];
    return sqlPatterns.some((pattern) => pattern.test(value));
  },

  /**
   * Check for path traversal
   */
  hasPathTraversal: (value: string): boolean => {
    const pathPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
    ];
    return pathPatterns.some((pattern) => pattern.test(value));
  },

  /**
   * Validate content is safe
   */
  isSafe: (value: string): boolean => (
    !ContentSecurity.hasXSS(value)
      && !ContentSecurity.hasSQLInjection(value)
      && !ContentSecurity.hasPathTraversal(value)
  ),
};

/**
 * API key validation
 */
export function validateApiKey(key: string): boolean {
  // Check format: arm_<base64url>
  if (!key.startsWith('arm_')) {
    return false;
  }

  const keyPart = key.slice(4);
  // Base64url should be 43 characters for 32 bytes
  return keyPart.length >= 40 && /^[A-Za-z0-9_-]+$/.test(keyPart);
}

/**
 * Secure comparison (timing-safe)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * IP address anonymization (for GDPR compliance)
 */
export function anonymizeIP(ip: string): string {
  // IPv4: mask last octet
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // IPv6: mask last 80 bits
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::`;
  }

  return 'unknown';
}

/**
 * User agent anonymization
 */
export function anonymizeUserAgent(ua: string): string {
  // Keep only browser family and major version
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
  if (browserMatch) {
    return `${browserMatch[1]}/${browserMatch[2]}`;
  }
  return 'Unknown';
}
