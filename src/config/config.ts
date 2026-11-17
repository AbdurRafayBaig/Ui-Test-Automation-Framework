import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

export type BrowserName = 'chromium' | 'firefox' | 'webkit' | 'chrome' | 'msedge';
export type ArtifactMode = 'on' | 'off' | 'on-failure';
export type AppName = 'saucedemo' | 'toolshop' | 'theinternet';

interface EnvironmentFile {
  name: string;
  apps: Record<AppName, string>;
  timeouts: { step: number; action: number; navigation: number; expect: number };
}

export interface FrameworkConfig {
  env: string;
  apps: Record<AppName, string>;
  browser: BrowserName;
  headless: boolean;
  slowMo: number;
  viewport: { width: number; height: number };
  device?: string;
  screenshot: ArtifactMode;
  video: ArtifactMode;
  trace: ArtifactMode;
  timeouts: EnvironmentFile['timeouts'];
  data: { excelFile: string; sqliteFile: string; jsonDir: string; redisUrl?: string };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  rootDir: string;
}

const ROOT = path.resolve(__dirname, '..', '..');

function str(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function num(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && process.env[name]?.trim() ? value : fallback;
}

function oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = str(name, fallback).toLowerCase() as T;
  if (!allowed.includes(value)) {
    throw new Error(`Invalid ${name}="${value}". Allowed values: ${allowed.join(', ')}`);
  }
  return value;
}

function loadEnvironment(envName: string): EnvironmentFile {
  const file = path.join(ROOT, 'config', 'environments', `${envName}.json`);
  if (!fs.existsSync(file)) {
    const available = fs
      .readdirSync(path.join(ROOT, 'config', 'environments'))
      .map((f) => f.replace(/\.json$/, ''));
    throw new Error(`Unknown TEST_ENV "${envName}". Available: ${available.join(', ')}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as EnvironmentFile;
}

function build(): FrameworkConfig {
  const envName = str('TEST_ENV', 'qa');
  const env = loadEnvironment(envName);
  const artifactModes = ['on', 'off', 'on-failure'] as const;

  // Allow overriding a single app URL, e.g. SAUCEDEMO_URL=https://my-mirror
  const apps = { ...env.apps };
  (Object.keys(apps) as AppName[]).forEach((app) => {
    const override = process.env[`${app.toUpperCase()}_URL`];
    if (override) apps[app] = override;
  });

  return {
    env: env.name,
    apps,
    browser: oneOf('BROWSER', ['chromium', 'firefox', 'webkit', 'chrome', 'msedge'] as const, 'chromium'),
    headless: bool('HEADLESS', true),
    slowMo: num('SLOW_MO', 0),
    viewport: { width: num('VIEWPORT_WIDTH', 1366), height: num('VIEWPORT_HEIGHT', 768) },
    device: process.env.DEVICE?.trim() || undefined,
    screenshot: oneOf('SCREENSHOT', artifactModes, 'on-failure'),
    video: oneOf('VIDEO', artifactModes, 'off'),
    trace: oneOf('TRACE', artifactModes, 'on-failure'),
    timeouts: env.timeouts,
    data: {
      excelFile: path.resolve(ROOT, str('EXCEL_DATA_FILE', 'test-data/test-data.xlsx')),
      sqliteFile: path.resolve(ROOT, str('SQLITE_DATA_FILE', 'test-data/test-data.db')),
      jsonDir: path.resolve(ROOT, str('JSON_DATA_DIR', 'test-data/json')),
      redisUrl: process.env.REDIS_URL?.trim() || undefined,
    },
    logLevel: oneOf('LOG_LEVEL', ['debug', 'info', 'warn', 'error'] as const, 'warn'),
    rootDir: ROOT,
  };
}

/** Single, immutable configuration object shared by the whole framework. */
export const config: Readonly<FrameworkConfig> = Object.freeze(build());
