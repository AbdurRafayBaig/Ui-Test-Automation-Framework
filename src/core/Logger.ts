import { config } from '../config/config';

type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Scenario-scoped logger. Every entry is buffered so the full log can be attached
 * to the Allure report when the scenario finishes; entries at/above LOG_LEVEL are
 * also echoed to the console.
 */
export class Logger {
  private readonly entries: string[] = [];

  constructor(private readonly scope: string) {}

  debug(message: string): void {
    this.write('debug', message);
  }

  info(message: string): void {
    this.write('info', message);
  }

  warn(message: string): void {
    this.write('warn', message);
  }

  error(message: string): void {
    this.write('error', message);
  }

  /** All buffered lines, ready to be attached to the report. */
  dump(): string {
    return this.entries.join('\n');
  }

  private write(level: Level, message: string): void {
    const line = `${new Date().toISOString()} [${level.toUpperCase().padEnd(5)}] [${this.scope}] ${message}`;
    this.entries.push(line);
    if (ORDER[level] >= ORDER[config.logLevel]) {
      const out = level === 'error' || level === 'warn' ? console.error : console.log;
      out(line);
    }
  }
}
