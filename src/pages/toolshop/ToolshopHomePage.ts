import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { config } from '../../config/config';
import { BasePage } from '../BasePage';

/** Sort labels exactly as rendered by the Toolshop sort dropdown. */
export type ToolshopSort = 'Name (A - Z)' | 'Name (Z - A)' | 'Price (High - Low)' | 'Price (Low - High)';

/** Product catalogue + search on practicesoftwaretesting.com ("Toolshop"). */
export class ToolshopHomePage extends BasePage {
  protected readonly app = 'toolshop' as const;
  /** Toolshop is slow sometimes (15s+), so its actions get the longer navigation timeout. */
  protected override readonly actionTimeout = config.timeouts.navigation;
  protected readonly path = '/';

  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly searchReset: Locator;
  private readonly searchCaption: Locator;
  private readonly productNames: Locator;
  private readonly productPrices: Locator;
  private readonly sortSelect: Locator;
  private readonly noResults: Locator;
  private readonly filters: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.searchInput = page.locator('[data-test="search-query"]');
    this.searchButton = page.locator('[data-test="search-submit"]');
    this.searchReset = page.locator('[data-test="search-reset"]');
    this.searchCaption = page.locator('[data-test="search-caption"]');
    this.productNames = page.locator('[data-test="product-name"]');
    this.productPrices = page.locator('[data-test="product-price"]');
    this.sortSelect = page.locator('[data-test="sort"]');
    this.noResults = page.locator('[data-test="no-results"]');
    this.filters = page.locator('[data-test="filters"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.productNames.first().waitFor({ state: 'visible', timeout: this.actionTimeout });
    await this.searchInput.waitFor({ state: 'visible', timeout: this.actionTimeout });
    await this.page.waitForLoadState('networkidle', { timeout: this.actionTimeout });
  }

  async search(term: string): Promise<void> {
    await this.step(`Search for "${term}"`, async () => {
      await this.fill(this.searchInput, term, 'search box');
      await this.doAndWaitForProducts(() => this.searchButton.click({ timeout: this.actionTimeout }), '/products/search');
    });
  }

  async clearSearch(): Promise<void> {
    await this.step('Reset the search', async () => {
      await this.doAndWaitForProducts(() => this.searchReset.click({ timeout: this.actionTimeout }), '/products');
    });
  }

  async sortBy(label: ToolshopSort): Promise<void> {
    await this.step(`Sort products by "${label}"`, async () => {
      await this.doAndWaitForProducts(() => this.sortSelect.selectOption({ label }, { timeout: this.actionTimeout }), '/products');
    });
  }

  async filterByCategory(category: string): Promise<void> {
    await this.step(`Filter by category "${category}"`, async () => {
      const checkbox = this.filters.getByLabel(category, { exact: true });
      await this.doAndWaitForProducts(() => checkbox.check({ timeout: this.actionTimeout }), '/products');
    });
  }

  get caption(): Locator {
    return this.searchCaption;
  }

  get noResultsMessage(): Locator {
    return this.noResults;
  }

  async resultNames(): Promise<string[]> {
    return this.texts(this.productNames);
  }

  async resultPrices(): Promise<number[]> {
    return (await this.texts(this.productPrices)).map((p) => this.toPrice(p));
  }

  /**
   * Live demo stock changes over time, so tests that need a purchasable product pick
   * the first card without an "Out of stock" badge instead of hard-coding one.
   * Returns the name of the product that was opened.
   */
  async openFirstInStockProduct(): Promise<string> {
    return this.step('Open the first in-stock product', async () => {
      const card = this.page
        .locator('a[data-test^="product-"]')
        .filter({ hasNot: this.page.locator('[data-test="out-of-stock"]') })
        .first();
      const name = (await card.locator('[data-test="product-name"]').innerText({ timeout: this.actionTimeout })).trim();
      await card.click({ timeout: this.actionTimeout });
      this.logger.info(`Opened in-stock product "${name}"`);
      return name;
    });
  }

  async openProduct(name: string): Promise<void> {
    await this.step(`Open product "${name}"`, async () => {
      await this.productNames.filter({ hasText: name }).first().click({ timeout: this.actionTimeout });
    });
  }

  /**
   * Toolshop gets its product list from the server. After a search, sort or filter:
   *   1. we start listening for the server's answer,
   *   2. we do the action (click / select / check),
   *   3. we wait for the answer, then for the page to finish loading.
   * This is better than a fixed sleep: it waits exactly as long as needed.
   */
  private async doAndWaitForProducts(action: () => Promise<unknown>, apiPath: string): Promise<void> {
    const serverAnswer = this.page.waitForResponse((r) => new URL(r.url()).pathname === apiPath, {
      timeout: this.actionTimeout,
    });
    await action();
    await serverAnswer;
    await this.page.waitForLoadState('networkidle', { timeout: this.actionTimeout });
  }
}
