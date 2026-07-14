import type {
  LogContext,
  LogEntry,
  LogError,
  LogLevel
} from "./logTypes";

function normalizeError(error: unknown): LogError | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: normalizeError(error)
  };
}

function writeLog(entry: LogEntry): void {
  switch (entry.level) {
    case "debug":
      console.debug(entry);
      break;

    case "info":
      console.info(entry);
      break;

    case "warn":
      console.warn(entry);
      break;

    case "error":
      console.error(entry);
      break;
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    writeLog(createLogEntry("debug", message, context));
  },

  info(message: string, context?: LogContext): void {
    writeLog(createLogEntry("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    writeLog(createLogEntry("warn", message, context));
  },

  error(
    message: string,
    error?: unknown,
    context?: LogContext
  ): void {
    writeLog(createLogEntry("error", message, context, error));
  }
};