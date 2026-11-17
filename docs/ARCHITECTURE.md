# Architecture & design decisions

## 1. Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│  features/*.feature          Gherkin: business-readable behaviour   │  ← QA, BA, PO
├─────────────────────────────────────────────────────────────────────┤
│  src/steps/*.steps.ts        Glue: map sentences → page calls,      │
│                              hold the assertions                    │
├─────────────────────────────────────────────────────────────────────┤
│  src/pages/**                Page Object Model: selectors + actions │
│     BasePage ─┬─ LoginPage, InventoryPage, CartPage, ...            │
│               └─ HeaderComponent (component object)                 │
│     PageManager (lazy factory, one per scenario)                    │
├───────────────────────────────┬─────────────────────────────────────┤
│  src/data/**                  │  src/core/**                        │
│  DataManager (registry)       │  World (per-scenario state)         │
│   ├ ExcelDataProvider         │  hooks (lifecycle, artifacts)       │
│   ├ SqliteDataProvider        │  BrowserManager (browser/context)   │
│   ├ RedisDataProvider         │  Logger, ScenarioContext, expect    │
│   └ JsonDataProvider          │                                     │
├───────────────────────────────┴─────────────────────────────────────┤
│  src/config/config.ts   env vars + config/environments/<env>.json   │
├─────────────────────────────────────────────────────────────────────┤
│  Playwright  ·  Cucumber-js  ·  Allure  ·  exceljs · node:sqlite ·  │
│  ioredis                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

Each layer only depends on the layers below it. Features know nothing about selectors. Page objects know nothing about Gherkin or assertions. The data layer knows nothing about browsers.

## 2. Lifecycle of one scenario

```
BeforeAll  (once per worker)  → BrowserManager.launch()           one browser per worker process
Before     (every scenario)   → new BrowserContext (clean cookies/storage = isolated test)
                                start tracing, new Page, World.init() → PageManager + Logger
                                add Allure parameters (browser, env, device)
  Given/When/Then steps        → this.pages.<page>.<action>()   → nested Allure steps + log lines
AfterStep  (every step)       → screenshot on failure (or always with SCREENSHOT=on)
After      (every scenario)   → stop trace (keep on failure), close context, attach video,
                                attach scenario log
AfterAll   (once per worker)  → close browser, close every data connection
```

A **new browser context per scenario** gives complete isolation (cookies, local storage, cache) at roughly 10% of the cost of launching a new browser. This is also what lets scenarios run safely in parallel.

## 3. Design patterns used, and why

| Pattern | Where | Why |
|---|---|---|
| **Page Object Model** | `src/pages/**` | Selectors live in exactly one place. When the UI changes, one class changes and the feature files and steps stay untouched. This was a project requirement and is the most common UI-automation pattern. |
| **Component Object** | `HeaderComponent` | The cart icon and burger menu appear on several pages. Composing one component avoids copying selectors into every page. |
| **Template Method** | `BasePage.open()` → `waitUntilLoaded()` | The navigation algorithm is shared. Each page only overrides "what does loaded mean for me". |
| **Factory + lazy cache (Flyweight)** | `PageManager` | Steps write `this.pages.cart` and never call `new`. Pages are created only when first used and reused within the scenario. Adding a page is one getter. |
| **Strategy (via interface)** | `DataProvider` with Excel / SQLite / Redis / JSON | Every source has the same contract (`getAll`, `getByKey`), so steps can switch sources by name (`"excel"` → `"redis"`) without code changes. |
| **Registry + Singleton** | `DataManager` | One lazily-created connection per source for the whole run. A suite that never touches Redis never connects to it. `DataManager.register()` plugs in new sources at runtime. |
| **Dependency Injection (light)** | `World` → `PageManager` → pages receive `page` and `logger` | Pages are easy to construct in isolation and never reach for globals. |
| **Context Object** | `ScenarioContext` | Typed, per-scenario key/value store for passing data between steps without module-level globals (which would leak between parallel scenarios). |
| **Immutable configuration** | `config.ts` (`Object.freeze`) | One validated source of truth. A bad value (e.g. `BROWSER=safari`) fails fast with a clear message instead of halfway through a run. |

### Why not Screenplay?
Screenplay (actors, tasks, questions) scales very well for huge suites but adds a lot of abstraction. For a suite of this size, POM plus component objects is easier for new team members to learn and is what the brief asks for. The thin-step / fat-page split keeps a later migration possible.

## 4. Technology decisions

| Decision | Alternatives | Reasoning |
|---|---|---|
| **Playwright** | Selenium, Cypress | Required by the brief. One API for Chromium, Firefox and WebKit. Auto-waiting removes most flakiness. Built-in tracing, video and device emulation. |
| **Cucumber-js** with Playwright as a library (not `@playwright/test`) | playwright-bdd, SpecFlow | Cucumber is the reference Gherkin implementation: Scenario Outline, Data Tables, tag expressions, profiles, parallel workers, rerun and many formatters. Using Playwright as a library lets us control the browser lifecycle in hooks. We still use `@playwright/test`'s `expect` for its retrying, web-first assertions. |
| **TypeScript** | JavaScript | Type-checked page objects and step signatures catch typos at compile time (`npm run typecheck` runs in CI) and give IDE autocomplete. |
| **tsx** loader | ts-node, pre-compiling | Zero-config, very fast (esbuild) and handles modern TS without a build step. |
| **Allure 3** (`allure` npm package) | Allure 2 (Java), Cucumber HTML | Same rich report as Allure 2 but pure Node.js, so contributors and CI need no JDK. Cucumber HTML/JSON/JUnit are produced too. |
| **exceljs** | `xlsx` (SheetJS) | Actively maintained on npm with no known security advisories. Reads and writes styled workbooks. |
| **`node:sqlite`** | `better-sqlite3`, `sqlite3` | Built into Node 22.13+, so no native compilation (which often fails on Windows student machines). The provider uses parameterised queries, so swapping to PostgreSQL/MySQL means changing only the driver. |
| **ioredis + ioredis-mock fallback** | Redis required everywhere | CI uses a real Redis container. Laptops without Redis fall back to an in-memory Redis seeded from the same JSON, so the suite always runs. |
| **JSON as the canonical data source** | Edit Excel/DB by hand | Binary files (xlsx, db) do not diff well in Git. JSON is reviewable in PRs, and `npm run data:seed` regenerates every store from it, so all sources stay consistent. |

## 5. Stability measures (anti-flakiness)

- No fixed sleeps. Web-first assertions (`toHaveText`, `expect.poll`) and explicit waits on state.
- SPA updates (Toolshop) wait for the **actual API response** and then for the result list to stop changing (`waitForStableResults`).
- Tests do not hard-code live data that can change (e.g. "first **in-stock** product" instead of a fixed product name).
- Every scenario runs in its own browser context. No order dependencies.
- `RETRY=1` in CI absorbs the occasional slowness of public demo sites. Retried scenarios are clearly marked in Allure.
- Timeouts are configured per environment (`config/environments/*.json`), not scattered through the code.

## 6. Extending the framework

| You want to... | Do this |
|---|---|
| Add a browser | Add a case to `resolveEngine()` in `BrowserManager.ts` and to the `BrowserName` type |
| Add an environment | Create `config/environments/<name>.json` and run with `TEST_ENV=<name>` |
| Add an application | See "Adding a new application" in [WRITING_TESTS.md](WRITING_TESTS.md) |
| Add a data source | Implement `DataProvider` and register it in `DataManager` ([DATA_SOURCES.md](DATA_SOURCES.md)) |
| Add a report | Add a formatter to `format` in `cucumber.js` |
| Add API testing (future phase) | Add `src/api/` clients using Playwright's `request` context in the same World. Hooks, data and reporting are reused as they are |
