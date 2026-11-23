# Viva guide: the project in simple words

A short guide so anyone on the team can explain the project from start to end.

## 1. What is this project? (one line)

A tool that **opens a real browser by itself, uses an online shop like a person would (log in, search, fill a form, use the cart) and checks that it works**. The tests are written in plain English (Gherkin), run with **pytest**, and the results come out as an **Allure** report.

Website under test: **https://automationexercise.com**, a free demo shop made for test practice.

## 2. Tools and why we used them

| Tool | What it does for us |
|---|---|
| **Python** | The language of the project |
| **pytest** | Finds and runs the tests, gives fixtures (setup code), markers (tags) and plugins |
| **pytest-bdd** | Lets pytest run tests written in Gherkin (`.feature` files) |
| **Playwright** | Controls the browser: open page, click, type. Works with Chromium, Firefox and WebKit |
| **Allure** (`allure-pytest-bdd`) | Makes the HTML report with steps, logs and screenshots |
| **openpyxl, sqlite3, redis, json** | Read test data from Excel, a database, Redis and JSON |
| **GitHub Actions** | Runs the tests automatically on GitHub |

## 3. Folders

```
features/      the tests in plain English (Given / When / Then)
tests/         step definitions: the Python code behind each English line
pages/         page objects: one class per web page (where buttons are + what you can do)
utils/         data_reader.py: reads test data from Excel / SQLite / Redis / JSON
test_data/     the data files and the script that builds them
conftest.py    setup used by every test (ad blocker, test account, screenshot on failure)
pytest.ini     pytest settings (website address, report folder, reruns, tags)
.github/       GitHub workflows (CI) and templates
docs/          documentation
```

## 4. How one test runs, from start to end

Take this test from `features/login.feature`:

```gherkin
Scenario: Log in with a registered account
  Given I am on the login page
  When I log in with the registered account
  Then I should see "Logged in as Test User" at the top of the page
```

1. **`pytest`** starts. In `tests/test_login.py` the line `scenarios("login.feature")` turns this scenario into a pytest test.
2. **pytest-playwright** opens the browser and gives the test a fresh, clean window (`page`).
3. **conftest.py** blocks ads, and makes sure the test account exists (created once through the website's API).
4. For the line `When I log in with the registered account`, pytest-bdd finds the **step** with the same text in `tests/test_login.py`:
   ```python
   @when("I log in with the registered account")
   def log_in_registered(login_page, registered_user):
       login_page.login(registered_user["email"], registered_user["password"])
   ```
5. The step calls the **page object** `LoginPage` (`pages/login_page.py`), which knows where the fields are:
   ```python
   def login(self, email, password):
       self.email_input.fill(email)
       self.password_input.fill(password)
       self.login_button.click()
   ```
6. The `Then` step **checks** the result: `expect(login_page.logged_in_as).to_have_text(text)`. If it is wrong, the test fails.
7. **Allure** records every step and the log. If a step fails, a screenshot of the page is added.

**Rule we follow:** feature files say *what* to test, steps connect, page objects know *how* (selectors). Checks (`expect`) are only in steps, never in page objects.

## 5. Project requirements and where they are

| Requirement | Where to show it |
|---|---|
| Playwright, many browsers | `pytest --browser firefox` / `--browser webkit` |
| Many platforms | `.github/workflows/cross-browser.yml`: Linux, Windows, macOS and a phone screen (`--device "Pixel 7"`) |
| Gherkin / BDD | `features/*.feature` |
| Pytest | `tests/test_*.py`, fixtures in `conftest.py`, markers in `pytest.ini` |
| Scenario Outline (data-driven) | `features/search.feature`, `features/contact_us.feature` (`Examples:` tables) |
| Data from Excel / DB / Redis | `features/data_driven.feature` + `utils/data_reader.py` |
| Allure report with logs + screenshots | `npx allure@3.33.0 generate allure-results`. Example: `docs/example-report/index.html` |
| Page Object Model | `pages/` (`BasePage` is the parent of every page) |
| Login, search, form tests | `login.feature`, `search.feature`, `contact_us.feature` |
| GitHub workflows | `.github/workflows/ci.yml` (tests on every pull request and every merge, report on GitHub Pages) |
| Documentation | `README.md` and `docs/` |

## 6. Test data (simple version)

All data starts in `test_data/*.json`. `python test_data/create_test_data.py` copies it into an **Excel file** and a **SQLite database**. **Redis** is filled from the same JSON.

A test says where to read from:

```gherkin
When I read the user "valid_user" from excel
```

`get_record("excel", "users", "valid_user")` in `utils/data_reader.py` uses a simple `if`: excel → `read_excel`, sqlite → `read_sqlite`, redis → `read_redis`, json → `read_json`. All four return the same records, so the test does not care where the data comes from.

**Redis without installing Redis:** if `REDIS_URL` is not set, a fake in-memory Redis (`fakeredis`) is used and filled from the JSON files. On GitHub CI a real Redis server is used.

## 7. Report

```bash
pytest
npx allure@3.33.0 generate allure-results
npx allure@3.33.0 open allure-report
```

In the report: scenarios grouped by feature, tags, every Gherkin step, the page actions inside each step, the log of each test, and a screenshot of the step that failed. Failed tests also keep a video and a Playwright trace in `test-results/`.

## 8. GitHub (how we worked)

- **Branches:** `main` (final), `develop` (work in progress), one small branch per task.
- **Pull requests:** every change goes through a pull request; the other member reviews it.
- **Issues and milestones:** every task is an issue, grouped into milestones M1–M4 (`docs/TASK_BREAKDOWN.md`).
- **CI (`ci.yml`):** on every pull request it runs the smoke tests. On every merge to `main` it runs all tests and publishes the Allure report on GitHub Pages.

## 9. Who did what

| Abdur Rafay | Ammar |
|---|---|
| Project setup, pytest settings, `conftest.py` | Page objects (`pages/`) |
| Test data: Excel, SQLite, Redis, JSON | Login, search, contact-us and cart features with their steps |
| Allure reporting, GitHub Actions | GitHub templates |
| Documentation | Data-driven feature (together) |

## 10. Questions sir may ask (with short answers)

**Q: What is BDD?**
A: Behaviour-Driven Development. We write the expected behaviour in plain English (Given / When / Then), then code that makes it run. Anyone can read the test.

**Q: How do Gherkin and pytest work together?**
A: pytest-bdd reads the `.feature` file. `scenarios("login.feature")` makes every scenario a pytest test, and each Gherkin line runs the Python function that has the same text in `@given`, `@when` or `@then`.

**Q: What is the Page Object Model and why use it?**
A: One class per page that keeps the selectors and actions of that page. If the website changes a button, we fix it in one class, not in every test.

**Q: What is a fixture?**
A: Setup code that pytest runs before a test and passes in as an argument. `page` (a fresh browser window) comes from pytest-playwright; `login_page` and `registered_user` are ours.

**Q: Difference between `Scenario` and `Scenario Outline`?**
A: A Scenario runs once. A Scenario Outline runs once for every row of its `Examples:` table, so one test covers many inputs.

**Q: How do you run only some tests?**
A: With tags, which pytest-bdd turns into markers: `pytest -m smoke`, `pytest -m "cart or search"`. Or one file: `pytest tests/test_cart.py`.

**Q: How do you run tests on another browser or a phone?**
A: `pytest --browser firefox`, `pytest --browser webkit`, `pytest --device "Pixel 7"`.

**Q: How do you avoid flaky tests?**
A: No fixed sleeps: Playwright and `expect(...)` wait automatically. Ads are blocked so they cannot cover buttons. Each test gets a clean browser window. Because the free demo site is sometimes overloaded, a failed test is re-run up to 2 times (`--reruns 2`).

**Q: Where does the login account come from?**
A: The `registered_user` fixture creates it through the website's API (`/api/createAccount`) once per run. If it already exists, that is fine.

**Q: What happens when a test fails?**
A: The report shows the failed step with a screenshot and the log. Playwright also saves a video and a trace (a step-by-step replay) in `test-results/`.

**Q: What does the CI do?**
A: On every pull request: install everything, load all tests, run the smoke tests, build the Allure report. On every merge to `main`: run all tests and publish the report on GitHub Pages.

## 11. Demo in 2 minutes

```bash
pytest -m login --headed --slowmo 500     # watch the browser log in and out
pytest -m smoke                           # the 4 most important tests
npx allure@3.33.0 generate allure-results && npx allure@3.33.0 open allure-report
```

Then show on GitHub: the **Actions** tab (green CI), the **Pull requests** (reviewed by the other member) and the **Issues** with milestones.
