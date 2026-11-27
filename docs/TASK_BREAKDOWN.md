# Task breakdown (group of two)

The project was split into small tasks. Each one became a GitHub issue, a branch and a pull request reviewed by the other member.

| Member | GitHub |
|---|---|
| Abdur Rafay Baig | [@AbdurRafayBaig](https://github.com/AbdurRafayBaig) |
| Ammar Ahmed | [@ammarahmed6176](https://github.com/ammarahmed6176) |

| # | Task | Owner | Deliverable |
|---|---|---|---|
| 1 | Project setup: Python, pytest, pytest-bdd, Playwright, settings | Abdur Rafay | `requirements.txt`, `pytest.ini` |
| 2 | Shared setup: ad blocker, test account through the API, screenshot on failure | Abdur Rafay | `conftest.py` |
| 3 | Test data from Excel, SQLite and Redis, and the script that builds it | Abdur Rafay | `utils/data_reader.py`, `test_data/` |
| 4 | Allure reporting: Gherkin steps, page steps, logs, screenshots, environment | Abdur Rafay | `allure-pytest-bdd`, `conftest.py` |
| 5 | Page objects: BasePage, login, products, cart, contact us | Ammar | `pages/` |
| 6 | Login and search features with their steps | Ammar | `features/login.feature`, `features/search.feature`, `features/steps/` |
| 7 | Contact-us form and cart features with their steps | Ammar | `features/contact_us.feature`, `features/cart.feature`, `features/steps/` |
| 8 | Data-driven feature (Excel / SQLite / Redis) | Abdur Rafay + Ammar | `features/data_driven.feature` |
| 9 | GitHub Actions: CI, Pages deploy, cross-browser, auto-merge, PR checks | Abdur Rafay | `.github/workflows/` |
| 10 | Templates: pull request, issues, CODEOWNERS, Dependabot | Ammar | `.github/` |
| 11 | Documentation and viva guide | Abdur Rafay (Ammar reviews) | `README.md`, `docs/` |

## Milestones

| Milestone | Tasks |
|---|---|
| M1: Framework skeleton | 1, 2 |
| M2: Reporting & data | 3, 4 |
| M3: Test coverage | 5, 6, 7, 8 |
| M4: GitHub & docs | 9, 10, 11 |

## Working agreement

- Nobody pushes to `main` or `develop` directly. Everything goes through a pull request with one approval from the other member.
- A pull request stays small: one issue.
- The reviewer opens the Allure report from the pull request's CI run before approving.
- A failing test on `main` gets an issue within one day, labelled `bug` or `flaky`.
