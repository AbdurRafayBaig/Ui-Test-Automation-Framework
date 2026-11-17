# Task breakdown (group of two)

The project was split into small tasks. Each one became a GitHub issue, a branch and a pull request reviewed by the other member. Replace *Member 1* / *Member 2* with your names and GitHub handles.

| # | Task | Owner | Branch | Deliverable |
|---|---|---|---|---|
| 1 | Repository, Node/TypeScript project, tooling (`tsconfig`, `.editorconfig`, `.gitignore`) | Member 1 | `chore/1-project-setup` | Buildable empty project |
| 2 | Configuration layer: environments, env vars, validation | Member 1 | `feature/2-config` | `src/config`, `config/environments` |
| 3 | Core: World, hooks, BrowserManager (multi-browser, devices), Logger | Member 1 | `feature/3-core` | `src/core` |
| 4 | Allure integration: labels from tags, steps, screenshots, traces, videos, logs | Member 1 | `feature/4-allure` | `cucumber.js`, `allurerc.mjs`, hooks |
| 5 | Data layer: DataProvider interface, DataManager, Excel + SQLite providers | Member 1 | `feature/5-data-excel-sqlite` | `src/data` |
| 6 | Redis + JSON providers, seed script | Member 1 | `feature/6-data-redis` | `RedisDataProvider`, `scripts/seed-data.ts` |
| 7 | BasePage, PageManager, SauceDemo page objects | Member 2 | `feature/7-saucedemo-pages` | `src/pages/saucedemo` |
| 8 | SauceDemo features + steps: login, inventory, cart, checkout | Member 2 | `feature/8-saucedemo-tests` | `features/saucedemo` |
| 9 | Toolshop pages + search & contact-form features | Member 2 | `feature/9-toolshop` | `features/toolshop` |
| 10 | The Internet pages + widget features (dialogs, upload, dynamic) | Member 2 | `feature/10-theinternet` | `features/theinternet` |
| 11 | Data-driven features (Excel / SQLite / Redis / JSON outlines) | Member 1 + 2 | `feature/11-data-driven` | `features/data-driven` |
| 12 | GitHub Actions: CI, cross-browser matrix, Pages deploy, auto-merge, PR checks | Member 1 | `ci/12-workflows` | `.github/workflows` |
| 13 | Templates: PR, issues, CODEOWNERS, Dependabot, branch protection | Member 2 | `chore/13-github-templates` | `.github/` |
| 14 | Documentation: README, setup, writing tests, architecture, data, reporting, GitHub | Member 2 (Member 1 reviews) | `docs/14-documentation` | `README.md`, `docs/` |
| 15 | Stabilisation: cross-browser run, flaky-test fixes, example report | Member 1 + 2 | `fix/15-stabilisation` | green CI on all browsers |

## Milestones

| Milestone | Issues |
|---|---|
| M1: Framework skeleton | 1, 2, 3 |
| M2: Reporting & data | 4, 5, 6 |
| M3: Test coverage | 7, 8, 9, 10, 11 |
| M4: GitHub & docs | 12, 13, 14, 15 |

## Working agreement

- Nobody pushes to `main` or `develop` directly. Everything goes through a PR with one approval from the other member.
- A PR stays small: one issue, ideally under 400 changed lines.
- The reviewer opens the Allure report artifact from the PR's CI run before approving.
- A failing nightly run gets an issue within one working day, labelled `bug` or `flaky`.
