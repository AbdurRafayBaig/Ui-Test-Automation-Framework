/**
 * Cucumber profiles. Select one with `cucumber-js -p <profile>` (see package.json scripts).
 * Tag filters can always be overridden from the CLI: `npm test -- --tags "@cart and not @wip"`.
 */
require('dotenv').config({ quiet: true });

const parallel = Number(process.env.PARALLEL || 1);
const retry = Number(process.env.RETRY || 0);
const repo = process.env.GITHUB_REPOSITORY || 'your-org/ui-test-automation-framework';

const common = {
  paths: ['features/**/*.feature'],
  requireModule: ['tsx/cjs'],
  require: ['src/core/World.ts', 'src/core/hooks.ts', 'src/steps/**/*.ts'],
  format: [
    'progress-bar',
    'summary',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json',
    'junit:reports/junit.xml',
    'rerun:reports/rerun.txt',
    'allure-cucumberjs/reporter',
  ],
  formatOptions: {
    snippetInterface: 'async-await',
    resultsDir: 'allure-results',
    // Turn tags such as @epic:E-Commerce or @severity:critical into Allure labels.
    labels: [
      { pattern: [/@epic:(.*)/], name: 'epic' },
      { pattern: [/@feature:(.*)/], name: 'feature' },
      { pattern: [/@story:(.*)/], name: 'story' },
      { pattern: [/@severity:(.*)/], name: 'severity' },
      { pattern: [/@owner:(.*)/], name: 'owner' },
    ],
    links: {
      issue: { pattern: [/@issue:(.*)/], urlTemplate: `https://github.com/${repo}/issues/%s`, nameTemplate: 'Issue #%s' },
    },
    environmentInfo: {
      framework: 'Playwright + Cucumber (TypeScript)',
      browser: process.env.BROWSER || 'chromium',
      headless: process.env.HEADLESS || 'true',
      environment: process.env.TEST_ENV || 'qa',
      device: process.env.DEVICE || 'desktop',
      node: process.version,
      os: `${process.platform} ${process.arch}`,
    },
  },
  parallel,
  retry,
  retryTagFilter: retry > 0 ? '@regression or @smoke or @data-driven' : undefined,
  tags: 'not @wip and not @ignore',
};

module.exports = {
  default: common,
  smoke: { ...common, tags: '@smoke and not @wip' },
  regression: { ...common, tags: '(@regression or @smoke) and not @wip' },
  'data-driven': { ...common, tags: '@data-driven and not @wip' },
  /** Re-run only the scenarios that failed in the previous run. */
  rerun: { ...common, paths: ['@reports/rerun.txt'] },
  /** Fast feedback while writing new scenarios: tag them @wip and run `npm run test:wip`. */
  wip: { ...common, tags: '@wip', format: ['progress', 'allure-cucumberjs/reporter'] },
};
