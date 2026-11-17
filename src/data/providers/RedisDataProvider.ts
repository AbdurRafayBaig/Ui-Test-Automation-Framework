import Redis from 'ioredis';
import { findByKey, type DataProvider, type DataRecord } from '../DataProvider';
import { seedRedis } from './redisSeed';

/**
 * Reads test data from Redis. Layout (written by `npm run data:seed:redis`):
 *   SET   testdata:<dataset>            -> members are record keys (the index)
 *   HASH  testdata:<dataset>:<key>      -> one record, field -> value
 *
 * If REDIS_URL is not set, an in-memory Redis (ioredis-mock) is started and seeded
 * from the JSON fixtures so the suite still runs on machines without a Redis server.
 * CI runs against a real Redis service container.
 */
export class RedisDataProvider implements DataProvider {
  readonly name = 'redis';
  private client?: Redis;
  private connecting?: Promise<void>;

  constructor(
    private readonly url: string | undefined,
    private readonly seedDir: string,
    private readonly prefix = 'testdata',
  ) {}

  get mode(): 'server' | 'in-memory' {
    return this.url ? 'server' : 'in-memory';
  }

  async connect(): Promise<void> {
    if (this.client) return;
    this.connecting ??= this.open();
    await this.connecting;
  }

  private async open(): Promise<void> {
    if (this.url) {
      const client = new Redis(this.url, { lazyConnect: true, maxRetriesPerRequest: 2, connectTimeout: 5000 });
      try {
        await client.connect();
      } catch (err) {
        client.disconnect();
        throw new Error(`[redis] Cannot connect to ${this.url}: ${(err as Error).message}`);
      }
      this.client = client;
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RedisMock = require('ioredis-mock') as typeof Redis;
    const mock = new RedisMock();
    await seedRedis(mock, this.seedDir, this.prefix);
    this.client = mock;
  }

  async getAll(dataset: string): Promise<DataRecord[]> {
    await this.connect();
    const keys = (await this.client!.smembers(`${this.prefix}:${dataset}`)).sort();
    if (keys.length === 0) {
      throw new Error(`[redis] Dataset "${dataset}" is empty or missing. Run "npm run data:seed:redis".`);
    }
    const pipeline = this.client!.pipeline();
    keys.forEach((key) => pipeline.hgetall(`${this.prefix}:${dataset}:${key}`));
    const results = (await pipeline.exec()) ?? [];
    return results.map(([err, value]) => {
      if (err) throw err;
      return value as DataRecord;
    });
  }

  async getByKey(dataset: string, key: string): Promise<DataRecord> {
    await this.connect();
    const record = await this.client!.hgetall(`${this.prefix}:${dataset}:${key}`);
    if (record && Object.keys(record).length > 0) return record;
    return findByKey(await this.getAll(dataset), key, this.name, dataset);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => this.client?.disconnect());
    }
    this.client = undefined;
    this.connecting = undefined;
  }
}
