## What does this PR do?

<!-- One or two sentences. Title format: type(scope): summary  e.g. "test(checkout): add postal-code validation outline" -->

Closes #

## Type of change

- [ ] New test scenario(s) / feature file
- [ ] New or updated page object
- [ ] Framework / core change (hooks, config, data providers, reporting)
- [ ] CI / GitHub workflow
- [ ] Documentation

## How was it tested?

```bash
# commands you ran, e.g.
npm run typecheck
npx cucumber-js --tags "@checkout"
```

- [ ] `npm run typecheck` passes
- [ ] `npm run lint:features` passes (no undefined steps)
- [ ] New/changed scenarios pass locally on at least one browser
- [ ] Allure report checked (steps, screenshots and logs look right)

## Checklist

- [ ] Selectors live in page objects only, never in step definitions
- [ ] Assertions live in step definitions only, never in page objects
- [ ] No hard-coded waits (`waitForTimeout`) were added
- [ ] Scenarios are tagged (`@smoke` / `@regression`, `@feature:...`, `@severity:...`)
- [ ] Docs updated if behaviour or usage changed
