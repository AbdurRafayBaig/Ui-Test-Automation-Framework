/**
 * Builds every test-data store from the canonical JSON fixtures in test-data/json:
 *   - test-data/test-data.xlsx   (one worksheet per dataset)
 *   - test-data/test-data.db     (one SQLite table per dataset)
 *   - Redis (only with --redis, using REDIS_URL)
 *
 * Usage:
 *   npm run data:seed            # Excel + SQLite
 *   npm run data:seed:redis      # Redis server at REDIS_URL
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import ExcelJS from 'exceljs';
import Redis from 'ioredis';
import { config } from '../src/config/config';
import { seedRedis } from '../src/data/providers/redisSeed';

type Row = Record<string, string>;

function loadDatasets(): Map<string, Row[]> {
  const datasets = new Map<string, Row[]>();
  for (const file of fs.readdirSync(config.data.jsonDir).filter((f) => f.endsWith('.json'))) {
    const rows = JSON.parse(fs.readFileSync(path.join(config.data.jsonDir, file), 'utf-8')) as Row[];
    datasets.set(path.basename(file, '.json'), rows);
  }
  return datasets;
}

function columnsOf(rows: Row[]): string[] {
  const cols = new Set<string>(['key']);
  rows.forEach((r) => Object.keys(r).forEach((c) => cols.add(c)));
  return [...cols];
}

async function seedExcel(datasets: Map<string, Row[]>): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UI Test Automation Framework';
  workbook.created = new Date('2026-01-01T00:00:00Z');
  for (const [name, rows] of datasets) {
    const sheet = workbook.addWorksheet(name);
    const columns = columnsOf(rows);
    sheet.columns = columns.map((c) => ({ header: c, key: c, width: Math.max(14, c.length + 4) }));
    rows.forEach((r) => sheet.addRow(r));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }
  fs.mkdirSync(path.dirname(config.data.excelFile), { recursive: true });
  await workbook.xlsx.writeFile(config.data.excelFile);
  console.log(`✔ Excel   -> ${path.relative(config.rootDir, config.data.excelFile)} (${datasets.size} sheets)`);
}

function seedSqlite(datasets: Map<string, Row[]>): void {
  fs.rmSync(config.data.sqliteFile, { force: true });
  const db = new DatabaseSync(config.data.sqliteFile);
  for (const [name, rows] of datasets) {
    const columns = columnsOf(rows);
    const columnSql = columns.map((c) => (c === 'key' ? '"key" TEXT PRIMARY KEY' : `"${c}" TEXT`)).join(', ');
    db.exec(`CREATE TABLE "${name}" (${columnSql})`);
    const insert = db.prepare(
      `INSERT INTO "${name}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    );
    rows.forEach((r) => insert.run(...columns.map((c) => r[c] ?? '')));
  }
  db.close();
  console.log(`✔ SQLite  -> ${path.relative(config.rootDir, config.data.sqliteFile)} (${datasets.size} tables)`);
}

async function seedRedisServer(): Promise<void> {
  if (!config.data.redisUrl) {
    throw new Error('REDIS_URL is not set. Example: REDIS_URL=redis://localhost:6379 npm run data:seed:redis');
  }
  const client = new Redis(config.data.redisUrl);
  try {
    const count = await seedRedis(client, config.data.jsonDir);
    console.log(`✔ Redis   -> ${config.data.redisUrl} (${count} records)`);
  } finally {
    await client.quit();
  }
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (args.has('--redis')) {
    await seedRedisServer();
    return;
  }
  const datasets = loadDatasets();
  await seedExcel(datasets);
  seedSqlite(datasets);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
