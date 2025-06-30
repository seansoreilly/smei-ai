// Validation schemas for input validation and sanitization
// Note: This assumes zod and uuid packages are available

// Type definitions for when packages are not available
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    issues: Array<{
      path: string[];
      message: string;
    }>;
  };
}

// Simple regex-based UUID validation as fallback
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Simple validation functions as fallback for when Zod is not available
export function validateChatMessage(data: unknown): ValidationResult<{
  content: string;
  guid?: string;
  message?: string;
}> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: {
        issues: [{ path: ['root'], message: 'Input must be an object' }]
      }
    };
  }

  const obj = data as Record<string, unknown>;
  const issues: Array<{ path: string[]; message: string }> = [];

  // Validate content or message field
  const content = obj.content || obj.message;
  if (typeof content !== 'string') {
    issues.push({ path: ['content'], message: 'Content must be a string' });
  } else if (content.trim().length === 0) {
    issues.push({ path: ['content'], message: 'Content cannot be empty' });
  } else if (content.length > 4000) {
    issues.push({ path: ['content'], message: 'Content must be less than 4000 characters' });
  }

  // Validate GUID if present
  if (obj.guid && typeof obj.guid === 'string' && !isValidUUID(obj.guid)) {
    issues.push({ path: ['guid'], message: 'Invalid GUID format' });
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return {
    success: true,
    data: {
      content: (content as string).trim(),
      guid: obj.guid as string | undefined,
      message: obj.message as string | undefined,
    }
  };
}

export function validateGuid(value: unknown): ValidationResult<string> {
  if (typeof value !== 'string') {
    return {
      success: false,
      error: {
        issues: [{ path: ['guid'], message: 'GUID must be a string' }]
      }
    };
  }

  if (!isValidUUID(value)) {
    return {
      success: false,
      error: {
        issues: [{ path: ['guid'], message: 'Invalid GUID format' }]
      }
    };
  }

  return { success: true, data: value };
}

export function validateConversation(data: unknown): ValidationResult<{
  title?: string;
  description?: string;
  messages?: Array<{ content: string; role: string }>;
}> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: {
        issues: [{ path: ['root'], message: 'Input must be an object' }]
      }
    };
  }

  const obj = data as Record<string, unknown>;
  const issues: Array<{ path: string[]; message: string }> = [];

  // Validate title if present
  if (obj.title !== undefined) {
    if (typeof obj.title !== 'string') {
      issues.push({ path: ['title'], message: 'Title must be a string' });
    } else if (obj.title.length > 150) {
      issues.push({ path: ['title'], message: 'Title must be less than 150 characters' });
    }
  }

  // Validate description if present
  if (obj.description !== undefined) {
    if (typeof obj.description !== 'string') {
      issues.push({ path: ['description'], message: 'Description must be a string' });
    } else if (obj.description.length > 1000) {
      issues.push({ path: ['description'], message: 'Description must be less than 1000 characters' });
    }
  }

  // Validate messages if present
  if (obj.messages !== undefined) {
    if (!Array.isArray(obj.messages)) {
      issues.push({ path: ['messages'], message: 'Messages must be an array' });
    } else {
      obj.messages.forEach((msg, index) => {
        if (!msg || typeof msg !== 'object') {
          issues.push({ path: ['messages', index.toString()], message: 'Message must be an object' });
          return;
        }
        
        const message = msg as Record<string, unknown>;
        if (typeof message.content !== 'string' || message.content.length > 4000) {
          issues.push({ path: ['messages', index.toString(), 'content'], message: 'Message content must be a string under 4000 characters' });
        }
        
        if (typeof message.role !== 'string' || !['user', 'assistant', 'system'].includes(message.role)) {
          issues.push({ path: ['messages', index.toString(), 'role'], message: 'Message role must be user, assistant, or system' });
        }
      });
    }
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return {
    success: true,
    data: {
      title: obj.title as string | undefined,
      description: obj.description as string | undefined,
      messages: obj.messages as Array<{ content: string; role: string }> | undefined,
    }
  };
}

export function validateUpload(data: unknown): ValidationResult<{
  filename: string;
  mimeType?: string;
  size: number;
}> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: {
        issues: [{ path: ['root'], message: 'Input must be an object' }]
      }
    };
  }

  const obj = data as Record<string, unknown>;
  const issues: Array<{ path: string[]; message: string }> = [];

  // Validate filename
  if (typeof obj.filename !== 'string') {
    issues.push({ path: ['filename'], message: 'Filename must be a string' });
  } else {
    const filenameRegex = /^[\w,\s-]+\.[A-Za-z]{3,4}$/;
    if (!filenameRegex.test(obj.filename)) {
      issues.push({ path: ['filename'], message: 'Invalid filename format' });
    }
  }

  // Validate mimeType if present
  if (obj.mimeType !== undefined) {
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (typeof obj.mimeType !== 'string' || !allowedTypes.includes(obj.mimeType)) {
      issues.push({ path: ['mimeType'], message: 'Invalid MIME type' });
    }
  }

  // Validate size
  if (typeof obj.size !== 'number') {
    issues.push({ path: ['size'], message: 'Size must be a number' });
  } else if (obj.size > 5 * 1024 * 1024) { // 5 MB
    issues.push({ path: ['size'], message: 'File size must be less than 5 MB' });
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return {
    success: true,
    data: {
      filename: obj.filename as string,
      mimeType: obj.mimeType as string | undefined,
      size: obj.size as number,
    }
  };
}