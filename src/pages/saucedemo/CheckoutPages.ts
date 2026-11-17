import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** Step 1 of checkout: the customer information form. */
export class CheckoutInformationPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/checkout-step-one.html';

  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorBox: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.firstName = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.postalCode = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorBox = page.locator('[data-test="error"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.continueButton.waitFor({ state: 'visible' });
  }

  async fillForm(info: CustomerInfo): Promise<void> {
    await this.step('Fill in the checkout information form', async () => {
      await this.fill(this.firstName, info.firstName, 'First Name');
      await this.fill(this.lastName, info.lastName, 'Last Name');
      await this.fill(this.postalCode, info.postalCode, 'Zip/Postal Code');
    });
  }

  async continue(): Promise<void> {
    await this.click(this.continueButton, 'Continue');
  }

  async cancel(): Promise<void> {
    await this.click(this.cancelButton, 'Cancel');
  }

  async errorMessage(): Promise<string> {
    await this.errorBox.waitFor({ state: 'visible' });
    return (await this.errorBox.innerText()).trim();
  }
}

/** Step 2 of checkout: order overview with price summary. */
export class CheckoutOverviewPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/checkout-step-two.html';

  private readonly items: Locator;
  private readonly subtotal: Locator;
  private readonly tax: Locator;
  private readonly total: Locator;
  private readonly finishButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.items = page.locator('[data-test="inventory-item"]');
    this.subtotal = page.locator('[data-test="subtotal-label"]');
    this.tax = page.locator('[data-test="tax-label"]');
    this.total = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.finishButton.waitFor({ state: 'visible' });
  }

  async itemNames(): Promise<string[]> {
    await this.waitUntilLoaded();
    return this.texts(this.items.locator('[data-test="inventory-item-name"]'));
  }

  async itemPrices(): Promise<number[]> {
    const prices = await this.texts(this.items.locator('[data-test="inventory-item-price"]'));
    return prices.map((p) => this.toPrice(p));
  }

  async summary(): Promise<{ subtotal: number; tax: number; total: number }> {
    await this.waitUntilLoaded();
    return {
      subtotal: this.toPrice(await this.subtotal.innerText()),
      tax: this.toPrice(await this.tax.innerText()),
      total: this.toPrice(await this.total.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.click(this.finishButton, 'Finish');
  }
}

/** Final page shown after a successful order. */
export class CheckoutCompletePage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/checkout-complete.html';

  private readonly header: Locator;
  private readonly text: Locator;
  private readonly backHomeButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.header = page.locator('[data-test="complete-header"]');
    this.text = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  get confirmationHeader(): Locator {
    return this.header;
  }

  async confirmationText(): Promise<string> {
    return (await this.text.innerText()).trim();
  }

  async backHome(): Promise<void> {
    await this.click(this.backHomeButton, 'Back Home');
  }
}
