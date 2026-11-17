import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';
import { HeaderComponent } from './HeaderComponent';

/** Visible labels of the sort dropdown, used directly in feature files. */
export const SORT_OPTIONS = {
  'Name (A to Z)': 'az',
  'Name (Z to A)': 'za',
  'Price (low to high)': 'lohi',
  'Price (high to low)': 'hilo',
} as const;
export type SortLabel = keyof typeof SORT_OPTIONS;

export class InventoryPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/inventory.html';

  readonly header: HeaderComponent;
  private readonly pageTitle: Locator;
  private readonly items: Locator;
  private readonly sortSelect: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.header = new HeaderComponent(page, logger);
    this.pageTitle = page.locator('[data-test="title"]');
    this.items = page.locator('[data-test="inventory-item"]');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.items.first().waitFor({ state: 'visible' });
  }

  get heading(): Locator {
    return this.pageTitle;
  }

  async itemNames(): Promise<string[]> {
    return this.texts(this.items.locator('[data-test="inventory-item-name"]'));
  }

  async itemPrices(): Promise<number[]> {
    const prices = await this.texts(this.items.locator('[data-test="inventory-item-price"]'));
    return prices.map((p) => this.toPrice(p));
  }

  async itemCount(): Promise<number> {
    return this.items.count();
  }

  async priceOf(productName: string): Promise<number> {
    const text = await this.itemCard(productName).locator('[data-test="inventory-item-price"]').innerText();
    return this.toPrice(text);
  }

  async sortBy(label: SortLabel): Promise<void> {
    await this.step(`Sort products by "${label}"`, async () => {
      const value = SORT_OPTIONS[label];
      if (!value) throw new Error(`Unknown sort option "${label}". Use one of: ${Object.keys(SORT_OPTIONS).join(', ')}`);
      await this.sortSelect.selectOption(value);
    });
  }

  async addToCart(productName: string): Promise<void> {
    await this.step(`Add "${productName}" to the cart`, async () => {
      await this.itemCard(productName).getByRole('button', { name: 'Add to cart' }).click();
    });
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from the cart (inventory page)`, async () => {
      await this.itemCard(productName).getByRole('button', { name: 'Remove' }).click();
    });
  }

  async openProduct(productName: string): Promise<void> {
    await this.step(`Open product details for "${productName}"`, async () => {
      await this.itemCard(productName).locator('[data-test="inventory-item-name"]').click();
    });
  }

  private itemCard(productName: string): Locator {
    return this.items.filter({
      has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }),
    });
  }
}
