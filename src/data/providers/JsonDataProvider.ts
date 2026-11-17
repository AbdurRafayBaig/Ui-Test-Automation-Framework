import * as fs from 'node:fs';
import * as path from 'node:path';
import { findByKey, normalize, type DataProvider, type DataRecord } from '../DataProvider';

/** Reads `<dir>/<dataset>.json` files containing an array of objects with a `key` field. */
export class JsonDataProvider implements DataProvider {
  readonly name = 'json';
  private readonly cache = new Map<string, DataRecord[]>();

  constructor(private readonly dir: string) {}

  async connect(): Promise<void> {
    if (!fs.existsSync(this.dir)) throw new Error(`[json] Data directory not found: ${this.dir}`);
  }

  async getAll(dataset: string): Promise<DataRecord[]> {
    const cached = this.cache.get(dataset);
    if (cached) return cached;
    await this.connect();
    const file = path.join(this.dir, `${dataset}.json`);
    if (!fs.existsSync(file)) throw new Error(`[json] Dataset file not found: ${file}`);
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as Array<Record<string, unknown>>;
    const records = raw.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, normalize(v)])));
    this.cache.set(dataset, records);
    return records;
  }

  async getByKey(dataset: string, key: string): Promise<DataRecord> {
    return findByKey(await this.getAll(dataset), key, this.name, dataset);
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}
