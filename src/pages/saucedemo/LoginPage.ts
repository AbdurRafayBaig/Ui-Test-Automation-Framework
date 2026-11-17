import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';

export class LoginPage extends BasePage {
  protected readonly app = 'saucedemo' as const;
  protected readonly path = '/';

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorBox: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorBox = page.locator('[data-test="error"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.loginButton.waitFor({ state: 'visible' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.step(`Log in as "${username || '<empty>'}"`, async () => {
      await this.fill(this.usernameInput, username, 'username field');
      await this.fill(this.passwordInput, password, 'password field', true);
      await this.click(this.loginButton, 'Login button');
    });
  }

  async errorMessage(): Promise<string> {
    await this.errorBox.waitFor({ state: 'visible' });
    return (await this.errorBox.innerText()).trim();
  }

  async isDisplayed(): Promise<boolean> {
    return this.loginButton.isVisible();
  }

  get error(): Locator {
    return this.errorBox;
  }
}
