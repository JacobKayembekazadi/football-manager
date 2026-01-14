/**
 * Input Sanitization Utilities
 *
 * Provides XSS protection and input validation for user-generated content.
 * Use these utilities when rendering or storing user input.
 */

/**
 * HTML entities that need escaping for XSS protection
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * Use this when displaying user input in HTML context
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 * Use this for plain text contexts
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitize a string for safe use in URLs
 */
export function sanitizeForUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return encodeURIComponent(input.trim());
}

/**
 * Sanitize a string for use as a filename
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') return 'file';
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 255) || 'file';
}

/**
 * Sanitize user input for AI prompts
 * Removes potential prompt injection attempts
 */
export function sanitizePrompt(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove potential system prompt injections
    .replace(/\b(system|assistant|user):\s*/gi, '')
    // Remove markdown code blocks that might contain injection
    .replace(/```[\s\S]*?```/g, '')
    // Remove excessive newlines (potential formatting attacks)
    .replace(/\n{3,}/g, '\n\n')
    // Trim and limit length
    .trim()
    .substring(0, 10000);
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize content that will be displayed in a textarea or input
 * Preserves newlines but escapes HTML
 */
export function sanitizeTextContent(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return escapeHtml(input).replace(/\n/g, '<br>');
}

/**
 * Check if a string contains potential XSS vectors
 */
export function containsXss(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:/i,
    /vbscript:/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? escapeHtml(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize whitespace in a string
 */
export function normalizeWhitespace(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\s+/g, ' ').trim();
}
