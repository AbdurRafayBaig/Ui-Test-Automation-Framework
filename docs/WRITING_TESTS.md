# Writing tests

A new test touches up to three layers, always in this order:

```
1. features/<area>/<name>.feature   →  WHAT the behaviour is (Gherkin, business language)
2. src/steps/<area>.steps.ts        →  glue: Gherkin sentence → page-object calls + assertions
3. src/pages/<app>/<Page>.ts        →  HOW to drive the UI (selectors and actions)
```

Most new scenarios only need step 1 because the steps already exist. Run `npm run lint:features` to check: it lists any undefined steps and prints snippets for them.

---

## Worked example: "remove an item from the cart"

### 1. Feature file

```gherkin
# features/saucedemo/cart.feature
@saucedemo @epic:E-Commerce @feature:Shopping-Cart
Feature: Shopping cart

  Background:
    Given I am logged in to SauceDemo as "standard_user"

  @regression @severity:normal
  Scenario: Remove a product from the cart
    Given I add the following products to the cart:
      | Sauce Labs Backpack |
      | Sauce Labs Onesie   |
    And I open the cart
    When I remove "Sauce Labs Onesie" from the cart
    Then the cart should contain exactly:
      | Sauce Labs Backpack |
    And the cart badge should show 1
```

Guidelines:
- Write from the user's point of view ("I add ... to the cart"), not the UI's ("I click button #add-1").
- Keep **one behaviour per scenario**, use `Background` for shared preconditions, and use Data Tables for lists.
- Tag every scenario (see [Tags](#tags)).

### 2. Step definitions

```ts
// src/steps/saucedemo.steps.ts
import { Then, When, type DataTable } from '@cucumber/cucumber';
import { expect } from '../core/expect';          // pre-configured Playwright expect
import type { CustomWorld } from '../core/World';

When('I remove {string} from the cart', async function (this: CustomWorld, product: string) {
  await this.pages.cart.removeItem(product);      // delegate to the page object
});

Then('the cart should contain exactly:', async function (this: CustomWorld, table: DataTable) {
  const expected = table.raw().map(([name]) => name);
  await expect.poll(() => this.pages.cart.itemNames()).toEqual(expected);   // assert here
});
```

Rules:
- Use `function`, **not** arrow functions, so `this` is the Cucumber World.
- **No selectors in steps.** Call page objects through `this.pages.<page>`.
- **Assertions belong in steps**, not in page objects. Use web-first assertions (`toHaveText`, `toBeVisible`, `expect.poll`), which retry automatically, instead of `waitForTimeout`.
- Use Cucumber expressions (`{string}`, `{int}`, `{float}`) and only fall back to regex for alternatives such as `(ascending|descending)`.
- Share state between steps with `this.scenario.set(key, value)` / `this.scenario.get<T>(key)`.

### 3. Page object

```ts
// src/pages/saucedemo/CartPage.ts
export class CartPage extends BasePage {
  protected readonly app = 'saucedemo' as const;   // picks the base URL from config
  protected readonly path = '/cart.html';

  private readonly items: Locator;

  constructor(page: Page, logger: Logger) {
    super(page, logger);
    this.items = page.locator('[data-test="inventory-item"]');
  }

  async removeItem(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from the cart`, async () => {   // → Allure step + log
      await this.items.filter({ hasText: productName }).getByRole('button', { name: 'Remove' }).click();
    });
  }

  async itemNames(): Promise<string[]> {
    return this.texts(this.items.locator('[data-test="inventory-item-name"]'));
  }
}
```

Then add it once to `src/pages/PageManager.ts`:

```ts
readonly cart: CartPage;                     // 1. a property
this.cart = new CartPage(page, logger);      // 2. one line in the constructor
```

Locator priority: `data-test` / `data-testid`, then `getByRole` / `getByLabel`, then a stable id. Avoid long CSS chains and XPath.

---

## Scenario Outline (data-driven, inline)

```gherkin
Scenario Outline: Sort products by <sort>
  When I sort the products by "<sort>"
  Then the products should be sorted by <field> in <direction> order

  Examples:
    | sort                | field | direction  |
    | Name (A to Z)       | name  | ascending  |
    | Price (high to low) | price | descending |
```

Each Examples row becomes its own test in the report. `<column>` placeholders can appear in the scenario title, in steps and in tables.

## Data-driven from Excel / DB / Redis / JSON

The Examples table holds only **which source** and **which record**. The values are loaded at run time:

```gherkin
Scenario Outline: Login outcome for "<user>" from <source>
  Given I am on the SauceDemo login page
  And I load the "users" record "<user>" from the "<source>" data source
  When I log in with the loaded user
  Then the login result should match the loaded user's expected outcome

  @excel
  Examples:
    | source | user       |
    | excel  | standard   |
  @sqlite
  Examples:
    | source | user           |
    | sqlite | wrong_password |
```

- `I load the "<dataset>" record "<key>" from the "<source>" data source` is a generic step usable in any feature. The record is stored in the scenario context and attached to the Allure report as JSON.
- Inside a custom step you can call the API directly:

```ts
import { DataManager } from '../data/DataManager';
const customer = await DataManager.getRecord('sqlite', 'customers', 'valid_us');
const allProducts = await DataManager.getRecords('excel', 'products');
```

To add data: edit `test-data/json/<dataset>.json`, then run `npm run data:seed` (and `npm run data:seed:redis` for a real Redis). See [DATA_SOURCES.md](DATA_SOURCES.md).

## Tags

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path, runs on every pull request (keep it under ~2 min) |
| `@regression` | Full suite, runs on every merge to `main` and nightly |
| `@negative` | Error / validation path |
| `@e2e` | Crosses several pages end to end |
| `@data-driven`, `@excel`, `@sqlite`, `@redis`, `@json` | External test data |
| `@saucedemo`, `@toolshop`, `@theinternet` | Application under test |
| `@epic:<Name>`, `@feature:<Name>`, `@story:<Name>` | Grouping in the Allure "Behaviors" view |
| `@severity:blocker\|critical\|normal\|minor\|trivial` | Allure severity |
| `@issue:<number>` | Link to a GitHub issue in the report |
| `@wip` | Work in progress: excluded by default, run with `npm run test:wip` |

Tag expressions: `npx cucumber-js --tags "@smoke and not @toolshop"`, `--tags "(@excel or @sqlite) and @negative"`.

## Adding a new application

1. Add its base URL to every `config/environments/*.json` under `apps`, and add the name to the `AppName` type in `src/config/config.ts`.
2. Create `src/pages/<app>/` with page classes that extend `BasePage` and set `app = '<app>'`.
3. Register the pages in `PageManager`.
4. Add `src/steps/<app>.steps.ts` and `features/<app>/*.feature`.

## Debugging

- `npm run test:headed`: watch the browser.
- `TRACE=on npx cucumber-js features/...:LINE`, then open the trace from the Allure attachment or with `npx playwright show-trace reports/traces/<file>.zip`. You get a time-travel view of every action, DOM snapshot and network call.
- `LOG_LEVEL=debug` prints the scenario log (including browser console errors) to the terminal.
- `PWDEBUG=1 npx cucumber-js features/...:LINE` opens the Playwright Inspector.
