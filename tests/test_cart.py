from playwright.sync_api import expect
from pytest_bdd import parsers, scenarios, then, when

scenarios("cart.feature")


@when(parsers.parse('I add "{product}" to the cart'))
def add_to_cart(products_page, product):
    products_page.add_to_cart(product)


@when(parsers.parse('I remove "{product}" from the cart'))
def remove_from_cart(cart_page, product):
    cart_page.remove(product)


@then(parsers.parse('the cart should contain "{product}"'))
def cart_contains(cart_page, product):
    expect(cart_page.row(product)).to_be_visible()


@then(parsers.parse('the price of "{product}" should be "{price}"'))
def price_is(cart_page, product, price):
    expect(cart_page.price_of(product)).to_have_text(price)


@then("the cart should be empty")
def cart_is_empty(cart_page):
    expect(cart_page.empty_cart_message).to_be_visible()
