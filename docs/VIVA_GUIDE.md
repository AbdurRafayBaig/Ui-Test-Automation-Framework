# Viva guide: the project in simple words

A short guide so anyone on the team can explain the project from start to end.

## 1. What is this project? (one line)

A tool that **opens a real browser by itself, uses three websites like a person would, and checks they work**. Tests are written in plain English (Gherkin) and the results come out as an Allure report.

## 2. Tools we used and why

| Tool | What it does for us | Why this one |
|---|---|---|
| **Playwright** | Controls the browser (open page, click, type) | Supports Chromium, Firefox and WebKit, and waits for elements automatically |
| **Cucumber** | Runs tests written in plain English (`.feature` files) | Non-programmers can read the tests (BDD) |
| **TypeScript** | The language of our code | Catches mistakes before running (types) |
| **Allure** | Makes the HTML test report | Shows steps, screenshots, videos and logs |
| **Excel, SQLite, Redis, JSON** | Places our test data comes from | Project requirement: data-driven tests |
| **GitHub Actions** | Runs the tests automatically on GitHub | Project requirement: CI on every merge |

## 3. Folders (where is what)

```
features/   the tests, in plain English (Given / When / Then)
src/steps/  connects each English line to code
src/pages/  one class per web page: where buttons are + what you can do there
src/data/   reads test data from Excel / SQLite / Redis / JSON
src/core/   browser setup and hooks (things that run before/after every test)
src/config/ settings: which browser, headless or not, timeouts, website URLs
test-data/  the data files themselves
.github/    GitHub workflows (CI) and templates for issues and pull requests
docs/       documentation
```

## 4. How one test runs, from start to end

Take this test from `features/saucedemo/login.feature`:

```gherkin
Scenario: Successful login with valid credentials
  Given I am on the SauceDemo login page
  When I log in with username "standard_user" and password "secret_sauce"
  Then I should be on the products page
```

1. **`npm test`** starts Cucumber.
2. **Hooks** (`src/core/hooks.ts`) open the browser once, then a fresh clean window (like incognito) for this test.
3. Cucumber reads the line `When I log in with username "standard_user" ...` and finds the **step** with the same text in `src/steps/saucedemo.steps.ts`:
   ```ts
   When('I log in with username {string} and password {string}', async function (username, password) {
     await this.pages.login.login(username, password);
   });
   ```
4. The step calls the **page object** `LoginPage` (`src/pages/saucedemo/LoginPage.ts`). It knows where the fields are and fills them:
   ```ts
   await this.fill(this.usernameInput, username, 'username field');
   await this.fill(this.passwordInput, password, 'password field', true);
   await this.click(this.loginButton, 'Login button');
   ```
5. The `Then` step **checks** the result with `expect(...)`. If the check fails, the test fails.
6. After the test, the hooks add the **screenshot (if failed), video, trace and log** to the Allure report and close the window.

**Rule we follow:** `features` say *what* to test, `steps` connect, `pages` know *how* (selectors). Assertions (`expect`) are only in steps, never in pages.

## 5. Project requirements and where they are

| Requirement | Where to show it |
|---|---|
| Playwright, many browsers | `src/core/BrowserManager.ts`. Run `npm run test:firefox` or `npm run test:webkit` |
| Many platforms | CI runs on Linux, Windows and macOS (`.github/workflows/cross-browser.yml`), mobile with `npm run test:mobile` |
| Gherkin / BDD | `features/**/*.feature` |
| Scenario Outline (data-driven) | `features/saucedemo/login.feature` (`Examples:` table) |
| Data from Excel / DB / Redis | `features/data-driven/external-data-sources.feature` + `src/data/` |
| Allure report with logs + screenshots | `npm run report`. Example: `docs/example-report/index.html` |
| Page Object Model | `src/pages/` (`BasePage` is the parent of every page) |
| Login, search, form tests | `login.feature`, `toolshop/search.feature`, `toolshop/contact.feature`, `checkout.feature` |
| GitHub workflows | `.github/workflows/ci.yml` (tests on every PR and every merge), `auto-merge.yml`, `pr-checks.yml` |
| Documentation | `README.md` and `docs/` |

## 6. Test data (simple version)

All data starts in `test-data/json/`. `npm run data:seed` copies it into an **Excel file** and a **SQLite database**; `npm run data:seed:redis` copies it into **Redis**.

A test picks the source by name:

```gherkin
And I load the "users" record "standard" from the "excel" data source
```

`DataManager` (`src/data/DataManager.ts`) has a simple `switch`: `"excel"` → Excel reader, `"sqlite"` → database reader, `"redis"` → Redis reader, `"json"` → JSON reader. Every reader has the same two functions, `getAll` and `getByKey`, so the test does not care where the data comes from.

**Redis without installing Redis:** if no Redis server is set (`REDIS_URL` empty), a fake in-memory Redis is used and filled from the JSON files. On GitHub CI a real Redis server is used.

## 7. Report

```bash
npm test          # run the tests
npm run report    # build and open the Allure report
```

In the report: tests grouped by epic and feature, every step, screenshot when a step fails, a video, a Playwright trace (a replay you can click through), and a log for every test.

## 8. GitHub (how we worked)

- **Branches:** `main` (final), `develop` (work in progress), and one small branch per task (`feature/...`, `test/...`, `ci/...`).
- **Pull requests:** every change goes through a PR and the other member reviews it.
- **Issues and milestones:** every task is an issue, grouped into milestones M1–M4 (see `docs/TASK_BREAKDOWN.md`).
- **CI (`ci.yml`):** on every PR it type-checks and runs the smoke tests. On every merge to `main` it runs the regression suite and publishes the Allure report to GitHub Pages.
- **Why Toolshop is skipped on GitHub:** the Toolshop website shows GitHub's servers a Cloudflare *"Verify you are human"* page. No automated test can pass that, so CI skips `@toolshop` tests. They run fine on our laptops.

## 9. Who did what

| Abdur Rafay | Ammar |
|---|---|
| Project setup, config, browser/hooks core | Page objects for all three websites |
| Data layer (Excel, SQLite, Redis, JSON) | SauceDemo, Toolshop and The Internet tests |
| Allure reporting, GitHub Actions CI | Data-driven feature tests |
| Documentation | Simplified page code (PageManager, Toolshop waits) |

## 10. Questions sir may ask (with short answers)

**Q: What is BDD?**
A: Behaviour-Driven Development. We write the expected behaviour in plain English (Given / When / Then) first, then code that makes it run. Anyone can read the test.

**Q: What is the Page Object Model and why use it?**
A: One class per page that keeps the selectors and actions of that page. If the website changes a button, we fix it in one class, not in every test.

**Q: Difference between `Scenario` and `Scenario Outline`?**
A: A Scenario runs once. A Scenario Outline runs once for every row of its `Examples:` table, so one test covers many inputs.

**Q: What is a step definition?**
A: The code behind one English line. Cucumber matches the text of the line to the step with the same pattern.

**Q: What are hooks?**
A: Code that runs automatically before/after tests: open the browser, start a fresh window per test, take a screenshot on failure, close everything at the end.

**Q: Why a fresh browser context per test?**
A: So tests do not affect each other (no shared cookies or login). Every test starts clean, and tests can run in parallel.

**Q: How do you avoid flaky tests?**
A: No fixed sleeps. Playwright waits for elements automatically, and for Toolshop we wait for the server's answer before checking the results. CI also retries a failed test once.

**Q: How do you run tests on another browser?**
A: `npm run test:firefox`, `npm run test:webkit`, or set `BROWSER=...`. On a phone size: `npm run test:mobile`.

**Q: How do you run only some tests?**
A: With tags: `npx cucumber-js --tags "@smoke"`, or one file: `npx cucumber-js features/saucedemo/login.feature`.

**Q: How does a test get data from Excel / the database / Redis?**
A: Through `DataManager`. The step says which source; `DataManager` gives back the right reader, and every reader has the same `getByKey` / `getAll` functions.

**Q: What does the CI do?**
A: On every pull request: type-check, check every Gherkin line has a step, run the smoke tests. On every merge to `main`: run the regression tests and publish the Allure report.

**Q: What happens when a test fails?**
A: It is marked failed in the report with a screenshot of the failing step, a video, a trace and the log. `npm run test:rerun` runs only the tests that failed last time.

## 11. Demo in 2 minutes

```bash
npm run test:headed -- features/saucedemo/login.feature   # watch the browser do the test
npm run test:smoke                                         # quick set of the most important tests
npm run report                                             # open the Allure report
```

Then open the GitHub repo and show: the **Actions** tab (green CI), the **Pull requests** (reviews by the other member), and the **Issues** with milestones.
