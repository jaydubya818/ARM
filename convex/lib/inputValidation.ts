/**
 * Input Validation and Sanitization
 * 
 * Provides comprehensive input validation and sanitization
 * to prevent injection attacks and ensure data integrity.
 */

import { ValidationError, InvalidInputError } from './errorTypes';

/**
 * Validation rules
 */
export const ValidationRules = {
  /**
   * Email validation
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * URL validation
   */
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * UUID validation
   */
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Alphanumeric validation
   */
  alphanumeric: (value: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(value);
  },

  /**
   * Slug validation (lowercase, hyphens, numbers)
   */
  slug: (value: string): boolean => {
    return /^[a-z0-9-]+$/.test(value);
  },

  /**
   * Version label validation (semver-like)
   */
  versionLabel: (value: string): boolean => {
    return /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(value);
  },

  /**
   * Safe string (no special characters that could cause issues)
   */
  safeString: (value: string): boolean => {
    // Allow letters, numbers, spaces, and basic punctuation
    return /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value);
  },

  /**
   * Length validation
   */
  length: (value: string, min: number, max: number): boolean => {
    return value.length >= min && value.length <= max;
  },

  /**
   * Number range validation
   */
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
};

/**
 * Sanitization functions
 */
export const Sanitize = {
  /**
   * Remove HTML tags
   */
  stripHtml: (value: string): string => {
    return value.replace(/<[^>]*>/g, '');
  },

  /**
   * Escape HTML entities
   */
  escapeHtml: (value: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return value.replace(/[&<>"'/]/g, char => map[char]);
  },

  /**
   * Remove SQL injection patterns
   */
  sanitizeSql: (value: string): string => {
    // Remove common SQL injection patterns
    return value
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },

  /**
   * Sanitize for use in regex
   */
  escapeRegex: (value: string): string => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Trim and normalize whitespace
   */
  normalizeWhitespace: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },

  /**
   * Convert to slug
   */
  toSlug: (value: string): string => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Sanitize JSON input
   */
  sanitizeJson: (value: any): any => {
    if (typeof value === 'string') {
      return Sanitize.stripHtml(value);
    }
    if (Array.isArray(value)) {
      return value.map(Sanitize.sanitizeJson);
    }
    if (value && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = Sanitize.sanitizeJson(val);
      }
      return sanitized;
    }
    return value;
  },
};

/**
 * Validation schema builder
 */
export class ValidationSchema {
  private rules: Array<{
    field: string;
    validator: (value: any) => boolean;
    message: string;
    sanitizer?: (value: any) => any;
  }> = [];

  /**
   * Add validation rule
   */
  field(
    field: string,
    validator: (value: any) => boolean,
    message: string,
    sanitizer?: (value: any) => any
  ): this {
    this.rules.push({ field, validator, message, sanitizer });
    return this;
  }

  /**
   * Validate object against schema
   */
  validate(data: Record<string, any>): {
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
    sanitized: Record<string, any>;
  } {
    const errors: Array<{ field: string; message: string }> = [];
    const sanitized: Record<string, any> = { ...data };

    for (const rule of this.rules) {
      const value = data[rule.field];

      // Apply sanitizer if provided
      if (rule.sanitizer && value !== undefined) {
        sanitized[rule.field] = rule.sanitizer(value);
      }

      // Validate
      if (!rule.validator(value)) {
        errors.push({
          field: rule.field,
          message: rule.message,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(data: Record<string, any>): Record<string, any> {
    const result = this.validate(data);
    if (!result.valid) {
      throw new ValidationError(
        'Validation failed',
        { errors: result.errors }
      );
    }
    return result.sanitized;
  }
}

/**
 * Common validation schemas
 */
export const Schemas = {
  /**
   * Template creation schema
   */
  createTemplate: new ValidationSchema()
    .field(
      'name',
      (v) => typeof v === 'string' && ValidationRules.length(v, 1, 100),
      'Name must be 1-100 characters',
      Sanitize.normalizeWhitespace
    )
    .field(
      'description',
      (v) => v === undefined || (typeof v === 'string' && v.length <= 500),
      'Description must be less than 500 characters',
      Sanitize.stripHtml
    )
    .field(
      'tags',
      (v) => Array.isArray(v) && v.every(t => typeof t === 'string'),
      'Tags must be an array of strings',
      (v) => v.map(Sanitize.normalizeWhitespace)
    ),

  /**
   * Version creation schema
   */
  createVersion: new ValidationSchema()
    .field(
      'versionLabel',
      (v) => typeof v === 'string' && ValidationRules.versionLabel(v),
      'Version label must be in semver format (e.g., v1.0.0)',
      Sanitize.normalizeWhitespace
    ),

  /**
   * Operator creation schema
   */
  createOperator: new ValidationSchema()
    .field(
      'email',
      (v) => typeof v === 'string' && ValidationRules.email(v),
      'Must be a valid email address',
      (v) => v.toLowerCase().trim()
    )
    .field(
      'name',
      (v) => typeof v === 'string' && ValidationRules.length(v, 1, 100),
      'Name must be 1-100 characters',
      Sanitize.normalizeWhitespace
    ),

  /**
   * Policy envelope schema
   */
  createPolicy: new ValidationSchema()
    .field(
      'name',
      (v) => typeof v === 'string' && ValidationRules.length(v, 1, 100),
      'Name must be 1-100 characters',
      Sanitize.normalizeWhitespace
    )
    .field(
      'autonomyTier',
      (v) => typeof v === 'number' && ValidationRules.range(v, 0, 4),
      'Autonomy tier must be between 0 and 4'
    ),
};

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new InvalidInputError(field, 'Field is required');
    }
  }
}

/**
 * Validate field types
 */
export function validateTypes(
  data: Record<string, any>,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
): void {
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    if (value === undefined) continue;

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== expectedType) {
      throw new InvalidInputError(
        field,
        `Expected ${expectedType}, got ${actualType}`
      );
    }
  }
}

/**
 * Sanitize mutation input
 */
export function sanitizeMutationInput<T extends Record<string, any>>(
  input: T
): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = Sanitize.stripHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'string' ? Sanitize.stripHtml(v) : v
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeMutationInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize wrapper
 */
export function validateAndSanitize<T extends Record<string, any>>(
  input: T,
  schema: ValidationSchema
): T {
  return schema.validateOrThrow(input) as T;
}
