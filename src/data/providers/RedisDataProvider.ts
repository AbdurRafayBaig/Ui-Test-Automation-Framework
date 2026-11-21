import Redis from 'ioredis';
import { findByKey, type DataProvider, type DataRecord } from '../DataProvider';
import { seedRedis } from './redisSeed';

/**
 * Reads test data from Redis.
 *
 * How the data is stored (written by `npm run data:seed:redis`):
 *   testdata:users            -> a SET with every record key, e.g. "standard", "locked_out"
 *   testdata:users:standard   -> a HASH with one record, e.g. { username: ..., password: ... }
 *
 * If REDIS_URL is set we connect to that real Redis server (CI does this).
 * If not, we start a fake in-memory Redis and fill it from the JSON files,
 * so the tests also run on a laptop without installing Redis.
 */
export class RedisDataProvider implements DataProvider {
  readonly name = 'redis';
  private client?: Redis;

  constructor(
    private readonly url: string | undefined,
    private readonly jsonDir: string,
  ) {}

  async connect(): Promise<void> {
    if (this.client) return; // already connected

    if (this.url) {
      // A real Redis server
      this.client = new Redis(this.url, { maxRetriesPerRequest: 2 });
    } else {
      // No server: fake in-memory Redis, filled from test-data/json
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const RedisMock = require('ioredis-mock') as typeof Redis;
      this.client = new RedisMock();
      await seedRedis(this.client, this.jsonDir);
    }
  }

  async getAll(dataset: string): Promise<DataRecord[]> {
    await this.connect();
    const keys = await this.client!.smembers(`testdata:${dataset}`);
    if (keys.length === 0) {
      throw new Error(`[redis] Dataset "${dataset}" is empty. Run "npm run data:seed:redis".`);
    }

    const records: DataRecord[] = [];
    for (const key of keys.sort()) {
      records.push(await this.client!.hgetall(`testdata:${dataset}:${key}`));
    }
    return records;
  }

  async getByKey(dataset: string, key: string): Promise<DataRecord> {
    return findByKey(await this.getAll(dataset), key, this.name, dataset);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = undefined;
    }
  }
}
