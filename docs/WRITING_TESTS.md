# Writing a new test

Every test is made of three parts. Example: **"change the quantity on the product page"**.

| Part | Folder | What goes in it |
|---|---|---|
| 1. Feature file | `features/` | The test in plain English (Gherkin) |
| 2. Step definitions | `features/steps/` | Python code for each English line |
| 3. Page object | `pages/` | Where the buttons are on the page and what you can do there |

## 1. The feature file

```gherkin
# features/product_details.feature
@product
Feature: Product details

  @regression
  Scenario: Buy three of one product
    Given I am on the details page of product 1
    When I set the quantity to 3 and add it to the cart
    And I open the cart
    Then the quantity of "Blue Top" should be 3
```

Rules:
- Write what the user does and sees, not how (no CSS selectors in Gherkin).
- Add a speed tag (`@smoke` for the most important tests, otherwise `@regression`) and a feature tag. New tags must be added under `markers` in `pytest.ini`.
- Same steps with different data? Use a `Scenario Outline` with an `Examples:` table.

## 2. The page object

```python
# pages/product_details_page.py
import allure
from playwright.sync_api import Page

from pages.base_page import BasePage, log


class ProductDetailsPage(BasePage):
    URL = "/product_details/1"

    def __init__(self, page: Page):
        super().__init__(page)
        self.quantity_input = page.locator("#quantity")
        self.add_to_cart_button = page.locator("button.cart")
        self.continue_shopping_button = page.locator("#cartModal button.close-modal")

    @allure.step("Add {quantity} to the cart")
    def add_quantity_to_cart(self, quantity: int):
        log.info("Add %s to the cart", quantity)
        self.quantity_input.fill(str(quantity))
        self.add_to_cart_button.click()
        self.continue_shopping_button.click()
```

Rules:
- Selectors live **only** in page objects. Prefer `data-qa` attributes and ids.
- A page object does things and returns things. It does **not** check results (no `expect` / `assert`).
- Put `@allure.step(...)` on each action so it shows in the report.

## 3. The step definitions

```python
# features/steps/product_details_steps.py
import pytest
from playwright.sync_api import expect
from pytest_bdd import given, parsers, scenarios, then, when

from pages.product_details_page import ProductDetailsPage

scenarios("product_details.feature")      # turns every scenario into a pytest test


@pytest.fixture
def details_page(page):
    return ProductDetailsPage(page)


@given("I am on the details page of product 1")
def open_details(details_page):
    details_page.open()


@when(parsers.parse("I set the quantity to {quantity:d} and add it to the cart"))
def add_quantity(details_page, quantity):
    details_page.add_quantity_to_cart(quantity)


@then(parsers.parse('the quantity of "{product}" should be {quantity:d}'))
def check_quantity(cart_page, product, quantity):
    expect(cart_page.quantity_of(product)).to_have_text(str(quantity))
```

Rules:
- Steps are short: call the page object, then check with `expect(...)`.
- `parsers.parse` takes values out of the sentence: `{product}` is text, `{quantity:d}` is a number.
- Steps used by several feature files go in `features/steps/conftest.py` (for example "I am on the login page" and "I open the cart").
- Use Playwright's `expect(...)`: it waits until the condition is true (up to 5 seconds), so no `sleep` is needed.

## 4. Test data from Excel / SQLite / Redis

1. Add the record to the JSON file in `test_data/` (every record needs a unique `"key"`).
2. Run `python test_data/create_test_data.py` to copy it into Excel and SQLite.
3. In a step: `get_record("excel", "users", "valid_user")` from `utils.data_reader`.

## 5. Run it

```bash
pytest -m product --headed
```
