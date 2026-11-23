# Setup and running the tests

## 1. What you need

| Tool | Version | Why |
|---|---|---|
| Python | 3.11 or newer | Runs the tests |
| Git | any | Gets the code |
| Node.js | 18 or newer | Only to build the Allure report (`npx allure ...`). No Java needed |
| Redis | optional | Without it, a fake in-memory Redis is used automatically |

## 2. Install (once)

```bash
git clone https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework.git
cd Ui-Test-Automation-Framework

python -m venv .venv                   # a private folder for this project's packages
.venv\Scripts\activate                 # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt        # pytest, pytest-bdd, Playwright, Allure, openpyxl, redis
python -m playwright install           # downloads Chromium, Firefox and WebKit
python test_data/create_test_data.py   # builds test_data.xlsx and test_data.db from the JSON files
```

## 3. Run

```bash
pytest                         # all tests
pytest -m smoke                # the 4 most important tests
pytest -m login                # one feature (tags: login, search, contact, cart, data_driven)
pytest tests/test_cart.py      # one test file
pytest --browser firefox       # another browser: chromium (default), firefox, webkit
pytest --headed --slowmo 500   # watch the browser, slowed down
pytest --device "Pixel 7"      # phone-size screen
```

## 4. See the report

```bash
npx allure@3.33.0 generate allure-results    # builds allure-report/
npx allure@3.33.0 open allure-report         # opens it in the browser
```

The report shows every scenario with its Gherkin steps, the page actions inside each step, the log of the test, and a screenshot of the step that failed.

For a failed test, Playwright also keeps a **screenshot, a video and a trace** in `test-results/`. Open a trace with:

```bash
python -m playwright show-trace test-results/<test-folder>/trace.zip
```

## 5. Settings

All settings are in `pytest.ini`:

| Setting | Meaning |
|---|---|
| `--base-url` | The website under test (`https://automationexercise.com`) |
| `--alluredir` | Where the Allure results go |
| `--reruns 2` | Re-run a failed test up to 2 times (the demo site is sometimes overloaded) |
| `--screenshot / --video / --tracing` | Keep these only for failed tests |
| `markers` | The tags that can be used with `-m` |

Environment variable: `REDIS_URL` (e.g. `redis://localhost:6379`). If it is empty, a fake in-memory Redis is used. To fill a real Redis server: `python test_data/create_test_data.py --redis`.

## 6. Common problems

| Problem | Fix |
|---|---|
| `Executable doesn't exist ...` | Run `python -m playwright install` |
| `No such file: test_data.xlsx` | Run `python test_data/create_test_data.py` |
| Page shows "This website is under heavy load" | The demo site is busy. Wait a minute, or run fewer tests at the same time (no `-n`) |
| WebKit does not start on Windows | Known Playwright limitation on some Windows machines. Use Chromium or Firefox; CI runs WebKit |
| Redis `Connection refused` | Start Redis, or remove `REDIS_URL` to use the in-memory Redis |
