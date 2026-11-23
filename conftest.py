"""Settings shared by every test (pytest loads this file automatically).

The `page` fixture comes from pytest-playwright: every test gets a new, clean
browser window, so tests never affect each other.
"""

import re
from pathlib import Path

import allure
import pytest

from utils.data_reader import get_record

# The website shows Google ads that can cover buttons. We simply block them.
ADS = re.compile(r"googlesyndication|doubleclick|googleadservices|adservice|fundingchoices|google-analytics|googletagmanager")


@pytest.fixture(autouse=True)
def block_ads(context):
    context.route(ADS, lambda route: route.abort())


@pytest.fixture(scope="session")
def registered_user(playwright, base_url):
    """Makes sure the test account exists (created once through the website's API)."""
    user = get_record("json", "users", "valid_user")
    api = playwright.request.new_context(base_url=base_url)
    # "User created!" the first time, "Email already exists!" after that: both are fine.
    api.post("/api/createAccount", form={
        "name": user["name"], "email": user["email"], "password": user["password"],
        "title": "Mr", "birth_date": "1", "birth_month": "1", "birth_year": "2000",
        "firstname": "Test", "lastname": "User", "company": "University", "address1": "Street 1",
        "address2": "", "country": "India", "zipcode": "54000", "state": "Punjab",
        "city": "Lahore", "mobile_number": "03001234567",
    })
    api.dispose()
    return user


@pytest.hookimpl(tryfirst=True)  # run before the Allure plugin closes the step
def pytest_bdd_step_error(request, feature, scenario, step, step_func, step_func_args, exception):
    """pytest-bdd calls this when a Gherkin step fails: add a screenshot to the Allure report."""
    page = request.getfixturevalue("page")
    allure.attach(page.screenshot(full_page=True), name=f"screenshot - {step.name}",
                  attachment_type=allure.attachment_type.PNG)


def pytest_sessionfinish(session):
    """Show the browser and the website on the front page of the Allure report."""
    results_dir = session.config.getoption("--alluredir")
    if results_dir:
        browsers = ", ".join(session.config.getoption("--browser") or ["chromium"])
        Path(results_dir).mkdir(exist_ok=True)
        (Path(results_dir) / "environment.properties").write_text(
            f"Browser={browsers}\nWebsite={session.config.getoption('--base-url')}\n", encoding="utf-8")
