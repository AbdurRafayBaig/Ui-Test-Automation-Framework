import { config } from '../config/config';
import type { DataProvider, DataRecord } from './DataProvider';
import { ExcelDataProvider } from './providers/ExcelDataProvider';
import { JsonDataProvider } from './providers/JsonDataProvider';
import { RedisDataProvider } from './providers/RedisDataProvider';
import { SqliteDataProvider } from './providers/SqliteDataProvider';

/**
 * One place to get test data from any source.
 *
 *   DataManager.getRecord('excel', 'users', 'standard')
 *   DataManager.getRecords('redis', 'products')
 *
 * Each source is created the first time it is asked for and then reused,
 * so we open the Excel file / database / Redis connection only once per run.
 */
export class DataManager {
  /** Sources that are already open, e.g. { excel: ExcelDataProvider }. */
  private static providers: Record<string, DataProvider> = {};

  /** Returns the provider for a source name, creating it on first use. */
  static get(source: string): DataProvider {
    const name = source.toLowerCase();
    if (!this.providers[name]) {
      this.providers[name] = this.create(name);
    }
    return this.providers[name];
  }

  /** Creates a new provider. To add a new data source, add one more `case` here. */
  private static create(name: string): DataProvider {
    switch (name) {
      case 'excel':
        return new ExcelDataProvider(config.data.excelFile);
      case 'sqlite':
      case 'db':
        return new SqliteDataProvider(config.data.sqliteFile);
      case 'redis':
        return new RedisDataProvider(config.data.redisUrl, config.data.jsonDir);
      case 'json':
        return new JsonDataProvider(config.data.jsonDir);
      default:
        throw new Error(`Unknown data source "${name}". Use excel, sqlite, db, redis or json.`);
    }
  }

  /** One record, found by its `key` column. */
  static async getRecord(source: string, dataset: string, key: string): Promise<DataRecord> {
    return this.get(source).getByKey(dataset, key);
  }

  /** Every record in a dataset (sheet / table / JSON file). */
  static async getRecords(source: string, dataset: string): Promise<DataRecord[]> {
    return this.get(source).getAll(dataset);
  }

  /** Closes every open source. Called once after all tests have finished. */
  static async closeAll(): Promise<void> {
    for (const provider of Object.values(this.providers)) {
      try {
        await provider.close();
      } catch {
        // ignore errors while closing; the run is already over
      }
    }
    this.providers = {};
  }
}
