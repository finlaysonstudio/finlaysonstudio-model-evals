/**
 * Simple debug logging utility for CLI
 */

let isDebugEnabled = false;

/**
 * Set up debugging based on provided flag
 */
export function setupDebug(enabled: boolean): void {
  isDebugEnabled = enabled;
  debug('Debug mode enabled');
}

/**
 * Output debug information if debug mode is enabled
 */
export function debug(message: string, ...args: any[]): void {
  if (isDebugEnabled) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}