import { config } from '../config/config';
import type { DataProvider, DataRecord } from './DataProvider';
import { ExcelDataProvider } from './providers/ExcelDataProvider';
import { JsonDataProvider } from './providers/JsonDataProvider';
import { RedisDataProvider } from './providers/RedisDataProvider';
import { SqliteDataProvider } from './providers/SqliteDataProvider';

type ProviderFactory = () => DataProvider;

/**
 * Registry + factory for test-data sources (Factory & Singleton patterns).
 * Providers are created lazily the first time a step asks for them and reused
 * for the rest of the run, so a suite that never touches Redis never connects to it.
 */
export class DataManager {
  private static readonly factories = new Map<string, ProviderFactory>([
    ['excel', () => new ExcelDataProvider(config.data.excelFile)],
    ['sqlite', () => new SqliteDataProvider(config.data.sqliteFile)],
    ['db', () => DataManager.get('sqlite')], // friendly alias
    ['redis', () => new RedisDataProvider(config.data.redisUrl, config.data.jsonDir)],
    ['json', () => new JsonDataProvider(config.data.jsonDir)],
  ]);
  private static readonly instances = new Map<string, DataProvider>();

  /** Plug in a custom source at runtime, e.g. DataManager.register('csv', () => new CsvProvider()). */
  static register(name: string, factory: ProviderFactory): void {
    this.factories.set(name.toLowerCase(), factory);
    this.instances.delete(name.toLowerCase());
  }

  static get(source: string): DataProvider {
    const name = source.toLowerCase();
    const existing = this.instances.get(name);
    if (existing) return existing;
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Unknown data source "${source}". Registered: ${[...this.factories.keys()].join(', ')}`);
    }
    const provider = factory();
    this.instances.set(name, provider);
    return provider;
  }

  static async getRecord(source: string, dataset: string, key: string): Promise<DataRecord> {
    return this.get(source).getByKey(dataset, key);
  }

  static async getRecords(source: string, dataset: string): Promise<DataRecord[]> {
    return this.get(source).getAll(dataset);
  }

  static async closeAll(): Promise<void> {
    const unique = new Set(this.instances.values());
    await Promise.all([...unique].map((p) => p.close().catch(() => undefined)));
    this.instances.clear();
  }
}
