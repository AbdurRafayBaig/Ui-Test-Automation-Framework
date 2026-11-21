import * as fs from 'node:fs';
import * as path from 'node:path';
import { After, AfterAll, AfterStep, Before, BeforeAll, Status, type ITestCaseHookParameter } from '@cucumber/cucumber';
import * as allure from 'allure-js-commons';
import { config } from '../config/config';
import { DataManager } from '../data/DataManager';
import { BrowserManager } from './BrowserManager';
import type { CustomWorld } from './World';

// Turns on Allure so labels, steps and attachments end up in the report.
import 'allure-cucumberjs';

/**
 * Hooks run automatically around the tests:
 *   BeforeAll  -> once at the start: open the browser
 *   Before     -> before every scenario: new clean browser tab
 *   AfterStep  -> after every step: screenshot if the step failed
 *   After      -> after every scenario: save trace, video and log to the report
 *   AfterAll   -> once at the end: close the browser and the data sources
 */

const TRACE_DIR = path.join(config.rootDir, 'reports', 'traces');

/** Turns any text into a safe file name, e.g. "Add to cart!" -> "Add_to_cart". */
function safeName(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 80);
}

BeforeAll(async function () {
  await BrowserManager.launch();
});

Before(async function (this: CustomWorld, { pickle }: ITestCaseHookParameter) {
  // 1. A new browser context = a fresh "incognito window" (no cookies from other tests)
  const scenarioId = `${safeName(pickle.name)}_${pickle.id.slice(0, 8)}`;
  const context = await BrowserManager.newContext(scenarioId);

  // 2. Start recording a Playwright trace (a step-by-step replay of the test)
  if (config.trace !== 'off') {
    await context.tracing.start({ screenshots: true, snapshots: true, title: pickle.name });
  }

  // 3. Open a tab and give it to the World so steps can use `this.page`
  const page = await context.newPage();
  this.init(context, page, pickle.name);

  // 4. Write JavaScript errors from the website into the scenario log
  page.on('console', (msg) => {
    if (msg.type() === 'error') this.logger.debug(`browser console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => this.logger.debug(`page error: ${err.message}`));

  // 5. Show browser and environment in the Allure report
  await allure.parameter('browser', config.browser);
  await allure.parameter('environment', config.env);
  if (config.device) await allure.parameter('device', config.device);
  this.logger.info(`Starting on ${config.browser} ${BrowserManager.browserVersion} | env=${config.env}`);
});

AfterStep(async function (this: CustomWorld, { pickleStep, result }) {
  if (!this.page || this.page.isClosed()) return;
  const failed = result.status === Status.FAILED;

  if (failed) {
    this.logger.error(`Step failed: "${pickleStep.text}" -> ${result.message?.split('\n')[0] ?? ''}`);
  }

  // Screenshot: always (SCREENSHOT=on) or only when the step failed (SCREENSHOT=on-failure)
  const takeScreenshot = config.screenshot === 'on' || (config.screenshot === 'on-failure' && failed);
  if (takeScreenshot) {
    const image = await this.page.screenshot({ fullPage: true }).catch(() => undefined);
    if (image) {
      const fileName = `${failed ? 'FAILED - ' : ''}${safeName(pickleStep.text)}.png`;
      this.attach(image, { mediaType: 'image/png', fileName });
    }
  }
});

After(async function (this: CustomWorld, { pickle, result }: ITestCaseHookParameter) {
  if (!this.context) return;
  const failed = result?.status === Status.FAILED;
  this.logger.info(`Scenario finished with status ${result?.status}`);

  // 1. Trace: save it into the report (TRACE=on, or TRACE=on-failure and the test failed)
  if (config.trace !== 'off') {
    const keepTrace = config.trace === 'on' || failed;
    if (keepTrace) {
      fs.mkdirSync(TRACE_DIR, { recursive: true });
      const tracePath = path.join(TRACE_DIR, `${safeName(pickle.name)}_${pickle.id.slice(0, 8)}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      this.attach(fs.readFileSync(tracePath), {
        mediaType: 'application/vnd.allure.playwright-trace',
        fileName: 'playwright-trace.zip',
      });
    } else {
      await this.context.tracing.stop();
    }
  }

  // 2. Video: Playwright finishes writing the video file when the context closes
  const video = this.page?.video();
  await this.context.close();

  if (video) {
    const videoPath = await video.path().catch(() => undefined);
    if (videoPath && fs.existsSync(videoPath)) {
      const keepVideo = config.video === 'on' || (config.video === 'on-failure' && failed);
      if (keepVideo) {
        this.attach(fs.readFileSync(videoPath), { mediaType: 'video/webm', fileName: 'recording.webm' });
      } else {
        fs.rmSync(videoPath, { force: true }); // passed test: delete the video to save space
      }
    }
  }

  // 3. The scenario's own log file
  this.attach(this.logger.dump(), { mediaType: 'text/plain', fileName: 'scenario.log' });
});

AfterAll(async function () {
  await BrowserManager.close();
  await DataManager.closeAll();
});
