# Setup & usage

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 22.13 or newer (24 LTS recommended) | Runtime. The built-in `node:sqlite` driver is used for the database provider |
| npm | ships with Node | Package manager |
| Git | any recent | Source control |
| Redis | optional | Only needed to run the Redis provider against a real server. Without it an in-memory Redis is used automatically |

You do **not** need Java (Allure 3 is pure Node), a C++ toolchain (no native modules), or a separately installed browser (Playwright downloads its own).

## 2. Install

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
npm ci
npx playwright install            # chromium, firefox, webkit
# Linux only, first time: npx playwright install-deps
npm run data:seed                 # (re)generate test-data.xlsx and test-data.db
```

> **Windows note:** WebKit on Windows needs extra system libraries (e.g. `libwebp.dll`). If `BROWSER=webkit` fails locally, run WebKit through CI (Linux/macOS) instead. Chromium, Chrome, Edge and Firefox all work on Windows.

## 3. Run

```bash
npm test                                   # everything (except @wip)
npm run test:smoke                         # smoke suite
npx cucumber-js --tags "@saucedemo and @negative"
npx cucumber-js features/toolshop/search.feature
npx cucumber-js features/saucedemo/login.feature:11   # one scenario by line
npm run test:headed                        # watch it run
```

`npm test` cleans `allure-results/`, `allure-report/` and `reports/` first (the `pretest` script).

## 4. Configuration

Configuration is resolved in this order (later wins):

1. `config/environments/<TEST_ENV>.json`: application URLs and timeouts per environment
2. `.env` file in the project root (copy from `.env.example`)
3. Real environment variables / CI variables / `cross-env` in npm scripts

| Variable | Default | Values / meaning |
|---|---|---|
| `TEST_ENV` | `qa` | Picks `config/environments/<name>.json` (`qa`, `staging`, or add your own) |
| `BROWSER` | `chromium` | `chromium`, `firefox`, `webkit`, `chrome` (branded Chrome), `msedge` |
| `HEADLESS` | `true` | `false` shows the browser |
| `SLOW_MO` | `0` | Milliseconds of delay per Playwright action |
| `DEVICE` | – | Playwright device name for mobile emulation, e.g. `iPhone 13`, `Pixel 7` |
| `VIEWPORT_WIDTH` / `VIEWPORT_HEIGHT` | `1366` / `768` | Desktop viewport |
| `SCREENSHOT` | `on-failure` | `on` (every step), `off`, `on-failure` |
| `TRACE` | `on-failure` | Playwright trace zip attached to the report |
| `VIDEO` | `off` | Video of the scenario attached to the report |
| `PARALLEL` | `1` | Number of Cucumber worker processes |
| `RETRY` | `0` | Retry failed scenarios N times |
| `SAUCEDEMO_URL`, `TOOLSHOP_URL`, `THEINTERNET_URL` | from env file | Override one application URL |
| `EXCEL_DATA_FILE` | `test-data/test-data.xlsx` | Excel workbook location |
| `SQLITE_DATA_FILE` | `test-data/test-data.db` | SQLite database location |
| `JSON_DATA_DIR` | `test-data/json` | JSON fixtures (also used to seed Redis) |
| `REDIS_URL` | – | e.g. `redis://localhost:6379`. Empty means an in-memory Redis is used |
| `LOG_LEVEL` | `warn` | Console verbosity. The full log is always attached to the report |

Examples:

```bash
# PowerShell
$env:BROWSER="firefox"; $env:PARALLEL="4"; npm test

# bash / Git Bash / macOS / Linux
BROWSER=webkit DEVICE="iPhone 13" npx cucumber-js -p smoke

# cross-platform (what the npm scripts use)
npx cross-env TEST_ENV=staging BROWSER=msedge cucumber-js
```

## 5. Using a real Redis server (optional)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
# then
export REDIS_URL=redis://localhost:6379        # PowerShell: $env:REDIS_URL="redis://localhost:6379"
npm run data:seed:redis
npm run test:data
```

CI does exactly this with a Redis service container.

## 6. Reports

```bash
npm run report            # allure generate + open
npm run report:generate   # just build ./allure-report
```

Other outputs written on every run, in `reports/`:

- `cucumber-report.html`: single-page Cucumber report
- `cucumber-report.json`: machine-readable results
- `junit.xml`: for CI test-summary widgets
- `rerun.txt`: failed scenarios, used by `npm run test:rerun`
- `traces/*.zip`: open with `npx playwright show-trace reports/traces/<file>.zip`

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Workbook not found` / `Database not found` | Run `npm run data:seed` |
| `Executable doesn't exist ... ms-playwright` | Run `npx playwright install` |
| `[redis] Cannot connect to ...` | Start Redis or unset `REDIS_URL` to use the in-memory store |
| `Undefined step` | Run `npm run lint:features`. It prints a ready-to-paste snippet |
| Timeouts against demo sites | They are public and sometimes slow. Use `RETRY=1`, or raise the timeouts in `config/environments/qa.json` |
