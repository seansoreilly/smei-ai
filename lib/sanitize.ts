// HTML sanitization and content cleaning utilities
// This provides basic sanitization as a fallback when sanitize-html is not available

// Basic HTML tag removal regex patterns
const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_REGEX = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const LINK_TAG_REGEX = /<link[^>]*>/gi;
const META_TAG_REGEX = /<meta[^>]*>/gi;
const IFRAME_TAG_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_TAG_REGEX = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_TAG_REGEX = /<embed[^>]*>/gi;

// Dangerous attributes
const ON_EVENT_REGEX = /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript:/gi;
const DATA_PROTOCOL_REGEX = /data:/gi;

// Basic allowlist for safe HTML tags (if we want to allow some HTML)
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'b', 'i'];

export interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export function sanitizeHtml(input: string, options: SanitizeOptions = {}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous script and style content first
  sanitized = sanitized.replace(SCRIPT_TAG_REGEX, '');
  sanitized = sanitized.replace(STYLE_TAG_REGEX, '');
  sanitized = sanitized.replace(LINK_TAG_REGEX, '');
  sanitized = sanitized.replace(META_TAG_REGEX, '');
  sanitized = sanitized.replace(IFRAME_TAG_REGEX, '');
  sanitized = sanitized.replace(OBJECT_TAG_REGEX, '');
  sanitized = sanitized.replace(EMBED_TAG_REGEX, '');

  // Remove dangerous attributes
  sanitized = sanitized.replace(ON_EVENT_REGEX, '');
  sanitized = sanitized.replace(JAVASCRIPT_PROTOCOL_REGEX, '');
  
  // Handle data: protocols carefully (only allow safe image data URLs)
  if (!options.allowHtml) {
    sanitized = sanitized.replace(DATA_PROTOCOL_REGEX, '');
  }

  // If HTML is not allowed, strip all tags
  if (!options.allowHtml) {
    sanitized = sanitized.replace(HTML_TAG_REGEX, '');
  } else {
    // If HTML is allowed, implement basic tag filtering
    const allowedTags = options.allowedTags || ALLOWED_TAGS;
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    
    sanitized = sanitized.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Additional attribute filtering could be added here
        return match;
      }
      return '';
    });
  }

  // Decode HTML entities to prevent double-encoding
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&'); // This should be last

  // Re-encode dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

export function sanitizeMessage(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Sanitize HTML and strip all tags
  let sanitized = sanitizeHtml(content, { 
    allowHtml: false, 
    maxLength: 4000 
  });

  // Additional message-specific cleaning
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}

export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/[\.\/\\]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized.trim();
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove dangerous protocols
  const sanitized = url.replace(/^(javascript|data|vbscript|onload):/i, '');
  
  // Basic URL validation
  try {
    const urlObj = new URL(sanitized);
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
}

// Utility function to sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeMessage(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeMessage(item) : item
      ) as T[keyof T];
    } else if (value && typeof value === 'object') {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }
  
  return sanitized;
}