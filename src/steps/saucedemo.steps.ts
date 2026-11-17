import { Given, Then, When, type DataTable } from '@cucumber/cucumber';
import { expect } from '../core/expect';
import type { CustomWorld } from '../core/World';
import type { SortLabel } from '../pages/saucedemo/InventoryPage';

const DEFAULT_PASSWORD = 'secret_sauce';

// ---------- Authentication ----------

Given('I am on the SauceDemo login page', async function (this: CustomWorld) {
  await this.pages.login.open();
});

Given('I am logged in to SauceDemo as {string}', async function (this: CustomWorld, username: string) {
  await this.pages.login.open();
  await this.pages.login.login(username, DEFAULT_PASSWORD);
  await this.pages.inventory.waitUntilLoaded();
});

When(
  'I log in with username {string} and password {string}',
  async function (this: CustomWorld, username: string, password: string) {
    await this.pages.login.login(username, password);
  },
);

When('I log out', async function (this: CustomWorld) {
  await this.pages.inventory.header.logout();
});

When('I navigate directly to the inventory page', async function (this: CustomWorld) {
  await this.page.goto(this.pages.inventory.url);
});

Then('I should be on the products page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/inventory\.html$/);
  await this.pages.inventory.waitUntilLoaded();
});

Then('the page heading should be {string}', async function (this: CustomWorld, heading: string) {
  await expect(this.pages.inventory.heading).toHaveText(heading);
});

Then('I should see the login error {string}', async function (this: CustomWorld, message: string) {
  await expect(this.pages.login.error).toHaveText(message);
});

Then('I should still be on the login page', async function (this: CustomWorld) {
  expect(await this.pages.login.isDisplayed()).toBe(true);
  await expect(this.page).not.toHaveURL(/inventory/);
});

// ---------- Catalogue ----------

Then('I should see {int} products', async function (this: CustomWorld, count: number) {
  expect(await this.pages.inventory.itemCount()).toBe(count);
});

Then('the catalogue should contain the following products:', async function (this: CustomWorld, table: DataTable) {
  for (const { name, price } of table.hashes()) {
    expect(await this.pages.inventory.priceOf(name), `price of ${name}`).toBe(Number(price));
  }
});

When('I sort the products by {string}', async function (this: CustomWorld, label: string) {
  await this.pages.inventory.sortBy(label as SortLabel);
});

Then(
  /^the products should be sorted by (name|price) in (ascending|descending) order$/,
  async function (this: CustomWorld, field: 'name' | 'price', direction: 'ascending' | 'descending') {
    const actual: Array<string | number> =
      field === 'name' ? await this.pages.inventory.itemNames() : await this.pages.inventory.itemPrices();
    const expected = [...actual].sort((a, b) =>
      typeof a === 'number' ? a - (b as number) : String(a).localeCompare(String(b)),
    );
    if (direction === 'descending') expected.reverse();
    expect(actual).toEqual(expected);
  },
);

When('I open the details of {string}', async function (this: CustomWorld, product: string) {
  await this.pages.inventory.openProduct(product);
});

Then(
  'the product details should show {string} priced at {float}',
  async function (this: CustomWorld, name: string, price: number) {
    expect(await this.pages.productDetails.productName()).toBe(name);
    expect(await this.pages.productDetails.productPrice()).toBe(price);
  },
);

When('I go back to the products list', async function (this: CustomWorld) {
  await this.pages.productDetails.backToProducts();
});

// ---------- Cart ----------

When('I add {string} to the cart', async function (this: CustomWorld, product: string) {
  await this.pages.inventory.addToCart(product);
});

When('I add the following products to the cart:', async function (this: CustomWorld, table: DataTable) {
  for (const [product] of table.raw()) {
    await this.pages.inventory.addToCart(product);
  }
});

When('I add the product to the cart from the details page', async function (this: CustomWorld) {
  await this.pages.productDetails.addToCart();
});

Then('the cart badge should show {int}', async function (this: CustomWorld, count: number) {
  await expect.poll(() => this.pages.inventory.header.cartCount()).toBe(count);
});

When('I open the cart', async function (this: CustomWorld) {
  await this.pages.inventory.header.openCart();
  await this.pages.cart.waitUntilLoaded();
});

Then('the cart should contain exactly:', async function (this: CustomWorld, table: DataTable) {
  const expected = table.raw().map(([name]) => name);
  await expect.poll(() => this.pages.cart.itemNames()).toEqual(expected);
});

When('I remove {string} from the cart', async function (this: CustomWorld, product: string) {
  await this.pages.cart.removeItem(product);
});

When('I continue shopping', async function (this: CustomWorld) {
  await this.pages.cart.continueShopping();
  await this.pages.inventory.waitUntilLoaded();
});

When('I reset the app state', async function (this: CustomWorld) {
  await this.pages.inventory.header.resetAppState();
});

// ---------- Checkout ----------

When('I start the checkout', async function (this: CustomWorld) {
  await this.pages.cart.checkout();
  await this.pages.checkoutInformation.waitUntilLoaded();
});

When('I submit the checkout form with:', async function (this: CustomWorld, table: DataTable) {
  const [row] = table.hashes();
  await this.pages.checkoutInformation.fillForm({
    firstName: row['first name'] ?? '',
    lastName: row['last name'] ?? '',
    postalCode: row['postal code'] ?? '',
  });
  await this.pages.checkoutInformation.continue();
});

When('I cancel the checkout', async function (this: CustomWorld) {
  await this.pages.checkoutInformation.cancel();
});

Then('I should see the checkout error {string}', async function (this: CustomWorld, message: string) {
  expect(await this.pages.checkoutInformation.errorMessage()).toBe(message);
});

Then('the order overview should list:', async function (this: CustomWorld, table: DataTable) {
  const expected = table.raw().map(([name]) => name);
  expect(await this.pages.checkoutOverview.itemNames()).toEqual(expected);
});

Then('the item total should be {float}', async function (this: CustomWorld, total: number) {
  const { subtotal } = await this.pages.checkoutOverview.summary();
  expect(subtotal).toBeCloseTo(total, 2);
  const prices = await this.pages.checkoutOverview.itemPrices();
  expect(prices.reduce((a, b) => a + b, 0)).toBeCloseTo(subtotal, 2);
});

Then('the order total should equal item total plus tax', async function (this: CustomWorld) {
  const { subtotal, tax, total } = await this.pages.checkoutOverview.summary();
  this.logger.info(`Summary -> subtotal ${subtotal}, tax ${tax}, total ${total}`);
  expect(tax).toBeGreaterThan(0);
  expect(total).toBeCloseTo(subtotal + tax, 2);
});

When('I finish the order', async function (this: CustomWorld) {
  await this.pages.checkoutOverview.finish();
});

Then('I should see the order confirmation {string}', async function (this: CustomWorld, message: string) {
  await expect(this.pages.checkoutComplete.confirmationHeader).toHaveText(message);
});
