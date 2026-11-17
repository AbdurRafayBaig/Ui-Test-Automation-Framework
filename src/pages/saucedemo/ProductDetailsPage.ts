import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';
import { HeaderComponent } from './HeaderComponent';

export class ProductDetailsPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/inventory-item.html';

  readonly header: HeaderComponent;
  private readonly name: Locator;
  private readonly price: Locator;
  private readonly description: Locator;
  private readonly addButton: Locator;
  private readonly backButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.header = new HeaderComponent(page, logger);
    this.name = page.locator('.inventory_details_container [data-test="inventory-item-name"]');
    this.price = page.locator('.inventory_details_container [data-test="inventory-item-price"]');
    this.description = page.locator('.inventory_details_container [data-test="inventory-item-desc"]');
    this.addButton = page.locator('[data-test="add-to-cart"]');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.name.waitFor({ state: 'visible' });
  }

  async productName(): Promise<string> {
    await this.waitUntilLoaded();
    return (await this.name.innerText()).trim();
  }

  async productPrice(): Promise<number> {
    return this.toPrice(await this.price.innerText());
  }

  async productDescription(): Promise<string> {
    return (await this.description.innerText()).trim();
  }

  async addToCart(): Promise<void> {
    await this.click(this.addButton, '"Add to cart" on the details page');
  }

  async backToProducts(): Promise<void> {
    await this.click(this.backButton, '"Back to products"');
  }
}
