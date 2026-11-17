import type { Locator, Page } from 'playwright';
import type { Logger } from '../../core/Logger';
import { BasePage } from '../BasePage';

export interface ContactForm {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

/** Field names used in feature files -> data-test ids of the inputs. */
const FIELDS: Record<keyof ContactForm, string> = {
  firstName: 'first-name',
  lastName: 'last-name',
  email: 'email',
  subject: 'subject',
  message: 'message',
};

export class ContactPage extends BasePage {
  protected readonly app = 'toolshop' as const;
  protected readonly path = '/contact';

  private readonly submitButton: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.submitButton = page.locator('[data-test="contact-submit"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async fillForm(form: ContactForm): Promise<void> {
    await this.step('Fill in the contact form', async () => {
      for (const [field, value] of Object.entries(form) as Array<[keyof ContactForm, string | undefined]>) {
        if (value === undefined || value === '') continue;
        const input = this.page.locator(`[data-test="${FIELDS[field]}"]`);
        if (field === 'subject') {
          await input.selectOption({ label: value });
        } else {
          await this.fill(input, value, field);
        }
      }
    });
  }

  async submit(): Promise<void> {
    await this.click(this.submitButton, 'Send');
  }

  /** Validation message shown under a field, e.g. fieldError('email'). */
  fieldError(field: keyof ContactForm): Locator {
    return this.page.locator(`[data-test="${FIELDS[field]}-error"]`);
  }

  /** All validation messages currently on screen. */
  async allErrors(): Promise<string[]> {
    return this.texts(this.page.locator('[data-test$="-error"]'));
  }

  static fieldKey(label: string): keyof ContactForm {
    const map: Record<string, keyof ContactForm> = {
      'first name': 'firstName',
      'last name': 'lastName',
      email: 'email',
      subject: 'subject',
      message: 'message',
    };
    const key = map[label.trim().toLowerCase()];
    if (!key) throw new Error(`Unknown contact form field "${label}"`);
    return key;
  }
}
