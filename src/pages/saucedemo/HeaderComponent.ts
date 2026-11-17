import type { Locator, Page } from 'playwright';
import * as allure from 'allure-js-commons';
import type { Logger } from '../../core/Logger';

/**
 * Component object for the header shared by every logged-in SauceDemo page
 * (cart icon + burger menu). Composed into page objects instead of duplicated.
 */
export class HeaderComponent {
  private readonly cartLink: Locator;
  private readonly cartBadge: Locator;
  private readonly menuButton: Locator;
  private readonly logoutLink: Locator;
  private readonly resetLink: Locator;
  private readonly closeMenuButton: Locator;

  constructor(
    page: Page,
    private readonly logger: Logger,
  ) {
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
    this.resetLink = page.locator('[data-test="reset-sidebar-link"]');
    this.closeMenuButton = page.locator('#react-burger-cross-btn');
  }

  /** Number shown on the cart badge (0 when the badge is hidden). */
  async cartCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number((await this.cartBadge.innerText()).trim());
  }

  async openCart(): Promise<void> {
    await this.run('Open the shopping cart', () => this.cartLink.click());
  }

  async logout(): Promise<void> {
    await this.run('Log out via the side menu', async () => {
      await this.menuButton.click();
      await this.logoutLink.click();
    });
  }

  async resetAppState(): Promise<void> {
    await this.run('Reset app state via the side menu', async () => {
      await this.menuButton.click();
      await this.resetLink.click();
      await this.closeMenuButton.click();
    });
  }

  private async run(name: string, body: () => Promise<void>): Promise<void> {
    this.logger.info(name);
    await allure.step(name, body);
  }
}
