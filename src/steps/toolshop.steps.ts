import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import { expect } from '../core/expect';
import type { CustomWorld } from '../core/World';
import { ContactPage, type ContactForm } from '../pages/toolshop/ContactPage';
import type { ToolshopSort } from '../pages/toolshop/ToolshopHomePage';

// ---------- Search & catalogue ----------

Given('I am on the Toolshop home page', async function (this: CustomWorld) {
  await this.pages.toolshopHome.open();
});

When('I search the Toolshop for {string}', async function (this: CustomWorld, term: string) {
  await this.pages.toolshopHome.search(term);
});

Then('the search caption should mention {string}', async function (this: CustomWorld, term: string) {
  await expect(this.pages.toolshopHome.caption).toContainText(term);
});

Then('I should see at least {int} search result(s)', async function (this: CustomWorld, min: number) {
  const names = await this.pages.toolshopHome.resultNames();
  this.logger.info(`Results: ${names.join(' | ')}`);
  expect(names.length).toBeGreaterThanOrEqual(min);
});

Then('every search result name should contain {string}', async function (this: CustomWorld, text: string) {
  const names = await this.pages.toolshopHome.resultNames();
  expect(names.length, 'expected at least one result').toBeGreaterThan(0);
  for (const name of names) {
    expect(name.toLowerCase(), `result "${name}"`).toContain(text.toLowerCase());
  }
});

Then('I should see a {string} message', async function (this: CustomWorld, _kind: string) {
  await expect(this.pages.toolshopHome.noResultsMessage).toBeVisible();
  expect(await this.pages.toolshopHome.resultNames()).toHaveLength(0);
});

When('I sort the Toolshop catalogue by {string}', async function (this: CustomWorld, option: string) {
  await this.pages.toolshopHome.sortBy(option as ToolshopSort);
});

Then(
  /^the Toolshop prices should be in (ascending|descending) order$/,
  async function (this: CustomWorld, direction: 'ascending' | 'descending') {
    const prices = await this.pages.toolshopHome.resultPrices();
    const expected = [...prices].sort((a, b) => (direction === 'ascending' ? a - b : b - a));
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual(expected);
  },
);

When('I filter the Toolshop catalogue by the {string} category', async function (this: CustomWorld, category: string) {
  await this.pages.toolshopHome.filterByCategory(category);
});

When('I open the Toolshop product {string}', async function (this: CustomWorld, name: string) {
  await this.pages.toolshopHome.openProduct(name);
  expect(await this.pages.toolshopProduct.productName()).toBe(name);
});

When('I open the first in-stock Toolshop product', async function (this: CustomWorld) {
  const name = await this.pages.toolshopHome.openFirstInStockProduct();
  this.scenario.set('toolshopProduct', name);
});

Then('the Toolshop product page should show the chosen product', async function (this: CustomWorld) {
  const expected = this.scenario.get<string>('toolshopProduct');
  expect(await this.pages.toolshopProduct.productName()).toBe(expected);
});

When('I add the Toolshop product to the cart', async function (this: CustomWorld) {
  await this.pages.toolshopProduct.addToCart();
});

Then('I should see the Toolshop notification {string}', async function (this: CustomWorld, text: string) {
  await expect(this.pages.toolshopProduct.notification.filter({ hasText: text })).toBeVisible();
});

Then('the Toolshop cart should contain {int} item(s)', async function (this: CustomWorld, count: number) {
  await expect(this.pages.toolshopProduct.cartBadge).toHaveText(String(count));
});

// ---------- Contact form ----------

Given('I am on the Toolshop contact page', async function (this: CustomWorld) {
  await this.pages.contact.open();
});

When('I fill in the contact form with:', async function (this: CustomWorld, table: DataTable) {
  const [row] = table.hashes();
  const form: ContactForm = {};
  for (const [label, value] of Object.entries(row)) {
    form[ContactPage.fieldKey(label)] = value;
  }
  await this.pages.contact.fillForm(form);
});

When('I submit the contact form', async function (this: CustomWorld) {
  await this.pages.contact.submit();
});

Then('I should see the following contact form errors:', async function (this: CustomWorld, table: DataTable) {
  for (const { field, message } of table.hashes()) {
    await expect(this.pages.contact.fieldError(ContactPage.fieldKey(field))).toHaveText(message);
  }
});

Then(
  'the {string} field should show the error {string}',
  async function (this: CustomWorld, field: string, message: string) {
    await expect(this.pages.contact.fieldError(ContactPage.fieldKey(field))).toHaveText(message);
  },
);
