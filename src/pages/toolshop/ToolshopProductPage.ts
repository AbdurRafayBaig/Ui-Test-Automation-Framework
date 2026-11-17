import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { config } from '../../config/config';
import { BasePage } from '../BasePage';

export class ToolshopProductPage extends BasePage {
  protected readonly app = 'toolshop' as const;
  /** Toolshop's API can take 15s+ to answer under load (Cloudflare-fronted demo), so allow the navigation timeout. */
  protected override readonly actionTimeout = config.timeouts.navigation;
  protected readonly path = '/product';

  private readonly name: Locator;
  private readonly price: Locator;
  private readonly quantityInput: Locator;
  private readonly increaseButton: Locator;
  private readonly addToCartButton: Locator;
  private readonly cartQuantity: Locator;
  private readonly toast: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.name = page.locator('[data-test="product-name"]');
    this.price = page.locator('[data-test="unit-price"]');
    this.quantityInput = page.locator('[data-test="quantity"]');
    this.increaseButton = page.locator('[data-test="increase-quantity"]');
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.cartQuantity = page.locator('[data-test="cart-quantity"]');
    this.toast = page.getByRole('alert');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.addToCartButton.waitFor({ state: 'visible', timeout: this.actionTimeout });
  }

  async productName(): Promise<string> {
    await this.waitUntilLoaded();
    return (await this.name.innerText()).trim();
  }

  async unitPrice(): Promise<number> {
    return this.toPrice(await this.price.innerText());
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.fill(this.quantityInput, String(quantity), 'quantity');
  }

  async increaseQuantity(times = 1): Promise<void> {
    await this.step(`Increase quantity ${times} time(s)`, async () => {
      for (let i = 0; i < times; i++) await this.increaseButton.click({ timeout: this.actionTimeout });
    });
  }

  async addToCart(): Promise<void> {
    await this.click(this.addToCartButton, 'Add to cart');
  }

  get cartBadge(): Locator {
    return this.cartQuantity;
  }

  get notification(): Locator {
    return this.toast;
  }
}
