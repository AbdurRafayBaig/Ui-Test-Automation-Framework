import { setDefaultTimeout, setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber';
import type { BrowserContext, Page } from 'playwright';
import { config } from '../config/config';
import { PageManager } from '../pages/PageManager';
import { Logger } from './Logger';
import { ScenarioContext } from './ScenarioContext';

/**
 * Cucumber World: one instance per scenario. Holds the Playwright page/context,
 * the page objects, a scenario-scoped data store and a logger.
 */
export class CustomWorld extends World {
  context!: BrowserContext;
  page!: Page;
  pages!: PageManager;
  logger: Logger = new Logger('setup');
  readonly scenario = new ScenarioContext();

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Called from the Before hook once the page exists. */
  init(context: BrowserContext, page: Page, scenarioName: string): void {
    this.context = context;
    this.page = page;
    this.logger = new Logger(scenarioName);
    this.pages = new PageManager(page, this.logger);
  }
}

setWorldConstructor(CustomWorld);
setDefaultTimeout(config.timeouts.step);
