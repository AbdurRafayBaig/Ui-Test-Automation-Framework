import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '../core/expect';
import type { CustomWorld } from '../core/World';

// ---------- Form authentication ----------

Given('I open the secure login form', async function (this: CustomWorld) {
  await this.pages.secureLogin.open();
});

When(
  'I submit the secure login form with {string} and {string}',
  async function (this: CustomWorld, username: string, password: string) {
    await this.pages.secureLogin.login(username, password);
  },
);

When('I log out of the secure area', async function (this: CustomWorld) {
  await this.pages.secureLogin.logout();
});

Then('I should see a flash message containing {string}', async function (this: CustomWorld, text: string) {
  // The Heroku-hosted demo can be slow to redirect, so allow extra time here.
  await expect(this.pages.secureLogin.flash).toContainText(text, { timeout: 20000 });
});

// ---------- Checkboxes ----------

Given('I open the checkboxes page', async function (this: CustomWorld) {
  await this.pages.checkboxes.open();
});

When(/^I (check|uncheck) checkbox (\d+)$/, async function (this: CustomWorld, action: string, index: string) {
  await this.pages.checkboxes.setChecked(Number(index), action === 'check');
});

Then(
  /^checkbox (\d+) should be (checked|unchecked)$/,
  async function (this: CustomWorld, index: string, state: string) {
    expect(await this.pages.checkboxes.isChecked(Number(index))).toBe(state === 'checked');
  },
);

// ---------- Dropdown ----------

Given('I open the dropdown page', async function (this: CustomWorld) {
  await this.pages.dropdown.open();
});

When('I select {string} from the dropdown', async function (this: CustomWorld, option: string) {
  await this.pages.dropdown.select(option);
});

Then('the dropdown should show {string} as selected', async function (this: CustomWorld, option: string) {
  expect(await this.pages.dropdown.selectedLabel()).toBe(option);
});

// ---------- Dynamic loading ----------

Given('I open the dynamic loading page', async function (this: CustomWorld) {
  await this.pages.dynamicLoading.open();
});

When('I start the dynamic loading', async function (this: CustomWorld) {
  await this.pages.dynamicLoading.start();
});

Then('the text {string} should eventually appear', async function (this: CustomWorld, text: string) {
  // Auto-waiting assertion: no sleeps, generous timeout for the deliberately slow page.
  await expect(this.pages.dynamicLoading.finishText).toHaveText(text, { timeout: 20000 });
  await expect(this.pages.dynamicLoading.loadingIndicator).toBeHidden();
});

// ---------- JavaScript dialogs ----------

Given('I open the JavaScript alerts page', async function (this: CustomWorld) {
  await this.pages.jsAlerts.open();
});

When(
  /^I trigger the "(JS Alert|JS Confirm|JS Prompt)" dialog and (accept|dismiss) it with text "(.*)"$/,
  async function (this: CustomWorld, dialog: 'JS Alert' | 'JS Confirm' | 'JS Prompt', action: 'accept' | 'dismiss', text: string) {
    await this.pages.jsAlerts.trigger(dialog, action, text || undefined);
  },
);

Then('the dialog result should be {string}', async function (this: CustomWorld, result: string) {
  await expect(this.pages.jsAlerts.result).toHaveText(result);
});

// ---------- File upload ----------

Given('I open the file upload page', async function (this: CustomWorld) {
  await this.pages.fileUpload.open();
});

When('I upload the file {string}', async function (this: CustomWorld, file: string) {
  await this.pages.fileUpload.upload(file);
});

Then('the upload should succeed for {string}', async function (this: CustomWorld, fileName: string) {
  await expect(this.pages.fileUpload.heading).toHaveText('File Uploaded!');
  await expect(this.pages.fileUpload.uploadedFiles).toHaveText(fileName);
});
