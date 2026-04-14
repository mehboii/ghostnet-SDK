/** Minimal debug logger that is silent unless debug mode is enabled. */
export class Logger {
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  /** Enable or disable debug output at runtime. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  debug(msg: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.debug(`[GhostNet] ${msg}`, ...args);
    }
  }

  warn(msg: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.warn(`[GhostNet] ${msg}`, ...args);
    }
  }

  error(msg: string, ...args: unknown[]): void {
    // Errors always log, regardless of debug flag
    console.error(`[GhostNet] ${msg}`, ...args);
  }
}
