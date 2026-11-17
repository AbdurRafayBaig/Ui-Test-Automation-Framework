import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';
import { HeaderComponent } from './HeaderComponent';

export class CartPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/cart.html';

  readonly header: HeaderComponent;
  private readonly items: Locator;
  private readonly checkoutButton: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.header = new HeaderComponent(page, logger);
    this.items = page.locator('[data-test="inventory-item"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.checkoutButton.waitFor({ state: 'visible' });
  }

  async itemNames(): Promise<string[]> {
    await this.waitUntilLoaded();
    return this.texts(this.items.locator('[data-test="inventory-item-name"]'));
  }

  async removeItem(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from the cart`, async () => {
      await this.items
        .filter({ hasText: productName })
        .getByRole('button', { name: 'Remove' })
        .click();
    });
  }

  async checkout(): Promise<void> {
    await this.click(this.checkoutButton, 'Checkout');
  }

  async continueShopping(): Promise<void> {
    await this.click(this.continueShoppingButton, 'Continue Shopping');
  }
}
