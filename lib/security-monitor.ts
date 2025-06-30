import { logger } from './logger';

export type SecurityEventType = 
  | 'AUTH_SUCCESS'
  | 'AUTH_FAIL'
  | 'RATE_LIMIT'
  | 'VALIDATION_FAIL'
  | 'FS_SUSPECT'
  | 'API_ABUSE'
  | 'DB_ERROR'
  | 'SESSION_CREATED'
  | 'SESSION_TERMINATED'
  | 'SUSPICIOUS_ACTIVITY';

export type SecuritySeverity = 'info' | 'warn' | 'error';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  requestId?: string;
  ip?: string;
  userId?: string;
  userAgent?: string;
  endpoint?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface SecurityThreshold {
  type: SecurityEventType;
  maxEvents: number;
  windowMinutes: number;
  severity: SecuritySeverity;
}

export interface SecurityAlert {
  id: string;
  threshold: SecurityThreshold;
  events: SecurityEvent[];
  triggeredAt: string;
  resolved: boolean;
}

class SecurityMonitor {
  private events: Map<string, SecurityEvent[]> = new Map();
  private alerts: SecurityAlert[] = [];
  
  private readonly thresholds: SecurityThreshold[] = [
    { type: 'AUTH_FAIL', maxEvents: 5, windowMinutes: 5, severity: 'warn' },
    { type: 'VALIDATION_FAIL', maxEvents: 10, windowMinutes: 1, severity: 'warn' },
    { type: 'FS_SUSPECT', maxEvents: 1, windowMinutes: 1, severity: 'error' },
    { type: 'API_ABUSE', maxEvents: 3, windowMinutes: 1, severity: 'error' },
    { type: 'RATE_LIMIT', maxEvents: 3, windowMinutes: 1, severity: 'info' },
    { type: 'DB_ERROR', maxEvents: 5, windowMinutes: 5, severity: 'error' }
  ];

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Scrub sensitive data
    const scrubbedEvent = this.scrubSensitiveData(fullEvent);

    // Log the event
    logger.info('Security event logged', {
      type: scrubbedEvent.type,
      severity: scrubbedEvent.severity,
      ip: scrubbedEvent.ip,
      userId: scrubbedEvent.userId,
      endpoint: scrubbedEvent.endpoint,
      details: scrubbedEvent.details
    });

    // Store for threshold monitoring
    this.storeEvent(scrubbedEvent);

    // Check thresholds
    this.checkThresholds(scrubbedEvent);
  }

  private scrubSensitiveData(event: SecurityEvent): SecurityEvent {
    const scrubbed = { ...event };
    
    // Remove or hash sensitive information
    if (scrubbed.details) {
      const scrubbedDetails = { ...scrubbed.details };
      
      // Remove common sensitive fields
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key'];
      for (const field of sensitiveFields) {
        if (scrubbedDetails[field]) {
          scrubbedDetails[field] = '[REDACTED]';
        }
      }
      
      // Scrub credit card numbers
      for (const [key, value] of Object.entries(scrubbedDetails)) {
        if (typeof value === 'string') {
          scrubbedDetails[key] = this.scrubCreditCardNumbers(value);
        }
      }
      
      scrubbed.details = scrubbedDetails;
    }
    
    return scrubbed;
  }

  private scrubCreditCardNumbers(text: string): string {
    // Basic credit card regex - replace with [CARD]
    const cardRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    return text.replace(cardRegex, '[CARD]');
  }

  private storeEvent(event: SecurityEvent): void {
    const key = this.getEventKey(event);
    
    if (!this.events.has(key)) {
      this.events.set(key, []);
    }
    
    const eventList = this.events.get(key)!;
    eventList.push(event);
    
    // Clean up old events (keep last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.events.set(key, eventList.filter(e => 
      new Date(e.timestamp) > oneDayAgo
    ));
  }

  private getEventKey(event: SecurityEvent): string {
    // Group events by type and identifier (IP or user)
    const identifier = event.userId || event.ip || 'unknown';
    return `${event.type}:${identifier}`;
  }

  private checkThresholds(event: SecurityEvent): void {
    const relevantThresholds = this.thresholds.filter(t => t.type === event.type);
    
    for (const threshold of relevantThresholds) {
      const key = this.getEventKey(event);
      const events = this.events.get(key) || [];
      
      // Filter events within the time window
      const windowStart = new Date(Date.now() - threshold.windowMinutes * 60 * 1000);
      const recentEvents = events.filter(e => 
        new Date(e.timestamp) > windowStart
      );
      
      if (recentEvents.length >= threshold.maxEvents) {
        this.triggerAlert(threshold, recentEvents);
      }
    }
  }

  private triggerAlert(threshold: SecurityThreshold, events: SecurityEvent[]): void {
    const alertId = crypto.randomUUID();
    
    const alert: SecurityAlert = {
      id: alertId,
      threshold,
      events,
      triggeredAt: new Date().toISOString(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    logger.error('Security threshold breached', {
      alertId,
      threshold: {
        type: threshold.type,
        maxEvents: threshold.maxEvents,
        windowMinutes: threshold.windowMinutes
      },
      eventCount: events.length,
      affectedIdentifier: events[0]?.userId || events[0]?.ip
    });
    
    // In production, this would trigger external alerting
    this.sendAlert(alert);
  }

  private async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Template for external alerting integration
      const alertData = {
        id: alert.id,
        severity: alert.threshold.severity,
        type: alert.threshold.type,
        message: `Security threshold breached: ${alert.threshold.type}`,
        eventCount: alert.events.length,
        timeWindow: `${alert.threshold.windowMinutes} minutes`,
        triggeredAt: alert.triggeredAt
      };

      // In production, integrate with:
      // - Email notifications (nodemailer)
      // - Slack/Teams webhooks
      // - PagerDuty API
      // - Custom alerting service

      console.log('🚨 SECURITY ALERT:', JSON.stringify(alertData, null, 2));
      
    } catch (error) {
      logger.error('Failed to send security alert', { alertId: alert.id }, error as Error);
    }
  }

  getRecentAlerts(hours: number = 24): SecurityAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => 
      new Date(alert.triggeredAt) > cutoff
    );
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Security alert resolved', { alertId });
      return true;
    }
    return false;
  }

  getSecurityMetrics(): {
    totalEvents: number;
    activeAlerts: number;
    eventsByType: Record<SecurityEventType, number>;
    topIPs: Array<{ ip: string; eventCount: number }>;
  } {
    let totalEvents = 0;
    const eventsByType: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    // Aggregate events
    for (const events of this.events.values()) {
      totalEvents += events.length;
      
      for (const event of events) {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        
        if (event.ip) {
          ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
        }
      }
    }

    // Get top IPs
    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    const activeAlerts = this.alerts.filter(a => !a.resolved).length;

    return {
      totalEvents,
      activeAlerts,
      eventsByType: eventsByType as Record<SecurityEventType, number>,
      topIPs
    };
  }

  // Cleanup old data
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Clean up old events
    for (const [key, events] of this.events.entries()) {
      const filteredEvents = events.filter(e => new Date(e.timestamp) > oneDayAgo);
      if (filteredEvents.length === 0) {
        this.events.delete(key);
      } else {
        this.events.set(key, filteredEvents);
      }
    }
    
    // Clean up old alerts (keep for 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.triggeredAt) > sevenDaysAgo
    );
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Helper functions for common security events
export const SecurityEvents = {
  authSuccess: (userId: string, ip?: string, requestId?: string) => {
    securityMonitor.logSecurityEvent({
      type: 'AUTH_SUCCESS',
      severity: 'info',
      userId,
      ip,
      requestId,
      details: { action: 'login_success' }
    });
  },

  authFail: (ip?: string, requestId?: string, reason?: string) => {
    securityMonitor.logSecurityEvent({
      type: 'AUTH_FAIL',
      severity: 'warn',
      ip,
      requestId,
      details: { action: 'login_failed', reason }
    });
  },

  rateLimitHit: (ip?: string, endpoint?: string, requestId?: string) => {
    securityMonitor.logSecurityEvent({
      type: 'RATE_LIMIT',
      severity: 'info',
      ip,
      endpoint,
      requestId,
      details: { action: 'rate_limit_exceeded' }
    });
  },

  validationFail: (ip?: string, endpoint?: string, errors?: unknown, requestId?: string) => {
    securityMonitor.logSecurityEvent({
      type: 'VALIDATION_FAIL',
      severity: 'warn',
      ip,
      endpoint,
      requestId,
      details: { action: 'validation_failed', errors }
    });
  },

  suspiciousFileAccess: (path: string, ip?: string, userId?: string, requestId?: string) => {
    securityMonitor.logSecurityEvent({
      type: 'FS_SUSPECT',
      severity: 'error',
      ip,
      userId,
      requestId,
      details: { action: 'suspicious_file_access', path }
    });
  }
};