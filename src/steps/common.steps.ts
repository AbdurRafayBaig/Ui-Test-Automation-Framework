import { Given } from '@cucumber/cucumber';
import * as allure from 'allure-js-commons';
import type { DataRecord } from '../data/DataProvider';
import { DataManager } from '../data/DataManager';
import type { CustomWorld } from '../core/World';

/** Key under which the most recently loaded data record is stored in the ScenarioContext. */
export const LOADED_RECORD = 'loadedRecord';

/**
 * Loads one record from any registered data source and stores it in the scenario
 * context. The record is also attached to the report so failures are easy to debug.
 */
export async function loadRecord(world: CustomWorld, source: string, dataset: string, key: string): Promise<DataRecord> {
  const record = await allure.step(`Load "${dataset}/${key}" from ${source}`, async () => {
    const data = await DataManager.getRecord(source, dataset, key);
    await allure.attachment(`${source}:${dataset}:${key}.json`, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
    });
    return data;
  });
  world.logger.info(`Loaded ${dataset}/${key} from ${source}: ${JSON.stringify({ ...record, password: '***' })}`);
  await allure.parameter('data source', source);
  world.scenario.set(LOADED_RECORD, record);
  world.scenario.set(`${dataset}:${key}`, record);
  return record;
}

Given(
  'I load the {string} record {string} from the {string} data source',
  async function (this: CustomWorld, dataset: string, key: string, source: string) {
    await loadRecord(this, source, dataset, key);
  },
);
