# Database Security Implementation

This document outlines the database security measures implemented in the SMEC AI application.

## Security Features

### 1. Secure Database Wrapper (`lib/secure-db.ts`)

#### Connection Security
- **SSL Enforcement**: All connections use SSL/TLS encryption
- **Connection Pooling**: Managed connection limits to prevent resource exhaustion
- **Environment Validation**: Validates `DATABASE_URL` presence and format

#### Query Security
- **Parameterized Queries**: All queries use parameter placeholders ($1, $2, etc.)
- **SQL Injection Prevention**: Input validation and dangerous pattern detection
- **Query Type Separation**: Separate methods for read (`queryRead`) and write (`queryWrite`) operations
- **Query Validation**: Automatic detection of potentially dangerous SQL patterns

#### Logging and Monitoring
- **Query Logging**: All database operations are logged with metadata
- **Error Sanitization**: Database errors are wrapped to prevent information leakage
- **Performance Tracking**: Query execution time monitoring
- **Correlation IDs**: Unique identifiers for tracking query execution

### 2. Parameter Sanitization

#### Input Validation
```typescript
// Automatic UUID validation
if (!isValidUUID(guid)) {
  throw new Error('Invalid conversation GUID');
}

// Role validation
if (!['user', 'assistant', 'system'].includes(role)) {
  throw new Error('Invalid message role');
}
```

#### Sanitization Features
- **UUID Validation**: Strict format checking for all UUID parameters
- **String Trimming**: Automatic whitespace removal
- **Type Validation**: Ensures parameters match expected types
- **Recursive Sanitization**: Handles nested objects and arrays

### 3. Database Operations (`dbOperations`)

#### Safe Conversation Operations
```typescript
// Find conversation with optional user restriction
await dbOperations.findConversation(guid, userId);

// Create conversation with user association
await dbOperations.createConversation(guid, userId);

// Insert message with role validation
await dbOperations.insertMessage(conversationId, role, content, userId);
```

#### Security Features
- **User Context**: All operations accept optional `userId` for access control
- **Input Validation**: Pre-validated parameters before database interaction
- **Least Privilege**: Operations restricted to necessary actions only

### 4. Error Handling

#### Custom Error Types
```typescript
class DatabaseError extends Error {
  public readonly queryId: string;
  public readonly isOperational: boolean = true;
}
```

#### Information Protection
- **Error Sanitization**: Database errors don't expose schema information
- **Query ID Tracking**: Errors include correlation IDs for debugging
- **Generic Messages**: User-facing errors use generic messages

### 5. Credential Management

#### Environment Security
- **Connection String Validation**: Validates format and SSL requirements
- **Environment Isolation**: Different credentials for development/production
- **Secret Management**: Integration with deployment platform secret stores

#### Rotation Process
- **Automated Rotation**: Framework for credential rotation (`scripts/rotate-db-creds.ts`)
- **Zero-Downtime**: Supports rolling credential updates
- **Verification**: Connection testing before applying new credentials

## Implementation Guidelines

### Using the Secure Database

#### For Read Operations
```typescript
import { secureDb, dbOperations } from '@/lib/secure-db';

// Using helper functions (recommended)
const conversation = await dbOperations.findConversation(guid, userId);

// Direct secure query
const messages = await secureDb.queryRead(
  'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
  [conversationId],
  { userId, action: 'fetch_messages' }
);
```

#### For Write Operations
```typescript
// Using helper functions (recommended)
const message = await dbOperations.insertMessage(
  conversationId, 
  'user', 
  sanitizedContent, 
  userId
);

// Direct secure query
const result = await secureDb.queryWrite(
  'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
  [conversationId],
  { userId, action: 'update_conversation' }
);
```

### Migration from Legacy Code

#### Before (Insecure)
```typescript
// Direct template literal - VULNERABLE
const result = await db`SELECT * FROM users WHERE name = ${userInput}`;
```

#### After (Secure)
```typescript
// Parameterized query - SECURE
const result = await secureDb.queryRead(
  'SELECT * FROM users WHERE name = $1',
  [sanitizedUserInput],
  { action: 'find_user' }
);
```

## Access Control

### User-Based Restrictions
- **Row-Level Security**: Future support for RLS policies
- **Context Validation**: User ID validation for all operations
- **Audit Trail**: Complete logging of user actions

### Query Restrictions
- **Operation Separation**: Read and write operations use different methods
- **SQL Pattern Validation**: Blocks dangerous SQL patterns
- **Parameter Type Checking**: Validates parameter types and formats

## Monitoring and Alerting

### Query Monitoring
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "message": "Database query executing",
  "queryId": "uuid-here",
  "action": "find_conversation",
  "userId": "user-123",
  "paramCount": 2,
  "duration": 45
}
```

### Error Tracking
- **Error Classification**: Operational vs programming errors
- **Rate Limiting**: Detection of unusual error patterns
- **Alert Triggers**: Automated alerts for security events

### Performance Metrics
- **Query Performance**: Slow query detection
- **Connection Health**: Pool utilization monitoring
- **Resource Usage**: Memory and CPU tracking

## Backup and Recovery

### Backup Strategy
- **Point-in-Time Recovery**: Provider-level PITR support
- **Regular Snapshots**: Automated daily backups
- **Cross-Region Replication**: Geographic redundancy

### Recovery Procedures
1. **Immediate Response**: Incident detection and containment
2. **Assessment**: Determine scope and impact
3. **Recovery**: Restore from appropriate backup point
4. **Verification**: Validate data integrity
5. **Post-Incident**: Review and improve processes

## Compliance

### Security Standards
- **OWASP Guidelines**: Following database security best practices
- **SQL Injection Prevention**: Multiple layers of protection
- **Access Logging**: Complete audit trail for compliance

### Data Protection
- **Encryption at Rest**: Provider-managed encryption
- **Encryption in Transit**: SSL/TLS for all connections
- **Data Minimization**: Only necessary data is stored

## Credential Rotation

### Automated Process
```bash
# Dry run to see steps
npm run rotate-db-creds -- --dry-run

# Execute rotation for Neon
npm run rotate-db-creds -- --provider neon --project-id your-project-id
```

### Manual Steps
1. **Backup Current**: Save current connection string
2. **Generate New**: Create new credentials in provider console
3. **Test Connection**: Verify new credentials work
4. **Update Deployment**: Update environment variables
5. **Verify Application**: Ensure application functions correctly
6. **Revoke Old**: Remove old credentials

## Best Practices

### Development
- **Local Environment**: Use separate database for development
- **Testing**: Automated tests with mock data
- **Code Review**: Security review for all database code

### Production
- **Least Privilege**: Minimal required permissions
- **Network Security**: Private network access only
- **Monitoring**: Continuous security monitoring
- **Regular Audits**: Periodic security assessments

### Emergency Procedures
- **Incident Response**: Documented response procedures
- **Contact Information**: On-call security contacts
- **Escalation Path**: Clear escalation procedures
- **Communication Plan**: Stakeholder notification process

## Tools and Scripts

### Available Scripts
- `scripts/rotate-db-creds.ts` - Credential rotation automation
- `scripts/run-migrations.ts` - Safe migration execution
- `scripts/backup-db.ts` - Manual backup creation (future)

### Development Tools
- `lib/secure-db.ts` - Main security wrapper
- `lib/validation/schemas.ts` - Input validation
- `lib/sanitize.ts` - Content sanitization

### Monitoring Integration
- **Structured Logging**: JSON-formatted logs
- **Metrics Export**: Prometheus-compatible metrics
- **Alert Configuration**: Configurable alert thresholds