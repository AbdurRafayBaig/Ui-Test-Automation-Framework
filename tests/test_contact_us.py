from pathlib import Path

from playwright.sync_api import expect
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("contact_us.feature")

TEST_DATA = Path(__file__).resolve().parent.parent / "test_data"


@given("I am on the contact us page")
def open_contact_page(contact_us_page):
    contact_us_page.open()


@when(parsers.parse('I fill in the contact form with name "{name}", email "{email}", '
                    'subject "{subject}" and message "{message}"'))
def fill_contact_form(contact_us_page, name, email, subject, message):
    contact_us_page.fill_form(name, email, subject, message)


@when(parsers.parse('I attach the file "{file_name}"'))
def attach_file(contact_us_page, file_name):
    contact_us_page.attach_file(str(TEST_DATA / file_name))


@when("I submit the contact form")
def submit_form(contact_us_page):
    contact_us_page.submit()


@then(parsers.parse('I should see the message "{text}"'))
def see_message(contact_us_page, text):
    expect(contact_us_page.success_message).to_have_text(text)
