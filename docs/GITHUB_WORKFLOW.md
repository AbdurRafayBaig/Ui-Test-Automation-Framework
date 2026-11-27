# Managing the code on GitHub

## 1. Repository setup (one-time)

1. The repository is https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework. The group member is invited under Settings → Collaborators.
2. Push this project:
   ```bash
   git remote add origin https://github.com/AbdurRafayBaig/Ui-Test-Automation-Framework.git
   git push -u origin main
   git push -u origin develop
   ```
3. `.github/CODEOWNERS` names who reviews which folder (`@AbdurRafayBaig`, `@ammarahmed6176`).
4. **Settings → Pages → Source: GitHub Actions**. This lets the CI publish the Allure report.
5. **Settings → General → Pull Requests**: enable *Allow auto-merge* and *Automatically delete head branches*.
6. **Settings → Branches → Add rule** for `main` (and `develop`):
   - Require a pull request before merging, with 1 approval and *Require review from Code Owners*
   - Require status checks to pass: `UI tests (chromium)`, `title-and-issue`
   - Require branches to be up to date before merging
   - Require conversation resolution
   - Do not allow force pushes
7. Create the labels: `automerge`, `bug`, `test`, `framework`, `enhancement`, `triage`, `documentation` (the `size/*` labels are created automatically).
8. Create a **Project** (board) with the columns *Backlog → To do → In progress → In review → Done*, and enable the built-in workflows that move items automatically when PRs are opened and merged.

## 2. Branching model

```
main      ●───────────●──────────────●────────  protected · always green · deployed report
           \         /              /
develop     ●──●──●─●──────●──●────●──────────  integration branch
             \    /         \    /
feature/...   ●──●           ●──●              one branch per issue
```

| Branch | Purpose | Naming |
|---|---|---|
| `main` | Released, always green. **Every merge triggers the full regression and deploys the report** | – |
| `develop` | Integration of finished features | – |
| feature | New tests / page objects | `feature/<issue#>-short-name`, e.g. `feature/12-cart-quantity` |
| fix | Fix a failing/flaky test or a framework bug | `fix/<issue#>-short-name` |
| docs / ci / chore | Documentation, pipelines, dependencies | `docs/...`, `ci/...`, `chore/...` |

## 3. Day-to-day flow

```bash
# 1. pick an issue on the board, assign it to yourself, move it to "In progress"
git switch develop && git pull
git switch -c feature/12-cart-quantity

# 2. work in small commits (Conventional Commits)
git commit -m "test(cart): add change-quantity scenario"

# 3. run checks locally
pytest --collect-only -q && pytest -m cart

# 4. push and open a PR into develop
git push -u origin feature/12-cart-quantity
gh pr create --base develop --fill        # or use the web UI. The PR template appears
```

5. CI runs: it loads every feature file and test, then runs the **smoke tests** and uploads the Allure report.
6. The teammate reviews: the code (selectors only in pages, no sleeps, tags present) and the Allure report artifact.
7. Address the comments, get approval, then **Squash & merge**, or add the `automerge` label so it merges itself when the checks pass.
8. Periodically open a PR `develop → main`. Merging it runs the **full regression** and **deploys the report to GitHub Pages**.

### Commit / PR title convention (Conventional Commits)

```
<type>(<scope>): <summary>

type  = feat | fix | test | docs | refactor | chore | ci | perf
scope = login | cart | search | contact | data | pages | ci | ...
```

Examples: `feat(data): read users from Redis`, `test(search): add no-results scenario`, `fix(cart): wait for the Added popup`. The `PR checks` workflow enforces this format for PR titles.

## 4. Issue tracking

| Template | Use for |
|---|---|
| **New test scenario** | Requests coverage for a flow. Contains a Gherkin draft and acceptance checklist |
| **Bug / failing test** | A failing or flaky test, an app bug, or a framework bug. Attach the Allure screenshot |
| **Framework enhancement** | New capability (browser, data source, reporter, ...) |

Practices:
- Every PR links its issue with `Closes #12`. Merging then closes the issue and moves the card to *Done*.
- Use **milestones** for project phases (e.g. *Phase 2 – UI framework*).
- Label flaky tests `flaky` and mention the issue number in the PR that fixes them.
- Use **@mentions** in issues and reviews for hand-offs between the two members.

## 5. CI/CD workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PR to `main`/`develop` | Load every feature file and test → **smoke** tests (chromium, real Redis) → Allure report as an artifact |
| `ci.yml` | **push to `main`/`develop` (= a branch was merged)** | Same checks + **all tests**. On `main` it also **deploys the Allure report to GitHub Pages** |
| `ci.yml` | manual (*Run workflow*) | Choose the browser |
| `cross-browser.yml` | nightly 02:00 UTC, manual | Smoke tests on chromium/firefox/webkit on Linux, chromium on Windows, webkit on macOS, plus a Pixel 7 phone screen |
| `auto-merge.yml` | PR labelled `automerge` | Enables GitHub auto-merge (squash) once reviews and checks pass. Dependabot minor/patch PRs get the label automatically |
| `pr-checks.yml` | PR opened/edited | Enforces the PR title format, warns when no issue is linked, adds `size/*` labels |
| `dependabot.yml` | weekly | Pull requests that update the Python packages and GitHub Actions |

The badges at the top of `README.md` show the live status of these workflows.

## 6. Releases

When a phase is complete, merge `develop → main`, then tag it:

```bash
git tag -a v1.0.0 -m "Phase 2: UI automation framework"
git push origin v1.0.0
gh release create v1.0.0 --generate-notes
```
