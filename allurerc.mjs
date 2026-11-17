import { defineConfig } from 'allure';

/**
 * Allure Report 3 configuration (pure Node.js - no Java required).
 *   npm run report:generate   -> builds ./allure-report from ./allure-results
 *   npm run report:open       -> serves the generated report
 */
export default defineConfig({
  name: 'Web UI Test Automation Report',
  output: './allure-report',
  historyPath: './allure-history/history.jsonl',
  plugins: {
    awesome: {
      options: {
        reportName: 'Web UI Test Automation Report',
        singleFile: false,
        reportLanguage: 'en',
        groupBy: ['epic', 'feature', 'story'],
      },
    },
  },
});
