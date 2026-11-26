from playwright.sync_api import expect
from pytest_bdd import parsers, scenarios, then, when

from utils.data_reader import get_record

scenarios("data_driven.feature")


# ---------- Login with users read from Excel / SQLite / Redis / JSON ----------

@when(parsers.parse('I read the user "{user_key}" from {source}'), target_fixture="user")
def read_user(user_key, source):
    # target_fixture: the returned record is available to the next steps as "user"
    return get_record(source, "users", user_key)


@when("I log in with that user")
def log_in_with_user(login_page, user, registered_user):
    login_page.login(user["email"], user["password"])


@then("the login should end with the user's expected result")
def login_result(login_page, user):
    if user["expected"] == "success":
        expect(login_page.logged_in_as).to_have_text(f"Logged in as {user['name']}")
    else:
        expect(login_page.error_message).to_have_text("Your email or password is incorrect!")


# ---------- Search with terms read from Excel / SQLite / Redis / JSON ----------

@when(parsers.parse('I read the search term "{term_key}" from {source}'), target_fixture="search")
def read_search_term(term_key, source):
    return get_record(source, "search_terms", term_key)


@when("I search for that term")
def search_for_term(products_page, search):
    products_page.search(search["term"])


@then("the results should include the expected product of that term")
def results_include_expected(products_page, search):
    expect(products_page.product_names.filter(has_text=search["expected_product"]).first).to_be_visible()
    assert len(products_page.result_names()) >= int(search["min_results"])
