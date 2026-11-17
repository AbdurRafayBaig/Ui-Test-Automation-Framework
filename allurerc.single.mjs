import { defineConfig } from 'allure';

/** Same report as allurerc.mjs, but as ONE self-contained HTML file (used for docs/example-report). */
export default defineConfig({
  name: 'Web UI Test Automation Report',
  output: './docs/example-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'Web UI Test Automation Report',
        singleFile: true,
        reportLanguage: 'en',
        groupBy: ['epic', 'feature', 'story'],
      },
    },
  },
});
