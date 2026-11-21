# Reporting

## Allure integration

| Piece | Role |
|---|---|
| `allure-cucumberjs/reporter` (formatter in `cucumber.js`) | Converts Cucumber events into `allure-results/*.json` |
| `allure-js-commons` | Runtime API used by the framework: nested steps, parameters, attachments |
| `allure` (v3 CLI, pure Node) | Builds the HTML report from `allure-results/` using `allurerc.mjs` |

```bash
npm test                 # writes allure-results/
npm run report           # allure generate + allure open
```

## What ends up in the report

| Report element | Where it comes from |
|---|---|
| **Behaviors** tree: Epic → Feature → Scenario | `@epic:E-Commerce`, `@feature:Checkout` tags, mapped in `cucumber.js` → `formatOptions.labels` |
| **Severity** | `@severity:blocker` … `@severity:trivial` tags |
| **Gherkin steps** with pass/fail status | Each Given/When/Then |
| **Nested sub-steps** (e.g. *Type "standard_user" into username field*) | `BasePage.step()` wraps every page action in `allure.step()` |
| **Parameters** browser / environment / device / data source | `allure.parameter()` in the `Before` hook and in the data-loading step |
| **Scenario Outline rows** | Every Examples row is a separate test, with its values as parameters |
| **Screenshot of the failing step** | `AfterStep` hook (`SCREENSHOT=on-failure`, or `on` for every step) |
| **Playwright trace** (time-travel debugger) | `After` hook (`TRACE=on-failure`). Allure renders it inline |
| **Video** | `VIDEO=on-failure` / `on` |
| **scenario.log** | Every page action, data load and browser console error, with timestamps |
| **Test data used** | Loaded records attached as JSON (passwords masked in the log) |
| **Data tables** | Gherkin data tables attached as CSV |
| **Environment** widget | `formatOptions.environmentInfo` (browser, env, Node, OS) |
| **History / trends / retries** | `allure-history/history.jsonl`, cached between CI runs. Retried scenarios show their earlier attempts |
| **Issue links** | `@issue:42` tag → link to GitHub issue #42 |

## Reading the report

1. **Overview / Summary**: the pass-rate donut and the counts. *Failed* means an assertion failed (a product defect or a wrong expectation). *Broken* means an unexpected error such as a timeout or missing element (usually the environment or a test bug).
2. **Behaviors**: browse by epic and feature, the way the business thinks about it.
3. Open a failed test: the failing step is red. Open its **screenshot**, then the **trace** for a step-by-step DOM replay, then `scenario.log` for the timeline.
4. **Graphs / Timeline**: duration and parallelism. Use them to spot slow scenarios.

## Other formats (written to `reports/`)

- `cucumber-report.html`: self-contained single page, easy to email
- `cucumber-report.json`: for custom dashboards
- `junit.xml`: shown in the GitHub Actions job summary (dorny/test-reporter)
- `@rerun.txt`: failed scenarios for `npm run test:rerun`

## In CI

- Every run uploads `allure-report` as a build artifact (14 days).
- Every merge to `main` deploys the report to **GitHub Pages** at `https://<owner>.github.io/<repo>/`.
- The nightly cross-browser job uploads one report per browser/OS combination.

## Example report

`docs/example-report/index.html` is a single-file Allure report from a real local run. Open it in any browser, no server needed. To regenerate it:

```bash
npm test
npx allure generate allure-results --config allurerc.single.mjs
```
