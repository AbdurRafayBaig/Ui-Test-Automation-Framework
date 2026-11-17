# Web UI Test Automation Framework

[![CI](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/ci.yml)
[![Cross-browser](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/cross-browser.yml/badge.svg)](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/cross-browser.yml)
[![Allure report](https://img.shields.io/badge/Allure-latest%20report-orange)](https://abdurrafaybaig.github.io/Ui-Test-Automation-Framework/)

A BDD test automation framework for web UIs, built with **Playwright**, **Cucumber (Gherkin)**, **TypeScript** and **Allure**. Test data can come from **Excel, a SQL database (SQLite), Redis or JSON**. The code follows the **Page Object Model**.

It ships with **66 scenarios against three public demo applications**:

| Application | What is covered |
|---|---|
| [SauceDemo](https://www.saucedemo.com) (e-commerce) | login (positive / negative), catalogue sorting, product details, cart, full checkout with price verification, checkout form validation |
| [Toolshop](https://practicesoftwaretesting.com) (catalogue) | product **search**, no-result search, sort by price, category filter, add to cart, **contact form** validation |
| [The Internet](https://the-internet.herokuapp.com) (widgets) | form authentication, checkboxes, dropdowns, dynamic loading, JS alert / confirm / prompt dialogs, file upload |

---

## Features at a glance

| Requirement | How this framework meets it |
|---|---|
| Multiple browsers & platforms | `BROWSER=chromium\|firefox\|webkit\|chrome\|msedge`, `DEVICE="Pixel 7"` mobile emulation. CI runs on Linux, Windows and macOS |
| Modular & scalable | Layered design: config → core → pages → steps → features. Parallel workers via `PARALLEL=n` |
| Gherkin / BDD | Cucumber-js with `.feature` files, Background, Data Tables, **Scenario Outline + Examples** |
| Data-driven | Inline Examples tables **and** external sources resolved at run time through the `DataManager` |
| Excel / DB / Redis | `ExcelDataProvider`, `SqliteDataProvider`, `RedisDataProvider` (+ `JsonDataProvider`), behind one interface |
| Reporting | Allure 3: epics/features/severity from tags, nested steps, screenshots, Playwright traces, videos, per-scenario logs, environment info, history. Also Cucumber HTML, JSON and JUnit reports |
| Design pattern | Page Object Model + component objects + a lazy `PageManager` (factory) |
| GitHub | CI on every PR and every merge to `main`, nightly cross-browser matrix, report deployed to GitHub Pages, auto-merge, PR checks, Dependabot, issue/PR templates, CODEOWNERS |

## Quick start

Prerequisites: **Node.js 22.13+** (24 recommended) and Git. Java is **not** needed, because Allure 3 is pure Node.

```bash
npm ci                          # install dependencies
npx playwright install          # download browsers (chromium, firefox, webkit)
npm run data:seed               # build test-data/test-data.xlsx and test-data.db from JSON
npm test                        # run the whole suite (headless chromium)
npm run report                  # generate + open the Allure report
```

## Common commands

| Command | What it does |
|---|---|
| `npm test` | All scenarios except `@wip` |
| `npm run test:smoke` | `@smoke` scenarios only (fast PR gate) |
| `npm run test:regression` | `@regression` + `@smoke` |
| `npm run test:data` | Only the data-driven (Excel / DB / Redis / JSON) scenarios |
| `npm run test:firefox` / `test:webkit` | Same suite on another engine |
| `npm run test:mobile` | Smoke suite emulating a Pixel 7 |
| `npm run test:headed` | Visible browser, slowed down. Good for demos |
| `npm run test:parallel` | 4 parallel workers |
| `npm run test:rerun` | Re-run only the scenarios that failed last time |
| `npx cucumber-js --tags "@cart and not @negative"` | Any tag expression |
| `npx cucumber-js features/saucedemo/login.feature:11` | One scenario by line number |
| `npm run report` | Generate and open the Allure report |
| `npm run typecheck` / `npm run lint:features` | Static checks run in CI |

Every setting can be changed through environment variables or a `.env` file (see [.env.example](.env.example)).

## Project structure

```
├── features/                   # Gherkin specifications (what is tested)
│   ├── saucedemo/              #   login, inventory, cart, checkout
│   ├── toolshop/               #   search, contact form
│   ├── theinternet/            #   forms & widgets
│   └── data-driven/            #   Excel / SQLite / Redis / JSON driven outlines
├── src/
│   ├── config/config.ts        # typed config from env vars + config/environments/*.json
│   ├── core/                   # World, hooks, BrowserManager, Logger, expect, ScenarioContext
│   ├── pages/                  # Page Object Model (BasePage, PageManager, one class per page)
│   ├── data/                   # DataProvider interface, DataManager, Excel/SQLite/Redis/JSON providers
│   └── steps/                  # step definitions (glue between Gherkin and page objects)
├── test-data/
│   ├── json/                   # canonical test data (single source of truth)
│   ├── test-data.xlsx          # generated by `npm run data:seed`
│   ├── test-data.db            # generated by `npm run data:seed`
│   └── files/                  # upload fixtures
├── config/environments/        # qa.json, staging.json (URLs and timeouts per environment)
├── scripts/seed-data.ts        # builds Excel, SQLite and Redis data from JSON
├── docs/                       # full documentation (below)
├── .github/                    # workflows, templates, CODEOWNERS, dependabot
├── cucumber.js                 # cucumber profiles, formatters, Allure label mapping
└── allurerc.mjs                # Allure 3 report configuration
```

## Documentation

| Guide | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Installation, configuration, environment variables, running on any browser/OS, Redis |
| [docs/WRITING_TESTS.md](docs/WRITING_TESTS.md) | Step-by-step: writing a feature, step definitions and a page object; tags; data-driven tests |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, request flow, design patterns and the reasons behind every major decision |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | Excel / SQLite / Redis / JSON providers and how to add a new one |
| [docs/REPORTING.md](docs/REPORTING.md) | Allure integration, what each report shows, how to read it, example report |
| [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) | Branching, PRs, reviews, issues, project board, CI/CD pipelines, branch protection |
| [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md) | How the project was split into tasks between the two group members |

An **example Allure report** is in [docs/example-report/index.html](docs/example-report/index.html). Download it and open it in a browser.

## A taste of the framework

```gherkin
@data-driven @feature:Login
Scenario Outline: Login outcome for the "<user>" user read from <source>
  Given I am on the SauceDemo login page
  And I load the "users" record "<user>" from the "<source>" data source
  When I log in with the loaded user
  Then the login result should match the loaded user's expected outcome

  @excel
  Examples:
    | source | user       |
    | excel  | standard   |
    | excel  | locked_out |
  @redis
  Examples:
    | source | user    |
    | redis  | visual  |
```

```ts
// steps: thin glue, no selectors
When('I log in with the loaded user', async function (this: CustomWorld) {
  const user = this.scenario.get<DataRecord>(LOADED_RECORD);
  await this.pages.login.login(user.username, user.password);
});

// page object: selectors + intent, no assertions
async login(username: string, password: string) {
  await this.step(`Log in as "${username}"`, async () => {
    await this.fill(this.usernameInput, username, 'username field');
    await this.fill(this.passwordInput, password, 'password field', true);
    await this.click(this.loginButton, 'Login button');
  });
}
```

## Test results & known issues

Local run (Windows 11, Node 24, 4 parallel workers, no retries):

| Browser | Result |
|---|---|
| Chromium | **66 / 66 passed** |
| Firefox | 63–66 / 66 passed |
| WebKit | Runs in CI (Linux/macOS). WebKit on Windows needs extra system DLLs (see [SETUP](docs/SETUP.md)) |

- The Firefox gaps are always in the 3 *secure login* scenarios on the-internet.herokuapp.com. That free Heroku app sometimes drops the session or answers slowly in Firefox, while the same steps pass in Chromium. This is a problem with the site under test, not the framework. CI runs with `RETRY=1`, and Allure shows the retry history.
- Toolshop (practicesoftwaretesting.com) sits behind Cloudflare. After many back-to-back runs with several workers from one IP it slows down a lot (pages take 15–60 s), and Toolshop scenarios then time out. Its page objects already allow the longer navigation timeout (45 s). If it still happens, wait a few minutes or run with fewer workers (`PARALLEL=1`). With a short pause between runs, all Toolshop scenarios pass.
- All three demo applications are public websites. Their data (e.g. stock levels on Toolshop) can change, so tests avoid hard-coding live values where possible.

## License

[MIT](LICENSE). Built as an educational project (Software Testing course, Project Phase 2).
