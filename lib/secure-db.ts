import { neon } from '@neondatabase/serverless';
import { isValidUUID } from './validation/schemas';

// Define interfaces for database results
export interface DatabaseRow {
  [key: string]: unknown;
}

type DatabaseResult = DatabaseRow[];

interface ConversationRow extends DatabaseRow {
  id: string;
  guid: string;
  created_at: string;
  updated_at?: string;
}

interface MessageRow extends DatabaseRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

// Enhanced database client with security measures
export class SecureDatabase {
  private db: ReturnType<typeof neon>;
  private logger: (level: string, message: string, meta?: Record<string, unknown>) => void;

  constructor(connectionString: string) {
    if (!connectionString) {
      throw new Error('Database connection string is required');
    }

    // Configure connection with SSL enforcement
    this.db = neon(connectionString, {
      // SSL is enforced by default in Neon
      arrayMode: false,
      fullResults: false,
    });

    // Simple logger - in production, integrate with your logging solution
    this.logger = (level: string, message: string, meta?: Record<string, unknown>) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
      };
      console.log(JSON.stringify(logEntry));
    };
  }

  /**
   * Execute query using Neon's template literal syntax
   * Converts numbered parameters ($1, $2, etc.) to template literal format
   */
  private async executeNeonQuery(sql: string, params: unknown[]): Promise<DatabaseResult> {
    // Split the SQL by parameter placeholders and reconstruct with actual values
    const parts: string[] = [];
    const values: unknown[] = [];
    
    let currentSql = sql;
    let paramIndex = 1;
    
    while (paramIndex <= params.length) {
      const placeholder = `$${paramIndex}`;
      const placeholderIndex = currentSql.indexOf(placeholder);
      
      if (placeholderIndex === -1) break;
      
      // Add the part before the placeholder
      parts.push(currentSql.substring(0, placeholderIndex));
      
      // Add the parameter value
      values.push(params[paramIndex - 1]);
      
      // Continue with the rest of the SQL
      currentSql = currentSql.substring(placeholderIndex + placeholder.length);
      paramIndex++;
    }
    
    // Add the remaining SQL
    parts.push(currentSql);
    
    // Create a template strings array
    const strings = Object.assign(parts, { raw: parts });
    
    // Call Neon with proper template literal format
    const result = await this.db(strings as TemplateStringsArray, ...values);
    return (Array.isArray(result) ? result : [result]) as unknown as DatabaseResult;
  }

  /**
   * Secure query execution with logging and error handling
   */
  async query<T extends DatabaseRow>(
    sql: string, 
    params: unknown[] = [], 
    context: { userId?: string; action?: string } = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const queryId = crypto.randomUUID();

    try {
      // Log query execution (excluding sensitive parameters)
      this.logger('info', 'Database query executing', {
        queryId,
        action: context.action || 'unknown',
        userId: context.userId,
        paramCount: params.length,
        sqlLength: sql.length
      });

      // Execute the query using Neon's template literal syntax
      // Convert numbered parameters ($1, $2, etc.) to Neon's template literal format
      const result = await this.executeNeonQuery(sql, params);
      
      const duration = Date.now() - startTime;
      
      // Log successful execution
      this.logger('info', 'Database query completed', {
        queryId,
        duration,
        rowCount: Array.isArray(result) ? result.length : 0,
        status: 'success'
      });

      return result as T[];

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error without exposing sensitive information
      this.logger('error', 'Database query failed', {
        queryId,
        duration,
        status: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'unknown'
      });

      // Wrap error to prevent information leakage
      throw new DatabaseError('Database operation failed', queryId);
    }
  }

  /**
   * Safe query execution for read operations
   */
  async queryRead<T extends DatabaseRow>(
    sql: string, 
    params: unknown[] = [], 
    context?: { userId?: string; action?: string }
  ): Promise<T[]> {
    // Ensure it's a read operation
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql.startsWith('select') && !trimmedSql.startsWith('with')) {
      throw new Error('queryRead only allows SELECT and WITH statements');
    }

    return this.query<T>(sql, params, { ...context, action: 'read' });
  }

  /**
   * Safe query execution for write operations
   */
  async queryWrite<T extends DatabaseRow>(
    sql: string, 
    params: unknown[] = [], 
    context?: { userId?: string; action?: string }
  ): Promise<T[]> {
    // Ensure it's a write operation
    const trimmedSql = sql.trim().toLowerCase();
    const allowedOperations = ['insert', 'update', 'delete'];
    const isAllowed = allowedOperations.some(op => trimmedSql.startsWith(op));
    
    if (!isAllowed) {
      throw new Error('queryWrite only allows INSERT, UPDATE, and DELETE statements');
    }

    return this.query<T>(sql, params, { ...context, action: 'write' });
  }
}

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  public readonly queryId: string;
  public readonly isOperational: boolean = true;

  constructor(message: string, queryId: string) {
    super(message);
    this.name = 'DatabaseError';
    this.queryId = queryId;
  }
}

/**
 * Parameter sanitization helpers
 */
export function sanitizeParams<T extends Record<string, unknown>>(params: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Trim strings and validate UUIDs
      const trimmed = value.trim();
      
      // Check if it looks like a UUID and validate it
      if (trimmed.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        if (!isValidUUID(trimmed)) {
          throw new Error(`Invalid UUID format for parameter: ${key}`);
        }
      }
      
      sanitized[key as keyof T] = trimmed as T[keyof T];
    } else if (typeof value === 'number') {
      // Validate numbers
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number for parameter: ${key}`);
      }
      sanitized[key as keyof T] = value as T[keyof T];
    } else if (value === null || value === undefined) {
      sanitized[key as keyof T] = value as T[keyof T];
    } else if (typeof value === 'boolean') {
      sanitized[key as keyof T] = value as T[keyof T];
    } else if (Array.isArray(value)) {
      // Recursively sanitize array elements
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? sanitizeParams(item as Record<string, unknown>)
          : item
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key as keyof T] = sanitizeParams(value as Record<string, unknown>) as T[keyof T];
    } else {
      throw new Error(`Unsupported parameter type for key: ${key}`);
    }
  }

  return sanitized;
}

/**
 * SQL injection prevention helpers
 */
export function validateSqlQuery(sql: string): void {
  const dangerous = [
    /;\s*(drop|alter|truncate|delete|insert|update)\s+/i,
    /union\s+select/i,
    /\/\*[\s\S]*?\*\//,  // Block comments
    /--[^\r\n]*/,        // Line comments
    /;\s*$/              // Trailing semicolons
  ];

  for (const pattern of dangerous) {
    if (pattern.test(sql)) {
      throw new Error('Potentially dangerous SQL detected');
    }
  }
}

// Create and export the secure database instance
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const secureDb = new SecureDatabase(connectionString);

// Export a template literal function for safe SQL construction
export function sql(strings: TemplateStringsArray, ...values: unknown[]): [string, unknown[]] {
  let query = '';
  const params: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    
    if (i < values.length) {
      params.push(values[i]);
      query += `$${params.length}`;
    }
  }

  // Validate the constructed query
  validateSqlQuery(query);

  return [query, params];
}

// Helper for common database operations
export const dbOperations = {
  // Safe conversation lookup
  async findConversation(guid: string, userId?: string): Promise<ConversationRow[]> {
    if (!isValidUUID(guid)) {
      throw new Error('Invalid conversation GUID');
    }

    let query = 'SELECT id, guid, created_at, updated_at FROM conversations WHERE guid = $1';
    const params: (string | undefined)[] = [guid];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    return secureDb.queryRead<ConversationRow>(query, params, { action: 'find_conversation', userId });
  },

  // Safe message insertion
  async insertMessage(conversationId: string, role: string, content: string, userId?: string): Promise<MessageRow[]> {
    if (!isValidUUID(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new Error('Invalid message role');
    }

    const query = `
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      RETURNING *
    `;
    const params = [conversationId, role, content];

    return secureDb.queryWrite<MessageRow>(query, params, { action: 'insert_message', userId });
  },

  // Safe conversation creation
  async createConversation(guid: string, userId?: string): Promise<ConversationRow[]> {
    if (!isValidUUID(guid)) {
      throw new Error('Invalid conversation GUID');
    }

    const query = `
      INSERT INTO conversations (id, guid, created_at, user_id)
      VALUES (gen_random_uuid(), $1, NOW(), $2)
      RETURNING *
    `;
    const params = [guid, userId || null];

    return secureDb.queryWrite<ConversationRow>(query, params, { action: 'create_conversation', userId });
  }
};