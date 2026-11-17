import type { Locator, Page } from 'playwright';
import * as allure from 'allure-js-commons';
import { config, type AppName } from '../config/config';
import type { Logger } from '../core/Logger';

/**
 * Parent of every page object. Holds the Playwright Page, knows which application
 * (and therefore which base URL) it belongs to, and offers a few reusable,
 * logged + reported building blocks so concrete pages stay small and readable.
 *
 * Rule of thumb: page objects expose *intent* (login, addToCart) and *queries*
 * (errorMessage, itemNames). Assertions live in step definitions.
 */
export abstract class BasePage {
  /** Application this page belongs to; selects the base URL from config. */
  protected abstract readonly app: AppName;
  /** Path relative to the application's base URL. */
  protected abstract readonly path: string;
  /**
   * Timeout for this page's own actions and load checks. `undefined` means the global
   * action timeout from config. Pages of slow applications override it.
   */
  protected readonly actionTimeout: number | undefined = undefined;

  constructor(
    protected readonly page: Page,
    protected readonly logger: Logger,
  ) {}

  get url(): string {
    return new URL(this.path, config.apps[this.app]).toString();
  }

  /** Navigate directly to this page. */
  async open(): Promise<void> {
    await this.step(`Open ${this.constructor.name} (${this.url})`, async () => {
      await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
      await this.waitUntilLoaded();
    });
  }

  /** Override when a page needs a specific element before it is usable. */
  async waitUntilLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  currentUrl(): string {
    return this.page.url();
  }

  /** Runs `body` as a named, nested Allure step and writes it to the scenario log. */
  protected async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    this.logger.info(name);
    return allure.step(name, body);
  }

  protected async fill(locator: Locator, value: string, label: string, secret = false): Promise<void> {
    await this.step(`Type "${secret ? '*****' : value}" into ${label}`, async () => {
      await locator.fill(value, { timeout: this.actionTimeout });
    });
  }

  protected async click(locator: Locator, label: string): Promise<void> {
    await this.step(`Click ${label}`, async () => {
      await locator.click({ timeout: this.actionTimeout });
    });
  }

  /** innerText of every element matched by `locator`, trimmed. */
  protected async texts(locator: Locator): Promise<string[]> {
    return (await locator.allInnerTexts()).map((t) => t.trim());
  }

  /** Parses "$29.99" / "Item total: $29.99" style strings into numbers. */
  protected toPrice(text: string): number {
    const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (!match) throw new Error(`Cannot parse a price from "${text}"`);
    return Number(match[0]);
  }
}
