# Architecture and design decisions

## 1. Layers

```
features/*.feature        WHAT is tested, in plain English (Gherkin)
        │
features/steps/*_steps.py step definitions: one Python function per Gherkin line
features/steps/conftest.py steps and page fixtures shared by several features
        │
pages/*.py                HOW: selectors and actions of each page (Page Object Model)
        │
Playwright                drives the real browser
        │
automationexercise.com    the website under test

utils/data_reader.py      test data from Excel / SQLite / Redis (used by steps)
conftest.py               shared setup: ad blocker, test account, screenshot on failure
```

Each layer only talks to the one below it. If the website changes a button, only the page object changes; the feature files and steps stay the same.

## 2. How one test runs

1. `pytest` finds `features/steps/login_steps.py`. The line `scenarios("login.feature")` turns every scenario in that feature file into a pytest test.
2. pytest-playwright opens the browser once and gives every test a **new, clean browser context** (like a new incognito window), so tests never share cookies or logins.
3. The autouse fixture `block_ads` blocks Google ads, so they cannot cover buttons.
4. For each Gherkin line, pytest-bdd finds the step function with the same text and runs it. The step calls a page object, then checks the result with Playwright's `expect(...)`.
5. If a step fails, the hook `pytest_bdd_step_error` adds a screenshot to the Allure report. Playwright also keeps a screenshot in `test-results/`.
6. allure-pytest-bdd writes every scenario, step, page action and log to `allure-results/`.

## 3. Design decisions

| Decision | Why |
|---|---|
| **Python + pytest** | Required by the course. pytest gives us fixtures (setup code), markers (tags), parametrised tests and many plugins |
| **pytest-bdd for Gherkin** | Lets us write tests as `.feature` files while still running them with pytest. Gherkin tags (`@smoke`) become pytest markers (`pytest -m smoke`) |
| **Playwright** | One API for Chromium, Firefox and WebKit. It waits for elements automatically, so tests need no `sleep` |
| **One website: Automation Exercise** | Medium difficulty, free, made for test practice, and it has everything the project asks for: login, search, a form with file upload, a cart. Stable `data-qa` attributes make selectors simple |
| **Page Object Model** | Selectors live in one place (`pages/`). Every page extends `BasePage`, which holds the parts shared by all pages (open the page, top menu, logout) |
| **No assertions in page objects** | Page objects only do things and return things; steps decide what is right or wrong. This keeps pages reusable |
| **Steps shared through `features/steps/conftest.py`** | Steps such as "I am on the login page" are written once and used by several feature files |
| **Test account created through the API** | The `registered_user` fixture calls the site's `/api/createAccount` once per run, so login tests do not depend on someone creating the account by hand |
| **Re-run failed tests (`--reruns 2`)** | The free demo site is sometimes overloaded ("queue full", 503). A re-run separates a busy server from a real bug |
| **Tests run one after another** | With parallel browsers the free demo site starts refusing requests |

## 4. Test data

All data starts in JSON (`test_data/users.json`, `test_data/search_terms.json`). `python test_data/create_test_data.py` copies it into:

| Source | Where | How it is read |
|---|---|---|
| Excel | `test_data/test_data.xlsx`, one sheet per dataset | `openpyxl` |
| SQLite (database) | `test_data/test_data.db`, one table per dataset | Python's built-in `sqlite3` |
| Redis | hash `testdata:<dataset>`, one JSON record per key | `redis` package. Without `REDIS_URL`, `fakeredis` (in-memory) is used and filled from JSON |

`utils/data_reader.py` has one function per source and one entry point:

```python
get_record("excel", "users", "valid_user")
# -> {"key": "valid_user", "email": "...", "password": "...", "expected": "success"}
```

`data_driven.feature` uses a `source` column, so the **same scenario** runs with data from each source. Adding a new source (for example CSV) means one new `read_csv` function and one more `if` in `get_records`.

## 5. Reporting

| What | Where |
|---|---|
| Allure report | `pytest` writes `allure-results/`; `npx allure@3.33.0 generate allure-results` builds `allure-report/` |
| In the report | Scenarios grouped by feature, tags, every Gherkin step, the page actions inside each step (`@allure.step`), the log of each test, a screenshot of the failed step, browser and website on the front page |
| Screenshot of failed tests | `test-results/` (`--screenshot only-on-failure` in `pytest.ini`) |
| Published report | The CI publishes the report of every merge to `main` on GitHub Pages |

## 6. Browsers and platforms

- `pytest --browser chromium | firefox | webkit` (several `--browser` options run the tests on each).
- `pytest --device "Pixel 7"` emulates a phone screen.
- The nightly `cross-browser.yml` workflow runs the smoke tests on Linux (all three browsers), Windows, macOS and a phone screen.
