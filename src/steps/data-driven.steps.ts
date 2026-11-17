import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '../core/expect';
import type { DataRecord } from '../data/DataProvider';
import { DataManager } from '../data/DataManager';
import type { CustomWorld } from '../core/World';
import { LOADED_RECORD, loadRecord } from './common.steps';

// ---------- Login driven by external data ----------

When('I log in with the loaded user', async function (this: CustomWorld) {
  const user = this.scenario.get<DataRecord>(LOADED_RECORD);
  await this.pages.login.login(user.username, user.password);
});

Then("the login result should match the loaded user's expected outcome", async function (this: CustomWorld) {
  const user = this.scenario.get<DataRecord>(LOADED_RECORD);
  if (user.expected === 'success') {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await this.pages.inventory.waitUntilLoaded();
  } else {
    await expect(this.pages.login.error).toHaveText(user.error_message);
  }
});

// ---------- Checkout driven by external data ----------

Given(
  'I am logged in to SauceDemo with the {string} user from {string}',
  async function (this: CustomWorld, key: string, source: string) {
    const user = await loadRecord(this, source, 'users', key);
    await this.pages.login.open();
    await this.pages.login.login(user.username, user.password);
    await this.pages.inventory.waitUntilLoaded();
  },
);

Given(
  'I add the {string} product from {string} to the cart',
  async function (this: CustomWorld, key: string, source: string) {
    const product = await loadRecord(this, source, 'products', key);
    await this.pages.inventory.addToCart(product.name);
    this.scenario.set('product', product);
  },
);

When(
  'I submit the checkout form with the {string} customer from {string}',
  async function (this: CustomWorld, key: string, source: string) {
    const customer = await loadRecord(this, source, 'customers', key);
    await this.pages.checkoutInformation.fillForm({
      firstName: customer.first_name,
      lastName: customer.last_name,
      postalCode: customer.postal_code,
    });
    await this.pages.checkoutInformation.continue();
  },
);

Then('the checkout should proceed or fail as described by the loaded customer', async function (this: CustomWorld) {
  const customer = this.scenario.get<DataRecord>(LOADED_RECORD);
  const product = this.scenario.get<DataRecord>('product');
  if (customer.error_message) {
    expect(await this.pages.checkoutInformation.errorMessage()).toBe(customer.error_message);
    return;
  }
  expect(await this.pages.checkoutOverview.itemNames()).toEqual([product.name]);
  const { subtotal } = await this.pages.checkoutOverview.summary();
  expect(subtotal).toBeCloseTo(Number(product.price), 2);
  await this.pages.checkoutOverview.finish();
  await expect(this.pages.checkoutComplete.confirmationHeader).toHaveText('Thank you for your order!');
});

// ---------- Search driven by external data ----------

When('I search the Toolshop for the loaded term', async function (this: CustomWorld) {
  const { term } = this.scenario.get<DataRecord>(LOADED_RECORD);
  await this.pages.toolshopHome.search(term);
});

Then('the search results should satisfy the loaded expectations', async function (this: CustomWorld) {
  const { term, min_results } = this.scenario.get<DataRecord>(LOADED_RECORD);
  const names = await this.pages.toolshopHome.resultNames();
  expect(names.length).toBeGreaterThanOrEqual(Number(min_results));
  names.forEach((name) => expect(name.toLowerCase()).toContain(term.toLowerCase()));
});

// ---------- Whole-dataset verification ----------

Then(
  'every product in the {string} dataset from {string} should be listed with the stored price',
  async function (this: CustomWorld, dataset: string, source: string) {
    const products = await DataManager.getRecords(source, dataset);
    expect(products.length).toBeGreaterThan(0);
    for (const product of products) {
      expect(await this.pages.inventory.priceOf(product.name), product.name).toBe(Number(product.price));
    }
  },
);
