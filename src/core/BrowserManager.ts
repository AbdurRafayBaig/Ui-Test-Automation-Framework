import * as path from 'node:path';
import {
  chromium,
  devices,
  firefox,
  webkit,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type BrowserType,
  type LaunchOptions,
} from 'playwright';
import { config, type BrowserName } from '../config/config';

/** Resolves a framework browser name to a Playwright engine + optional branded channel. */
function resolveEngine(name: BrowserName): { type: BrowserType; channel?: string } {
  switch (name) {
    case 'firefox':
      return { type: firefox };
    case 'webkit':
      return { type: webkit };
    case 'chrome':
      return { type: chromium, channel: 'chrome' };
    case 'msedge':
      return { type: chromium, channel: 'msedge' };
    default:
      return { type: chromium };
  }
}

/**
 * Owns the Browser instance (one per cucumber worker process) and hands out
 * fresh, isolated BrowserContexts for each scenario.
 */
export class BrowserManager {
  private static browser?: Browser;

  static async launch(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    const { type, channel } = resolveEngine(config.browser);
    const options: LaunchOptions = {
      headless: config.headless,
      slowMo: config.slowMo,
      channel,
    };
    this.browser = await type.launch(options);
    return this.browser;
  }

  static async newContext(scenarioId: string): Promise<BrowserContext> {
    const browser = await this.launch();
    const deviceOptions = config.device ? devices[config.device] : undefined;
    if (config.device && !deviceOptions) {
      throw new Error(`Unknown DEVICE "${config.device}". See Playwright's device registry.`);
    }

    const options: BrowserContextOptions = {
      viewport: config.viewport,
      ignoreHTTPSErrors: true,
      ...(deviceOptions ?? {}),
    };
    // Firefox does not support the isMobile option used by many device descriptors.
    if (config.browser === 'firefox') delete options.isMobile;

    if (config.video !== 'off') {
      options.recordVideo = {
        dir: path.join(config.rootDir, 'reports', 'videos', scenarioId),
        size: options.viewport ?? config.viewport,
      };
    }

    const context = await browser.newContext(options);
    context.setDefaultTimeout(config.timeouts.action);
    context.setDefaultNavigationTimeout(config.timeouts.navigation);
    return context;
  }

  static async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }

  static get browserVersion(): string {
    return this.browser?.version() ?? 'unknown';
  }
}
