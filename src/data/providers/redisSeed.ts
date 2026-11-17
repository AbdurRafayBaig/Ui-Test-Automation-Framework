import * as fs from 'node:fs';
import * as path from 'node:path';
import type Redis from 'ioredis';

/**
 * Loads every `<dataset>.json` file in `dir` into Redis using the layout the
 * RedisDataProvider expects. Shared by the provider (in-memory mode) and the
 * `npm run data:seed:redis` script (real server).
 */
export async function seedRedis(client: Redis, dir: string, prefix = 'testdata'): Promise<number> {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  let count = 0;
  for (const file of files) {
    const dataset = path.basename(file, '.json');
    const rows = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as Array<Record<string, unknown>>;
    const indexKey = `${prefix}:${dataset}`;
    await client.del(indexKey);
    for (const row of rows) {
      const key = String(row.key);
      const hash = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v == null ? '' : String(v)]));
      const recordKey = `${indexKey}:${key}`;
      await client.del(recordKey);
      await client.hset(recordKey, hash);
      await client.sadd(indexKey, key);
      count++;
    }
  }
  return count;
}
