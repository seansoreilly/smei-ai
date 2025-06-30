import { secureDb, type DatabaseRow } from './secure-db';
import { logger } from './logger';

export interface Session extends DatabaseRow {
  id: string;
  user_id: string;
  created_at: string;
  last_active_at: string;
  expires_at: string;
  ip?: string;
  user_agent?: string;
  terminated: boolean;
}

export interface SessionConfig {
  ttlHours: number;
  cleanupIntervalMinutes: number;
  maxSessionsPerUser: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  ttlHours: parseInt(process.env.SESSION_TTL_HOURS || '24'),
  cleanupIntervalMinutes: 30,
  maxSessionsPerUser: 5
};

export class SessionManager {
  private config: SessionConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: SessionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.startCleanupTimer();
  }

  async createSession(
    userId: string, 
    request?: { ip?: string; userAgent?: string }
  ): Promise<Session> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.ttlHours * 60 * 60 * 1000);

      // Clean up old sessions for this user first
      await this.cleanupUserSessions(userId);

      const query = `
        INSERT INTO sessions (id, user_id, created_at, last_active_at, expires_at, ip, user_agent, terminated)
        VALUES ($1, $2, $3, $3, $4, $5, $6, false)
        RETURNING *
      `;

      const params = [
        sessionId,
        userId,
        now.toISOString(),
        expiresAt.toISOString(),
        request?.ip || null,
        request?.userAgent || null
      ];

      const result = await secureDb.queryWrite<Session>(query, params, {
        userId,
        action: 'create_session'
      });

      const session = result[0];

      logger.info('Session created', {
        sessionId,
        userId,
        expiresAt: session.expires_at,
        ip: request?.ip
      });

      return session;

    } catch (error) {
      logger.error('Failed to create session', { userId }, error as Error);
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<Session | null> {
    try {
      const query = `
        SELECT id, user_id, created_at, last_active_at, expires_at, ip, user_agent, terminated
        FROM sessions 
        WHERE id = $1 
          AND expires_at > NOW() 
          AND terminated = false
      `;

      const result = await secureDb.queryRead<Session>(query, [sessionId], {
        action: 'validate_session'
      });

      if (result.length === 0) {
        return null;
      }

      const session = result[0];

      // Update last active time (debounced to 5 minutes)
      const lastActive = new Date(session.last_active_at);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      if (lastActive < fiveMinutesAgo) {
        await this.updateLastActive(sessionId);
        session.last_active_at = now.toISOString();
      }

      return session;

    } catch (error) {
      logger.error('Failed to validate session', { sessionId }, error as Error);
      return null;
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      const query = `
        UPDATE sessions 
        SET terminated = true 
        WHERE id = $1
      `;

      await secureDb.queryWrite<Session>(query, [sessionId], {
        action: 'terminate_session'
      });

      logger.info('Session terminated', { sessionId });

    } catch (error) {
      logger.error('Failed to terminate session', { sessionId }, error as Error);
      throw error;
    }
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE sessions 
        SET terminated = true 
        WHERE user_id = $1 AND terminated = false
      `;

      await secureDb.queryWrite<Session>(query, [userId], {
        userId,
        action: 'terminate_all_sessions'
      });

      logger.info('All user sessions terminated', { userId });

    } catch (error) {
      logger.error('Failed to terminate user sessions', { userId }, error as Error);
      throw error;
    }
  }

  private async updateLastActive(sessionId: string): Promise<void> {
    try {
      const query = `
        UPDATE sessions 
        SET last_active_at = NOW() 
        WHERE id = $1
      `;

      await secureDb.queryWrite<Session>(query, [sessionId], {
        action: 'update_last_active'
      });

    } catch {
      logger.warn('Failed to update last active time', { sessionId });
    }
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    try {
      // Get active sessions for user, ordered by creation time
      const query = `
        SELECT id FROM sessions 
        WHERE user_id = $1 
          AND expires_at > NOW() 
          AND terminated = false 
        ORDER BY created_at DESC
      `;

      const result = await secureDb.queryRead<{ id: string }>(query, [userId], {
        userId,
        action: 'list_user_sessions'
      });

      // If user has too many sessions, terminate the oldest ones
      if (result.length >= this.config.maxSessionsPerUser) {
        const sessionsToTerminate = result.slice(this.config.maxSessionsPerUser - 1);
        
        for (const session of sessionsToTerminate) {
          await this.terminateSession(session.id as string);
        }

        logger.info('Cleaned up excess user sessions', {
          userId,
          terminatedCount: sessionsToTerminate.length
        });
      }

    } catch {
      logger.warn('Failed to cleanup user sessions', { userId });
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      // Delete expired sessions
      const deleteQuery = `
        DELETE FROM sessions 
        WHERE expires_at < NOW() OR terminated = true
      `;

      const result = await secureDb.queryWrite<Session>(deleteQuery, [], {
        action: 'cleanup_expired_sessions'
      });

      if (result.length > 0) {
        logger.info('Cleaned up expired sessions', {
          deletedCount: result.length
        });
      }

    } catch (error) {
      logger.error('Failed to cleanup expired sessions', {}, error as Error);
    }
  }

  private startCleanupTimer(): void {
    const intervalMs = this.config.cleanupIntervalMinutes * 60 * 1000;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, intervalMs);

    // Cleanup immediately on start
    this.cleanupExpiredSessions();
  }

  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async getSessionStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    byUser: Record<string, number>;
  }> {
    try {
      const activeQuery = `
        SELECT COUNT(*) as count, user_id
        FROM sessions 
        WHERE expires_at > NOW() AND terminated = false
        GROUP BY user_id
      `;

      const expiredQuery = `
        SELECT COUNT(*) as count
        FROM sessions 
        WHERE expires_at <= NOW() OR terminated = true
      `;

      const [activeResult, expiredResult] = await Promise.all([
        secureDb.queryRead<{ count: string; user_id: string }>(activeQuery, [], { action: 'session_stats' }),
        secureDb.queryRead<{ count: string }>(expiredQuery, [], { action: 'session_stats' })
      ]);

      const byUser: Record<string, number> = {};
      let totalActive = 0;

      for (const row of activeResult) {
        const count = parseInt(row.count as string);
        byUser[row.user_id as string] = count;
        totalActive += count;
      }

      const totalExpired = parseInt(expiredResult[0]?.count as string || '0');

      return {
        totalActive,
        totalExpired,
        byUser
      };

    } catch (error) {
      logger.error('Failed to get session stats', {}, error as Error);
      return { totalActive: 0, totalExpired: 0, byUser: {} };
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();