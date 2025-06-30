// Structured logging utility

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlationId?: string;
  userId?: string;
  action?: string;
  meta?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private correlationId?: string;

  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  private log(level: LogEntry['level'], message: string, meta?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      meta
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    // In production, you would send this to your logging service
    // For now, we'll use console with structured format
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>, error?: Error) {
    this.log('warn', message, meta, error);
  }

  error(message: string, meta?: Record<string, unknown>, error?: Error) {
    this.log('error', message, meta, error);
  }
}

export const logger = new Logger();