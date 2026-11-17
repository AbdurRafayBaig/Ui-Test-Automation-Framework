import * as fs from 'node:fs';
import * as path from 'node:path';
import { After, AfterAll, AfterStep, Before, BeforeAll, Status, type ITestCaseHookParameter } from '@cucumber/cucumber';
import * as allure from 'allure-js-commons';
import { config } from '../config/config';
import { DataManager } from '../data/DataManager';
import { BrowserManager } from './BrowserManager';
import type { CustomWorld } from './World';

// Registers the Allure runtime so allure-js-commons calls (labels, steps, attachments) work.
import 'allure-cucumberjs';

const TRACE_DIR = path.join(config.rootDir, 'reports', 'traces');

function safeName(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 80);
}

function shouldKeep(mode: 'on' | 'off' | 'on-failure', failed: boolean): boolean {
  return mode === 'on' || (mode === 'on-failure' && failed);
}

BeforeAll(async function () {
  await BrowserManager.launch();
});

Before(async function (this: CustomWorld, { pickle }: ITestCaseHookParameter) {
  const scenarioId = `${safeName(pickle.name)}_${pickle.id.slice(0, 8)}`;
  const context = await BrowserManager.newContext(scenarioId);
  if (config.trace !== 'off') {
    await context.tracing.start({ screenshots: true, snapshots: true, title: pickle.name });
  }
  const page = await context.newPage();
  this.init(context, page, pickle.name);

  // Surface browser-side problems in the scenario log.
  page.on('console', (msg) => {
    if (msg.type() === 'error') this.logger.debug(`browser console error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => this.logger.debug(`page error: ${err.message}`));

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
  if (config.screenshot === 'on' || (failed && config.screenshot === 'on-failure')) {
    const shot = await this.page.screenshot({ fullPage: true }).catch(() => undefined);
    if (shot) {
      this.attach(shot, {
        mediaType: 'image/png',
        fileName: `${failed ? 'FAILED - ' : ''}${safeName(pickleStep.text)}.png`,
      });
    }
  }
});

After(async function (this: CustomWorld, { pickle, result }: ITestCaseHookParameter) {
  if (!this.context) return;
  const failed = result?.status === Status.FAILED;
  this.logger.info(`Scenario finished with status ${result?.status}`);

  if (config.trace !== 'off') {
    if (shouldKeep(config.trace, failed)) {
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

  const video = this.page?.video();
  await this.context.close();

  if (video) {
    const videoPath = await video.path().catch(() => undefined);
    if (videoPath && fs.existsSync(videoPath)) {
      if (shouldKeep(config.video, failed)) {
        this.attach(fs.readFileSync(videoPath), { mediaType: 'video/webm', fileName: 'recording.webm' });
      } else {
        fs.rmSync(videoPath, { force: true });
      }
    }
  }

  this.attach(this.logger.dump(), { mediaType: 'text/plain', fileName: 'scenario.log' });
});

AfterAll(async function () {
  await BrowserManager.close();
  await DataManager.closeAll();
});
