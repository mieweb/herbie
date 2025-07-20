// ============================================================================
// CENTRALIZED LOGGING UTILITY
// ============================================================================

class Logger {
  constructor() {
    this.enabled = true; // Set to false to disable all logging
    this.levels = {
      LOG: 'log',
      WARN: 'warn', 
      ERROR: 'error',
      INFO: 'info',
      DEBUG: 'debug'
    };
    
    // You can also set specific log levels to disable
    this.enabledLevels = {
      log: true,
      warn: true,
      error: true,
      info: true,
      debug: true
    };
  }

  // Main logging method
  _log(level, ...args) {
    if (!this.enabled || !this.enabledLevels[level]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Use the appropriate console method
    if (console[level]) {
      console[level](prefix, ...args);
    } else {
      console.log(prefix, ...args);
    }
  }

  // Public methods for different log levels
  log(...args) {
    this._log(this.levels.LOG, ...args);
  }

  warn(...args) {
    this._log(this.levels.WARN, ...args);
  }

  error(...args) {
    this._log(this.levels.ERROR, ...args);
  }

  info(...args) {
    this._log(this.levels.INFO, ...args);
  }

  debug(...args) {
    this._log(this.levels.DEBUG, ...args);
  }

  // Utility methods to control logging
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  enableLevel(level) {
    if (this.enabledLevels.hasOwnProperty(level)) {
      this.enabledLevels[level] = true;
    }
  }

  disableLevel(level) {
    if (this.enabledLevels.hasOwnProperty(level)) {
      this.enabledLevels[level] = false;
    }
  }

  // Get current status
  isEnabled() {
    return this.enabled;
  }

  getEnabledLevels() {
    return { ...this.enabledLevels };
  }
}

// Create and export a singleton instance
const logger = new Logger();

// For easier migration, also export individual functions
export const log = (...args) => logger.log(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);
export const info = (...args) => logger.info(...args);
export const debug = (...args) => logger.debug(...args);

// Export the logger instance for advanced control
export default logger;

// Alternative: Simple function-based approach (uncomment if preferred)
/*
let LOGGING_ENABLED = true;

export function enableLogging() {
  LOGGING_ENABLED = true;
}

export function disableLogging() {
  LOGGING_ENABLED = false;
}

export function log(...args) {
  if (LOGGING_ENABLED) {
    console.log('[LOG]', ...args);
  }
}

export function warn(...args) {
  if (LOGGING_ENABLED) {
    console.warn('[WARN]', ...args);
  }
}

export function error(...args) {
  if (LOGGING_ENABLED) {
    console.error('[ERROR]', ...args);
  }
}
*/