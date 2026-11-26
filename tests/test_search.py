from playwright.sync_api import expect
from pytest_bdd import parsers, scenarios, then

scenarios("search.feature")


@then(parsers.parse('I should see the heading "{text}"'))
def see_heading(products_page, text):
    expect(products_page.heading).to_have_text(text, ignore_case=True)


@then(parsers.parse("I should see at least {minimum:d} results"))
def at_least_results(products_page, minimum):
    expect(products_page.product_names.first).to_be_visible()
    assert len(products_page.result_names()) >= minimum


@then(parsers.parse("I should see {count:d} results"))
def exact_results(products_page, count):
    expect(products_page.product_names).to_have_count(count)
