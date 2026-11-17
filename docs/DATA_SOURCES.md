# Test-data sources

The framework reads test data from **Excel, SQLite (SQL database), Redis and JSON** through one interface. Steps choose a source **by name**, so the same scenario can run against any of them.

```
                     ┌────────────────────────────┐
  steps  ──────────► │ DataManager.get("excel")   │──► ExcelDataProvider  ─► test-data/test-data.xlsx
  (by name)          │   .getByKey(dataset, key)  │──► SqliteDataProvider ─► test-data/test-data.db
                     │   .getAll(dataset)         │──► RedisDataProvider  ─► REDIS_URL or in-memory
                     └────────────────────────────┘──► JsonDataProvider   ─► test-data/json/*.json
```

## The contract

```ts
export type DataRecord = Record<string, string>;

export interface DataProvider {
  readonly name: string;
  connect(): Promise<void>;                                  // lazy, idempotent
  getAll(dataset: string): Promise<DataRecord[]>;
  getByKey(dataset: string, key: string): Promise<DataRecord>;
  close(): Promise<void>;
}
```

- A **dataset** is a worksheet (Excel), a table (SQLite), a key prefix (Redis) or a file name (JSON).
- Every record has a unique **`key`** column.
- All values are normalised to strings, so every source behaves the same. Steps convert values with `Number(...)` where needed.
- Errors are descriptive, e.g. `[excel] No record with key "admin" in dataset "users". Available keys: standard, problem, ...`.

## Datasets shipped

| Dataset | Columns | Used by |
|---|---|---|
| `users` | key, username, password, expected (`success`/`error`), error_message | data-driven login |
| `customers` | key, first_name, last_name, postal_code, error_message | data-driven checkout |
| `products` | key, name, price | checkout, catalogue price check |
| `search_terms` | key, term, min_results | data-driven Toolshop search |

## Single source of truth

`test-data/json/*.json` is the canonical data. Binary stores are generated from it:

```bash
npm run data:seed          # → test-data/test-data.xlsx (one sheet per dataset)
                           # → test-data/test-data.db   (one table per dataset)
npm run data:seed:redis    # → Redis at REDIS_URL
```

This keeps data changes reviewable in pull requests (JSON diffs) and every source consistent. You can still edit the Excel workbook by hand, for example when a business analyst maintains it. The provider reads whatever is in the file.

## Provider details

### Excel: `ExcelDataProvider`
- Library: `exceljs`. Row 1 holds the headers, and each later row is a record. Empty rows are skipped.
- Each sheet is read once per run and then cached.
- Formula cells return their computed result. Rich-text and hyperlink cells return their text.

### SQL database: `SqliteDataProvider`
- Driver: Node's built-in `node:sqlite` (read-only connection).
- `getByKey` uses a parameterised query (`WHERE key = ?`). Table names are validated against `^[A-Za-z_][A-Za-z0-9_]*$` to prevent SQL injection.
- `query(sql, ...params)` is available for advanced needs, e.g. `SELECT * FROM users WHERE expected = ?`.
- **Switching to PostgreSQL/MySQL:** keep the class and replace `connect()` / `query()` with the `pg` or `mysql2` driver. Nothing else changes.

### Redis: `RedisDataProvider`
- Layout: `SET testdata:<dataset>` is the index of keys, and `HASH testdata:<dataset>:<key>` holds one record.
- With `REDIS_URL` set, it connects to that server (CI uses a `redis:7-alpine` service container).
- With no `REDIS_URL`, it starts an **in-memory Redis (`ioredis-mock`)** and seeds it from the JSON fixtures, so the suite runs on any laptop.

### JSON: `JsonDataProvider`
- Reads `test-data/json/<dataset>.json` (an array of objects).

## Using data in steps

Generic step, available in every feature:

```gherkin
Given I load the "customers" record "valid_us" from the "sqlite" data source
```

The record is stored in `this.scenario` under `loadedRecord` and attached to the Allure report as JSON.

Directly in code:

```ts
const user = await DataManager.getRecord('excel', 'users', 'standard');
const products = await DataManager.getRecords('redis', 'products');
```

## Adding a new data source (example: CSV)

```ts
// src/data/providers/CsvDataProvider.ts
export class CsvDataProvider implements DataProvider {
  readonly name = 'csv';
  constructor(private readonly dir: string) {}
  async connect() {}
  async getAll(dataset: string) {
    const [header, ...lines] = fs.readFileSync(path.join(this.dir, `${dataset}.csv`), 'utf8').trim().split(/\r?\n/);
    const cols = header.split(',');
    return lines.map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v.trim()])));
  }
  async getByKey(dataset: string, key: string) {
    return findByKey(await this.getAll(dataset), key, this.name, dataset);
  }
  async close() {}
}

// src/data/DataManager.ts: add one line to the factories map
['csv', () => new CsvDataProvider('test-data/csv')],
```

Now `| csv | standard |` works in any Examples table, with no step changes.
