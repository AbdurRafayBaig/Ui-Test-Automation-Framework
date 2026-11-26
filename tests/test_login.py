import re

from playwright.sync_api import expect
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("login.feature")


@given("I am logged in with the registered account")
@when("I log in with the registered account")
def log_in_registered(login_page, registered_user):
    login_page.login(registered_user["email"], registered_user["password"])


@when(parsers.parse('I log in with email "{email}" and password "{password}"'))
def log_in_with(login_page, email, password):
    login_page.login(email, password)


@when("I log out")
def log_out(login_page):
    login_page.logout()


@then(parsers.parse('I should see "{text}" at the top of the page'))
def see_logged_in(login_page, text):
    expect(login_page.logged_in_as).to_have_text(text)


@then(parsers.parse('I should see the login error "{message}"'))
def see_login_error(login_page, message):
    expect(login_page.error_message).to_have_text(message)


@then("I should be on the login page")
def on_login_page(page):
    expect(page).to_have_url(re.compile(r"/login$"))
