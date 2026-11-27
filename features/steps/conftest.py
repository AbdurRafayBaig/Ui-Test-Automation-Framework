"""Page-object fixtures and the steps that several feature files share."""

import pytest
from playwright.sync_api import expect
from pytest_bdd import given, parsers, then, when

from pages.cart_page import CartPage
from pages.contact_us_page import ContactUsPage
from pages.login_page import LoginPage
from pages.products_page import ProductsPage


# ---------- Page objects (a test asks for the page it needs, e.g. `login_page`) ----------

@pytest.fixture
def login_page(page):
    return LoginPage(page)


@pytest.fixture
def products_page(page):
    return ProductsPage(page)


@pytest.fixture
def cart_page(page):
    return CartPage(page)


@pytest.fixture
def contact_us_page(page):
    return ContactUsPage(page)


# ---------- Shared steps ----------

@given("I am on the login page")
def open_login_page(login_page):
    login_page.open()


@given("I am on the products page")
def open_products_page(products_page):
    products_page.open()


@given("the test account exists")
def test_account_exists(registered_user):
    # registered_user (in the main conftest.py) creates the account once through the website's API
    pass


@given("I have opened the cart")
@when("I open the cart")
def open_cart(cart_page):
    cart_page.open()


@when(parsers.parse('I search for "{keyword}"'))
def search_for(products_page, keyword):
    products_page.search(keyword)


@then(parsers.parse('the results should include "{product}"'))
def results_include(products_page, product):
    expect(products_page.product_names.filter(has_text=product).first).to_be_visible()
