import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';

/** Sort labels exactly as rendered by the Toolshop sort dropdown. */
export type ToolshopSort = 'Name (A - Z)' | 'Name (Z - A)' | 'Price (High - Low)' | 'Price (Low - High)';

/** Product catalogue + search on practicesoftwaretesting.com ("Toolshop"). */
export class ToolshopHomePage extends BasePage {
  protected readonly app = 'toolshop' as const;
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
    await this.productNames.first().waitFor({ state: 'visible' });
  }

  async search(term: string): Promise<void> {
    await this.step(`Search for "${term}"`, async () => {
      await this.fill(this.searchInput, term, 'search box');
      await this.reloadingProducts(() => this.searchButton.click(), '/products/search');
    });
  }

  async clearSearch(): Promise<void> {
    await this.step('Reset the search', async () => {
      await this.reloadingProducts(() => this.searchReset.click(), '/products');
    });
  }

  async sortBy(label: ToolshopSort): Promise<void> {
    await this.step(`Sort products by "${label}"`, async () => {
      await this.reloadingProducts(() => this.sortSelect.selectOption({ label }).then(() => undefined), '/products');
    });
  }

  async filterByCategory(category: string): Promise<void> {
    await this.step(`Filter by category "${category}"`, async () => {
      const checkbox = this.filters.getByLabel(category, { exact: true });
      await this.reloadingProducts(() => checkbox.check(), '/products');
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
      const name = (await card.locator('[data-test="product-name"]').innerText()).trim();
      await card.click();
      this.logger.info(`Opened in-stock product "${name}"`);
      return name;
    });
  }

  async openProduct(name: string): Promise<void> {
    await this.step(`Open product "${name}"`, async () => {
      await this.productNames.filter({ hasText: name }).first().click();
    });
  }

  /**
   * The catalogue is an Angular SPA that re-renders after an API call. Waiting for
   * that response (instead of a fixed sleep) keeps the tests both fast and stable.
   */
  private async reloadingProducts(action: () => Promise<void>, apiPath: string): Promise<void> {
    // Note: the Toolshop API uses the HTTP QUERY method, so we match on the URL only.
    const response = this.page.waitForResponse(
      (r) => new URL(r.url()).pathname === apiPath && r.request().resourceType() !== 'document',
      { timeout: 30000 },
    );
    await action();
    await (await response).finished();
    await this.waitForStableResults();
  }

  /** Waits until the rendered result list stops changing (Angular re-render finished). */
  private async waitForStableResults(): Promise<void> {
    const results = this.page.locator('[data-test="product-name"], [data-test="no-results"]');
    await results.first().waitFor();
    let previous = '';
    for (let i = 0; i < 20; i++) {
      const current = (await results.allInnerTexts()).join('|');
      if (current === previous) return;
      previous = current;
      await this.page.waitForTimeout(250);
    }
  }
}
