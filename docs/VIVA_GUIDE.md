# Viva guide: the whole project from start to end

Read this file from top to bottom once and you can explain every part of the project.

---

## 1. What is this project? (say this first)

A **Web UI Test Automation Framework**. It **opens a real browser by itself**, uses an online shop like a person would (log in, search, fill a form, use the cart) and **checks that everything works**.

- Tests are written in **plain English** (Gherkin: `Given / When / Then`).
- They run with **pytest** (through the **pytest-bdd** plugin).
- The browser is controlled by **Playwright**.
- Code is organised with the **Page Object Model (POM)**.
- Test data comes from **Excel, a database (SQLite) and Redis**.
- Results come out as an **Allure** report.
- **GitHub Actions** runs the tests automatically on every pull request and merge.

Website under test: **https://automationexercise.com**, a free demo shop made for test practice.

---

## 2. Tools and why we used them

| Tool | What it does for us | Why this one |
|---|---|---|
| **Python** | Language of the project | Taught in class, simple to read |
| **pytest** | Finds and runs the tests, gives fixtures (setup code) and markers (tags) | Most used Python test tool, has plugins for everything below |
| **pytest-bdd** | Reads `.feature` files and runs them as pytest tests | The project asks for Gherkin **and** a BDD tool. It is the pytest version of Behave/Cucumber |
| **Playwright** (`pytest-playwright`) | Opens the browser, clicks, types, waits | Required in the assignment. Supports Chromium, Firefox, WebKit and phone screens |
| **Allure** (`allure-pytest-bdd`) | Builds the HTML report with steps, logs and screenshots | Required ("a reporting tool like Allure") |
| **openpyxl** | Reads the Excel file | Excel data source |
| **sqlite3** | Reads the database | Database data source (built into Python, no server needed) |
| **redis** / **fakeredis** | Reads Redis | Redis data source. `fakeredis` is an in-memory Redis so it works on any laptop |
| **pytest-rerunfailures** | Re-runs a failed test up to 2 times | The free demo site is sometimes overloaded (503) |
| **GitHub Actions** | Runs tests on GitHub automatically | Required ("run test cases every time a new branch is merged") |

---

## 3. Project structure: every file and what it does

```
Project/
│
├── features/                     ← WHAT we test (plain English, Gherkin)
│   ├── login.feature             log in, wrong details, log out
│   ├── search.feature            search by name, by keyword, no result
│   ├── contact_us.feature        contact form with file upload, different messages
│   ├── cart.feature              add one / two products, check price, remove
│   ├── data_driven.feature       login + search with data from Excel / SQLite / Redis
│   │
│   └── steps/                    ← GLUE: Python code behind each Gherkin line
│       ├── conftest.py           page-object fixtures + steps used by many features
│       ├── login_steps.py        steps of login.feature
│       ├── search_steps.py       steps of search.feature
│       ├── contact_us_steps.py   steps of contact_us.feature
│       ├── cart_steps.py         steps of cart.feature
│       └── data_driven_steps.py  steps of data_driven.feature
│
├── pages/                        ← HOW (Page Object Model: selectors + actions)
│   ├── base_page.py              BasePage: parent of all pages (open(), logout(), top menu)
│   ├── login_page.py             LoginPage: email, password, login button, error message
│   ├── products_page.py          ProductsPage: search box, results, add to cart
│   ├── cart_page.py              CartPage: rows, price, remove, "cart is empty"
│   └── contact_us_page.py        ContactUsPage: form fields, file upload, submit, success
│
├── utils/
│   └── data_reader.py            get_record(source, dataset, key): reads Excel / SQLite / Redis
│
├── test_data/
│   ├── users.json                the users (valid, wrong password, unknown email)
│   ├── search_terms.json         the search words and the product we expect
│   ├── create_test_data.py       builds test_data.xlsx + test_data.db (and Redis) from the JSON
│   ├── test_data.xlsx            Excel data (sheets: users, search_terms)
│   ├── test_data.db              SQLite database (tables: users, search_terms)
│   └── sample_upload.txt         file uploaded in the contact form test
│
├── conftest.py                   setup for EVERY test: block ads, create test account,
│                                 screenshot to Allure when a step fails
├── pytest.ini                    pytest settings: where tests are, website URL, Allure folder,
│                                 reruns, screenshots, tags (markers)
├── requirements.txt              Python packages to install
│
├── .github/
│   ├── workflows/ci.yml          tests on every pull request + every merge, report on GitHub Pages
│   ├── workflows/cross-browser.yml  nightly: every browser, Linux/Windows/macOS, phone screen
│   ├── workflows/pr-checks.yml   checks pull request title, linked issue, size label
│   ├── workflows/auto-merge.yml  merges a PR labelled "automerge" once checks pass
│   ├── ISSUE_TEMPLATE/           forms for bug / feature / new test issues
│   ├── PULL_REQUEST_TEMPLATE.md  checklist shown on every pull request
│   └── CODEOWNERS                who must review which folder
│
├── docs/                         documentation (setup, writing tests, architecture, GitHub, this guide)
│   └── example-report/index.html example Allure report (24 tests, all passed)
└── README.md                     project overview and quick start
```

### The 3 layers (most important idea)

```
 features/*.feature        →   features/steps/*_steps.py   →   pages/*.py           →  Browser
 (WHAT: plain English)         (GLUE: matches text,            (HOW: selectors,         (Playwright)
                                calls page, checks result)      click / fill)
```

- **Feature file** says *what* should happen. No code.
- **Step** connects one English line to Python, calls the page object and **checks** with `expect(...)`.
- **Page object** knows *where* things are on the page and *how* to do an action. It **never** checks results.

If the website changes a button, we fix **one** line in `pages/`. Tests and steps stay the same.

---

## 4. Same as the class slides (Behave), but on pytest

| Class slides (Behave) | Our project (pytest-bdd) |
|---|---|
| `features/add.feature` | `features/login.feature`, `features/cart.feature`, ... |
| `features/steps/other.py` | `features/steps/login_steps.py`, `features/steps/cart_steps.py`, ... |
| `new.py` / `calculator.py` (the app code) | the website, used through `pages/` (page objects) |
| `from behave import given, when, then` | `from pytest_bdd import given, when, then` |
| `@given('the first number is {a:d}')` | `@given(parsers.parse('I have added "{product}" to the cart'))` |
| `{a:d}` takes a number from the sentence | `{minimum:d}` does the same (`search_steps.py`) |
| `context.a = a` (share data between steps) | pytest **fixtures** (`login_page`, `user`, ...) |
| `assert context.result == expected` | `expect(...)` from Playwright, or `assert` |
| `behave` command runs it | `pytest` command runs it |

**Why not Behave?** The assignment only says "a BDD tool (e.g. Cucumber or SpecFlow)", it does not name Behave. We picked pytest-bdd because the project also uses pytest (fixtures, markers, the Playwright plugin and the Allure plugin). The Gherkin files are exactly the same in both tools.

---

## 5. Gherkin keywords used in the project

| Keyword | Meaning | Example from our files |
|---|---|---|
| `Feature:` | Groups related behaviour (one per file) | `Feature: Shopping cart` |
| `As a / I want / So that` | Short user story describing the feature | top of every feature file |
| `Scenario:` | One example, runs once | `Scenario: Remove the only product from the cart` |
| `Scenario Outline:` + `Examples:` | Same scenario, runs once per table row (data-driven) | `search.feature`, `contact_us.feature`, `data_driven.feature` |
| `Given` | Starting state (precondition) | `Given I am on the products page` |
| `When` | The action | `When I remove "Blue Top" from the cart` |
| `Then` | The expected result | `Then the cart should be empty` |
| `And` | One more step of the **same** type as the line above | `And I have added "Blue Top" to the cart` (a Given) |
| `@tag` | Label to run a group of tests | `@smoke`, `@regression`, `@cart` |

Example with every keyword (`features/cart.feature`):

```gherkin
@cart
Feature: Shopping cart
  As a customer
  I want to put products in my cart
  So that I can buy them together

  @regression
  Scenario: Add two products to the cart
    Given I am on the products page
    And I have added "Blue Top" to the cart          ← And = another Given
    When I add "Men Tshirt" to the cart
    And I open the cart                               ← And = another When
    Then the cart should contain "Blue Top"
    And the cart should contain "Men Tshirt"          ← And = another Then
```

Because the `And` after `Given` is a Given step, its Python function uses `@given(...)`:

```python
# features/steps/cart_steps.py
@given(parsers.parse('I have added "{product}" to the cart'))
@when(parsers.parse('I add "{product}" to the cart'))
def add_to_cart(products_page, product):
    products_page.add_to_cart(product)
```

(One function can serve both a Given and a When sentence.)

---

## 6. All tests (24 in total)

| Feature | Scenario | Type | What it proves |
|---|---|---|---|
| Login | Log in with a registered account | positive | correct login shows "Logged in as Test User" |
| Login | Login is rejected with wrong details (×2) | negative, outline | unknown email and wrong password show an error |
| Login | Log out | positive | after logout we are back on `/login` |
| Search | Search for one product by its name | positive | heading "Searched Products", Blue Top is in results |
| Search | Search by keyword (×3: dress, jeans, tshirt) | positive, outline | enough results and the expected product |
| Search | Search with no matching product | negative | 0 results |
| Contact | Send a message with a file attached | positive, file upload | success message |
| Contact | Send different kinds of messages (×2) | positive, outline | success message for each |
| Cart | Add a product to the cart | positive | product and price (Rs. 500) in cart |
| Cart | Add two products to the cart | positive | both products in cart |
| Cart | Remove the only product from the cart | positive | cart is empty |
| Data-driven | Log in with data from Excel / SQLite / Redis (×6) | positive + negative | same test, data from 3 sources |
| Data-driven | Search with data from Excel / SQLite / Redis (×3) | positive | same test, data from 3 sources |

`@smoke` = the 4 most important tests (one per feature). `@regression` = all the others.

---

## 7. How ONE test runs, from start to end

Command: `pytest -m smoke` (or just `pytest` for all).

Test: from `features/login.feature`

```gherkin
@smoke
Scenario: Log in with a registered account
  Given the test account exists
  And I am on the login page
  When I log in with the registered account
  Then I should see "Logged in as Test User" at the top of the page
```

**Step 1: pytest reads its settings** (`pytest.ini`)
- `testpaths = features/steps` and `python_files = *_steps.py` → look for tests in `features/steps/*_steps.py`.
- `bdd_features_base_dir = features/` → feature files are in `features/`.
- `--base-url=https://automationexercise.com` → `page.goto("/login")` opens that site.
- `--alluredir=allure-results` → save results for Allure.

**Step 2: the feature becomes pytest tests**
In `features/steps/login_steps.py`:
```python
scenarios("login.feature")
```
This one line turns every scenario of `login.feature` into a pytest test.

**Step 3: browser opens** (`pytest-playwright`)
Each test gets a **new clean browser window** called `page`. Tests never affect each other.

**Step 4: global setup runs** (`conftest.py` in the project root)
- `block_ads`: blocks Google ads (they can cover buttons).
- `registered_user`: creates the test account once through the site's API `/api/createAccount` (reads the user from `test_data/users.json`).

**Step 5: each Gherkin line is matched to a Python function by its text**

| Gherkin line | Python function | File |
|---|---|---|
| `Given the test account exists` | `test_account_exists(registered_user)` | `features/steps/conftest.py` |
| `And I am on the login page` | `open_login_page(login_page)` → `login_page.open()` | `features/steps/conftest.py` |
| `When I log in with the registered account` | `log_in_registered(...)` → `login_page.login(email, password)` | `features/steps/login_steps.py` |
| `Then I should see "..." at the top of the page` | `see_logged_in(...)` → `expect(...).to_have_text(text)` | `features/steps/login_steps.py` |

`login_page` is a **fixture** from `features/steps/conftest.py`:
```python
@pytest.fixture
def login_page(page):
    return LoginPage(page)
```

**Step 6: the page object does the work** (`pages/login_page.py`)
```python
self.email_input = page.locator("[data-qa='login-email']")
...
def login(self, email, password):
    self.email_input.fill(email)
    self.password_input.fill(password)
    self.login_button.click()
```
`@allure.step(...)` on the method shows it in the report; `log.info(...)` writes a log line.

**Step 7: the check**
```python
expect(login_page.logged_in_as).to_have_text("Logged in as Test User")
```
`expect` waits up to 5 seconds for the text. If it never appears → test **fails**.

**Step 8: results**
- Pass/fail goes to `allure-results/`.
- If a step fails, the hook `pytest_bdd_step_error` in `conftest.py` attaches a **screenshot** to Allure, and Playwright saves one in `test-results/`.
- If it failed because the site was busy, `--reruns 2` runs it again.

**Step 9: report**
```bash
npx allure@3.33.0 generate allure-results    # build HTML report
npx allure@3.33.0 open allure-report         # open it
```

---

## 8. Test data flow (Excel, Database, Redis)

```
test_data/users.json  ─┐
test_data/search_terms.json ─┤  python test_data/create_test_data.py
                       ├──────────────► test_data.xlsx   (Excel, one sheet per dataset)
                       ├──────────────► test_data.db     (SQLite, one table per dataset)
                       └──────────────► Redis            (hash "testdata:users", ...)
```

A test says **where** to read from, in the `Examples:` table (`features/data_driven.feature`):

```gherkin
Scenario Outline: Log in as "<user>" with data from <source>
  Given the test account exists
  And I am on the login page
  And I have read the user "<user>" from <source>
  When I log in with that user
  Then the login should end with the user's expected result

  Examples:
    | source | user           |
    | excel  | valid_user     |
    | sqlite | unknown_email  |
    | redis  | wrong_password |
```

The step calls `get_record(source, "users", user)` in `utils/data_reader.py`:

| source | Function | How it reads |
|---|---|---|
| `excel` | `read_excel` | `openpyxl` opens `test_data.xlsx`, sheet `users`, first row = column names |
| `sqlite` | `read_sqlite` | `sqlite3` runs `SELECT * FROM users` on `test_data.db` |
| `redis` | `read_redis` | reads hash `testdata:users`. Real Redis if `REDIS_URL` is set (CI), otherwise `fakeredis` in memory |

Every record has a `key` column, e.g. `valid_user`, and an `expected` column (`success` or `error`), so the `Then` step knows what result to check.

The step returns the record with `target_fixture="user"`, so the next steps get it as the `user` argument (like `context.user` in Behave).

**To add a new data source** (e.g. CSV): write `read_csv()` and add one `if` in `get_records()`. No test changes needed → scalable.

---

## 9. Report (Allure)

The report shows:
- total / passed / failed, grouped by feature
- every scenario with its **Gherkin steps**, and inside each step the **page actions** (`@allure.step`)
- the **log** of each test
- a **screenshot** of the failed step
- browser and website on the front page (`environment.properties`, written in `conftest.py`)

Example report: `docs/example-report/index.html` (24 tests, all passed). On GitHub it is also published to GitHub Pages after every merge to `main`.

---

## 10. GitHub and CI/CD flow

```
create issue → new branch → commit → push → pull request
      → CI runs smoke tests + PR checks → teammate reviews → merge to main
      → CI runs ALL tests → Allure report published on GitHub Pages
```

| Workflow | When | What |
|---|---|---|
| `ci.yml` | every pull request | install, load all tests, start Redis, run `@smoke` tests, build Allure report |
| `ci.yml` | every merge/push to `main` | run **all** tests, publish report on GitHub Pages |
| `cross-browser.yml` | every night + by hand | smoke tests on Chromium/Firefox/WebKit, Linux/Windows/macOS, phone screen |
| `pr-checks.yml` | every pull request | PR title like `feat: ...`, linked issue, size label |
| `auto-merge.yml` | PR labelled `automerge` | merges automatically after checks + review |

Also: issue templates (bug, feature, new test), PR template with checklist, `CODEOWNERS` for reviews, milestones in `docs/TASK_BREAKDOWN.md`.

---

## 11. Requirements → where to show them

| # | Requirement (Project Phase 2) | Where |
|---|---|---|
| 1 | Web UI automation, different browsers and platforms | Playwright; `pytest --browser firefox`, `--device "Pixel 7"`; `cross-browser.yml` |
| 1 | Modular, scalable | 3 layers (features / steps / pages), `BasePage`, `data_reader.py` |
| 2 | Gherkin | `features/*.feature` |
| 2 | BDD tool | pytest-bdd |
| 2 | Scenario Outline, data-driven | `Examples:` tables in search, contact, data_driven |
| 3 | Allure with logs, screenshots | `allure-pytest-bdd`, `conftest.py`, `docs/example-report/` |
| 4 | Data from Excel, Database, Redis | `utils/data_reader.py`, `test_data/`, `data_driven.feature` |
| 5 | Page Object Model | `pages/` |
| 6 | Login, search, form examples | `login`, `search`, `contact_us` (with file upload), `cart` features |
| 7 | GitHub workflows, tests on every merge | `.github/workflows/ci.yml` |
| 8 | Documentation | `README.md`, `docs/SETUP.md`, `docs/WRITING_TESTS.md`, `docs/ARCHITECTURE.md`, `docs/GITHUB_WORKFLOW.md` |

---

## 12. Commands you should know

| Command | What it does |
|---|---|
| `pip install -r requirements.txt` | install packages |
| `python -m playwright install` | download browsers |
| `python test_data/create_test_data.py` | build Excel + SQLite data |
| `pytest` | run all 24 tests |
| `pytest -m smoke` | only the 4 smoke tests |
| `pytest -m "cart or search"` | tests with these tags |
| `pytest features/steps/cart_steps.py` | one feature |
| `pytest --headed --slowmo 500` | watch the browser slowly |
| `pytest --browser firefox` | another browser |
| `pytest --device "Pixel 7"` | phone screen |
| `npx allure@3.33.0 generate allure-results && npx allure@3.33.0 open allure-report` | build and open report |

---

## 13. Who did what

| Abdur Rafay | Ammar |
|---|---|
| Project setup, pytest settings, `conftest.py` | Page objects (`pages/`) |
| Test data: Excel, SQLite, Redis | Login, search, contact-us and cart features with their steps |
| Allure reporting, GitHub Actions | GitHub templates |
| Documentation | Data-driven feature (together) |

---

## 14. Questions sir may ask (with short answers)

**Q: What is BDD?**
A: Behaviour-Driven Development. We first write the expected behaviour in plain English (Given / When / Then), then code that makes it run. Non-programmers can read the tests.

**Q: What is Gherkin? Is it a programming language?**
A: No. It is a plain-text language with a few keywords to describe behaviour. It is not a test runner either; pytest-bdd runs it.

**Q: How does a Gherkin line find its Python code?**
A: By its text. `When I log out` runs the function decorated with `@when("I log out")`. If the text does not match, pytest-bdd says "step not found".

**Q: What does `And` do?**
A: It repeats the keyword before it. `Given ... And ...` → the And is a Given step.

**Q: What is `parsers.parse`?**
A: It takes values out of the sentence. `'I search for "{keyword}"'` gives the function a `keyword` argument. `{minimum:d}` gives a number (same as `{a:d}` in Behave).

**Q: Scenario vs Scenario Outline?**
A: Scenario runs once. Scenario Outline runs once for every row of `Examples:`.

**Q: What is a fixture?**
A: Setup code that pytest runs before a test and passes in as an argument. `page` comes from pytest-playwright; `login_page`, `registered_user` are ours. It replaces Behave's `context`.

**Q: What is `conftest.py`? Why two?**
A: pytest loads it automatically. Root `conftest.py` = setup for every test (ads, test account, screenshot). `features/steps/conftest.py` = page fixtures and steps used by many features.

**Q: What is POM and why use it?**
A: One class per web page with its selectors and actions. Change in the website → fix one class. Steps stay short and readable. `BasePage` holds what every page shares (`open`, `logout`).

**Q: Why are there no `expect`/`assert` in page objects?**
A: Page objects only *do* things. Checks belong to the test (Then steps). This keeps each layer with one job.

**Q: How do you get data from Excel / DB / Redis?**
A: `get_record(source, dataset, key)` in `utils/data_reader.py` chooses the reader by `source`. All sources hold the same records, so the test is the same.

**Q: Do I need to install Redis?**
A: No. Without `REDIS_URL`, `fakeredis` (in-memory) is used. On GitHub CI a real Redis server runs as a service.

**Q: How do you run on other browsers/platforms?**
A: `--browser firefox` / `webkit`, `--device "Pixel 7"`. `cross-browser.yml` runs on Linux, Windows and macOS.

**Q: How do you avoid flaky tests?**
A: No `sleep`: Playwright and `expect` wait automatically. Ads blocked. Clean browser per test. `--reruns 2` because the demo site is sometimes overloaded.

**Q: Where does the login account come from?**
A: The `registered_user` fixture creates it through the site's API once per run. "Email already exists" is fine too.

**Q: What happens when a test fails?**
A: The test is retried up to 2 times. If it still fails: Allure shows the failed step, the log and a screenshot.

**Q: What does CI do?**
A: Pull request → smoke tests. Merge to main → all tests + Allure report on GitHub Pages.

**Q: How would you add a new test?**
A: 1) write the scenario in a `.feature` file, 2) add any missing step in `features/steps/`, 3) if a new page is needed, add a class in `pages/`. (Full guide: `docs/WRITING_TESTS.md`.)

---

## 15. Demo in 2 minutes

```bash
pytest -m login --headed --slowmo 500     # watch the browser log in and out
pytest -m smoke                           # the 4 most important tests
npx allure@3.33.0 generate allure-results && npx allure@3.33.0 open allure-report
```

Then on GitHub show: **Actions** (green CI), **Pull requests** (reviewed), **Issues** with milestones, and the Allure report on **GitHub Pages**.
