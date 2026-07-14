export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  feature?: string;
  action?: string;
  entityId?: string;

  [key: string]: unknown;
}

export interface LogError {
  name?: string;
  message: string;
  stack?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;

  context?: LogContext;
  error?: LogError;
}