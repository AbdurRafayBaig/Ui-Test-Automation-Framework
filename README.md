# Web UI Test Automation Framework

[![CI](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/ci.yml)
[![Cross-browser](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/cross-browser.yml/badge.svg)](https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework/actions/workflows/cross-browser.yml)
[![Allure report](https://img.shields.io/badge/Allure-latest%20report-orange)](https://abdurrafaybaig.github.io/Ui-Test-Automation-Framework/)

Automated UI tests for the demo shop **[Automation Exercise](https://automationexercise.com)**, written with **Python, Pytest, Playwright and Gherkin (pytest-bdd)**, using the **Page Object Model**, with test data from **Excel, SQLite, Redis and JSON** and an **Allure** report.

Software Testing course, Project Phase 2. Team: **Abdur Rafay Baig** ([@AbdurRafayBaig](https://github.com/AbdurRafayBaig)) and **Ammar Ahmed** ([@ammarahmed6176](https://github.com/ammarahmed6176)).

## What is tested (26 tests)

| Feature file | What it checks |
|---|---|
| `features/login.feature` | Log in with a real account, wrong email or password is rejected, log out |
| `features/search.feature` | Search by product name and by keyword, search with no results |
| `features/contact_us.feature` | Send the contact form with a file attached, and with different messages |
| `features/cart.feature` | Add one or two products, check the price, remove a product |
| `features/data_driven.feature` | Login and search with data read from Excel, SQLite, Redis and JSON |

## Requirements and where they are met

| Requirement | How |
|---|---|
| Playwright, several browsers and platforms | `pytest --browser chromium / firefox / webkit`, phone screens with `--device "Pixel 7"`. CI runs on Linux, Windows and macOS |
| Gherkin / BDD | `.feature` files in `features/`, run by **pytest-bdd** |
| Pytest | Every test is a pytest test (`tests/test_*.py`), with fixtures, markers and plugins |
| Scenario Outline / data-driven | `Examples:` tables, and `data_driven.feature` with Excel / SQLite / Redis / JSON |
| Page Object Model | One class per page in `pages/`, all built on `BasePage` |
| Allure with logs and screenshots | Gherkin steps, page actions, a log for every test, a screenshot when a step fails |
| GitHub workflows | Tests on every pull request and every merge, report published to GitHub Pages, nightly cross-browser run |

## Quick start

You need **Python 3.11+** (and **Node.js** only to build the Allure report).

```bash
python -m venv .venv
.venv\Scripts\activate                 # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python -m playwright install           # downloads the browsers
python test_data/create_test_data.py   # builds the Excel file and the SQLite database

pytest                                 # run all tests
npx allure@3.33.0 generate allure-results && npx allure@3.33.0 open allure-report
```

## Useful commands

| Command | What it does |
|---|---|
| `pytest` | All tests (Chromium, browser hidden) |
| `pytest -m smoke` | Only the 4 most important tests |
| `pytest -m "cart or search"` | Tests with these tags |
| `pytest --browser firefox` | Run on Firefox (also `webkit`) |
| `pytest --headed --slowmo 500` | Watch the browser while it tests |
| `pytest --device "Pixel 7"` | Run on a phone-size screen |
| `pytest -n 2` | Run 2 tests at the same time (the site blocks more, see below) |

## Project structure

```
features/      the tests in plain English (Gherkin)
tests/         step definitions: the Python code behind each Gherkin line
pages/         page objects: where the buttons are + what you can do on each page
utils/         data_reader.py: reads test data from Excel, SQLite, Redis or JSON
test_data/     the test data (JSON, Excel, SQLite) and the script that builds it
conftest.py    shared setup: ad blocker, test account, screenshot on failure
pytest.ini     pytest settings (website address, report folder, reruns, tags)
.github/       GitHub Actions workflows, issue and pull request templates
docs/          documentation
```

## Documentation

| Guide | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Installing and running the tests, browsers, Redis, common problems |
| [docs/WRITING_TESTS.md](docs/WRITING_TESTS.md) | How to add a feature, its steps and a page object |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Design decisions: layers, POM, test data, reporting |
| [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) | Branches, pull requests, reviews, issues, CI/CD |
| [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md) | How the work was split between the two members |
| [docs/VIVA_GUIDE.md](docs/VIVA_GUIDE.md) | The whole project in simple words, with likely questions and answers |

An example Allure report is in [docs/example-report/index.html](docs/example-report/index.html) (download and open it in a browser).

## Known issues

- **Automation Exercise is a free public demo site.** When it is busy it sometimes answers *"This website is under heavy load (queue full)"* or `503`. Every test is therefore re-run up to 2 times if it fails (`--reruns 2` in `pytest.ini`), and tests run one after another by default. Running many in parallel (`-n 4`) makes the site block us.
- WebKit (Safari engine) does not start on some Windows machines. It runs in CI on Linux and macOS.

## License

[MIT](LICENSE)
