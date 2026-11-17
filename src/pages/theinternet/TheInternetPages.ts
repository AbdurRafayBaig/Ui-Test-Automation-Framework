import * as path from 'node:path';
import type { Dialog, Locator, Page } from 'playwright';
import { config } from '../../config/config';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';

/**
 * Page objects for https://the-internet.herokuapp.com - a catalogue of classic,
 * tricky UI widgets (auth forms, checkboxes, dropdowns, dynamic content, JS dialogs,
 * file upload). Each class is intentionally tiny: one page, one responsibility.
 */

export class SecureLoginPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/login';

  private readonly username: Locator;
  private readonly password: Locator;
  private readonly submitButton: Locator;
  private readonly flashBox: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.flashBox = page.locator('#flash');
    this.logoutButton = page.locator('a[href="/logout"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async login(user: string, pass: string): Promise<void> {
    await this.step(`Submit the login form as "${user}"`, async () => {
      await this.fill(this.username, user, 'username');
      await this.fill(this.password, pass, 'password', true);
      // The Heroku-hosted app can take several seconds to answer: wait for the
      // POST /authenticate round-trip and the resulting page before asserting.
      const authenticated = this.page.waitForResponse((r) => r.url().endsWith('/authenticate'));
      await this.click(this.submitButton, 'Login');
      await authenticated;
      await this.page.waitForLoadState('domcontentloaded');
    });
  }

  async logout(): Promise<void> {
    await this.click(this.logoutButton, 'Logout');
    await this.page.waitForURL(/\/login$/);
  }

  get flash(): Locator {
    return this.flashBox;
  }
}

export class CheckboxesPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/checkboxes';

  private checkbox(index: number): Locator {
    return this.page.locator('#checkboxes input[type="checkbox"]').nth(index - 1);
  }

  async setChecked(index: number, checked: boolean): Promise<void> {
    await this.step(`${checked ? 'Check' : 'Uncheck'} checkbox ${index}`, async () => {
      await this.checkbox(index).setChecked(checked);
    });
  }

  async isChecked(index: number): Promise<boolean> {
    return this.checkbox(index).isChecked();
  }
}

export class DropdownPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/dropdown';

  private get dropdown(): Locator {
    return this.page.locator('#dropdown');
  }

  async select(label: string): Promise<void> {
    await this.step(`Select "${label}" in the dropdown`, async () => {
      await this.dropdown.selectOption({ label });
    });
  }

  async selectedLabel(): Promise<string> {
    return (await this.dropdown.locator('option:checked').innerText()).trim();
  }
}

export class DynamicLoadingPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/dynamic_loading/2';

  async start(): Promise<void> {
    await this.click(this.page.locator('#start button'), 'Start');
  }

  /** Element that only exists after the (slow) async load finishes. */
  get finishText(): Locator {
    return this.page.locator('#finish');
  }

  get loadingIndicator(): Locator {
    return this.page.locator('#loading');
  }
}

export class JavaScriptAlertsPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/javascript_alerts';

  /** Arms a one-shot handler for the next JS dialog, then clicks the trigger button. */
  async trigger(button: 'JS Alert' | 'JS Confirm' | 'JS Prompt', response: 'accept' | 'dismiss', text?: string) {
    await this.step(`Click "Click for ${button}" and ${response} the dialog`, async () => {
      this.page.once('dialog', async (dialog: Dialog) => {
        this.logger.info(`Dialog (${dialog.type()}) says: "${dialog.message()}"`);
        if (response === 'accept') await dialog.accept(text);
        else await dialog.dismiss();
      });
      await this.page.getByRole('button', { name: `Click for ${button}` }).click();
    });
  }

  get result(): Locator {
    return this.page.locator('#result');
  }
}

export class FileUploadPage extends BasePage {
  protected readonly app = 'theinternet' as const;
  protected readonly path = '/upload';

  async upload(relativeFile: string): Promise<void> {
    const absolute = path.resolve(config.rootDir, relativeFile);
    await this.step(`Upload file ${relativeFile}`, async () => {
      await this.page.locator('#file-upload').setInputFiles(absolute);
      await this.page.locator('#file-submit').click();
    });
  }

  get heading(): Locator {
    return this.page.locator('h3');
  }

  get uploadedFiles(): Locator {
    return this.page.locator('#uploaded-files');
  }
}
