import * as fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { findByKey, normalize, type DataProvider, type DataRecord } from '../DataProvider';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Reads test data from a SQLite database using Node's built-in `node:sqlite`
 * driver (no native compilation needed). Each table is a dataset and must have
 * a `key` column.
 *
 * The same class shape works for any SQL engine (PostgreSQL, MySQL, MSSQL):
 * swap the driver in connect()/query() and keep the public contract.
 */
export class SqliteDataProvider implements DataProvider {
  readonly name = 'sqlite';
  private db?: DatabaseSync;

  constructor(private readonly filePath: string) {}

  async connect(): Promise<void> {
    if (this.db) return;
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`[sqlite] Database not found: ${this.filePath}. Run "npm run data:seed" to create it.`);
    }
    this.db = new DatabaseSync(this.filePath, { readOnly: true });
  }

  /** Runs an arbitrary read-only query. Exposed for advanced data needs in steps. */
  async query(sql: string, ...params: Array<string | number>): Promise<DataRecord[]> {
    await this.connect();
    const rows = this.db!.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, normalize(v)])));
  }

  async getAll(table: string): Promise<DataRecord[]> {
    this.assertIdentifier(table);
    return this.query(`SELECT * FROM ${table} ORDER BY rowid`);
  }

  async getByKey(table: string, key: string): Promise<DataRecord> {
    this.assertIdentifier(table);
    const rows = await this.query(`SELECT * FROM ${table} WHERE key = ?`, key);
    return rows[0] ?? findByKey(await this.getAll(table), key, this.name, table);
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = undefined;
  }

  /** Table names cannot be bound as parameters, so validate them to block SQL injection. */
  private assertIdentifier(name: string): void {
    if (!IDENTIFIER.test(name)) throw new Error(`[sqlite] Invalid table name "${name}"`);
  }
}
