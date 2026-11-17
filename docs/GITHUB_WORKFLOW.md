# Managing the code on GitHub

## 1. Repository setup (one-time)

1. Create a **private** repository and invite the group member (Settings → Collaborators).
2. Push this project:
   ```bash
   git remote add origin https://github.com/<owner>/<repo>.git
   git push -u origin main
   git push -u origin develop
   ```
3. Replace the `OWNER/REPO` and `@MEMBER_x_GITHUB` placeholders in `README.md`, `.github/CODEOWNERS` and `.github/ISSUE_TEMPLATE/config.yml`.
4. **Settings → Pages → Source: GitHub Actions**. This lets the CI publish the Allure report.
5. **Settings → General → Pull Requests**: enable *Allow auto-merge* and *Automatically delete head branches*.
6. **Settings → Branches → Add rule** for `main` (and `develop`):
   - Require a pull request before merging, with 1 approval and *Require review from Code Owners*
   - Require status checks to pass: `Type-check & Gherkin lint`, `UI tests (chromium)`, `title-and-issue`
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
| feature | New tests / page objects | `feature/<issue#>-short-name`, e.g. `feature/12-checkout-tests` |
| fix | Fix a failing/flaky test or a framework bug | `fix/<issue#>-short-name` |
| docs / ci / chore | Documentation, pipelines, dependencies | `docs/...`, `ci/...`, `chore/...` |

## 3. Day-to-day flow

```bash
# 1. pick an issue on the board, assign it to yourself, move it to "In progress"
git switch develop && git pull
git switch -c feature/12-checkout-tests

# 2. work in small commits (Conventional Commits)
git commit -m "test(checkout): add postal-code validation outline"

# 3. run checks locally
npm run typecheck && npm run lint:features && npx cucumber-js --tags "@checkout"

# 4. push and open a PR into develop
git push -u origin feature/12-checkout-tests
gh pr create --base develop --fill        # or use the web UI. The PR template appears
```

5. CI runs: type-check, Gherkin lint, then the **smoke suite** with an Allure report artifact.
6. The teammate reviews: the code (selectors only in pages, no sleeps, tags present) and the Allure report artifact.
7. Address the comments, get approval, then **Squash & merge**, or add the `automerge` label so it merges itself when the checks pass.
8. Periodically open a PR `develop → main`. Merging it runs the **full regression** and **deploys the report to GitHub Pages**.

### Commit / PR title convention (Conventional Commits)

```
<type>(<scope>): <summary>

type  = feat | fix | test | docs | refactor | chore | ci | perf
scope = login | cart | checkout | search | data | core | ci | ...
```

Examples: `feat(data): add Redis data provider`, `test(search): add no-results scenario`, `fix(toolshop): wait for search API instead of sleep`. The `PR checks` workflow enforces this format for PR titles.

## 4. Issue tracking

| Template | Use for |
|---|---|
| **New test scenario** | Requests coverage for a flow. Contains a Gherkin draft and acceptance checklist |
| **Bug / failing test** | A failing or flaky test, an app bug, or a framework bug. Attach the Allure screenshot/trace |
| **Framework enhancement** | New capability (browser, data source, reporter, ...) |

Practices:
- Every PR links its issue with `Closes #12`. Merging then closes the issue and moves the card to *Done*.
- Use **milestones** for project phases (e.g. *Phase 2 – UI framework*).
- Label flaky tests `flaky` and tag the scenario `@issue:<n>` so the report links to the investigation.
- Use **@mentions** in issues and reviews for hand-offs between the two members.

## 5. CI/CD workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PR to `main`/`develop` | Type-check → Gherkin dry-run → **smoke** tests (chromium, real Redis) → Allure + JUnit summary → artifacts |
| `ci.yml` | **push to `main`/`develop` (= a branch was merged)** | Same checks + **full regression**. On `main` it also **deploys the Allure report to GitHub Pages** |
| `ci.yml` | manual (*Run workflow*) | Choose browser and tag expression |
| `cross-browser.yml` | nightly 02:00 UTC, manual, on release | Matrix: chromium/firefox/webkit on Linux, chromium on Windows, webkit on macOS, plus Pixel 7 emulation |
| `auto-merge.yml` | PR labelled `automerge` | Enables GitHub auto-merge (squash) once reviews and checks pass. Dependabot minor/patch PRs get the label automatically |
| `pr-checks.yml` | PR opened/edited | Enforces the PR title format, warns when no issue is linked, adds `size/*` labels |
| `dependabot.yml` | weekly | Dependency update PRs (Playwright/Cucumber/Allure grouped together) |

The badges at the top of `README.md` show the live status of these workflows.

## 6. Releases

When a phase is complete, merge `develop → main`, then tag it:

```bash
git tag -a v1.0.0 -m "Phase 2: UI automation framework"
git push origin v1.0.0
gh release create v1.0.0 --generate-notes
```

Publishing the release also triggers the cross-browser regression.
