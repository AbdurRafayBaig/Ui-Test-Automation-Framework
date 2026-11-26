# Contributing

1. Pick or open an issue, using the templates in `.github/ISSUE_TEMPLATE`.
2. Branch from `develop`: `feature/<issue#>-short-name`.
3. Follow [docs/WRITING_TESTS.md](docs/WRITING_TESTS.md): feature, then steps, then page object.
4. Before pushing:
   ```bash
   pytest --collect-only -q     # every feature file and test loads
   pytest -m <your tag>         # your tests pass
   ```
5. Open a PR into `develop` with a Conventional-Commit title (`test(cart): ...`) and `Closes #<issue>` in the body.
6. Get one approval and green checks, then squash & merge (or add the `automerge` label).

The full process is in [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md).
