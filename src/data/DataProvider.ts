/** A single row of test data. Values are always strings so every source behaves the same. */
export type DataRecord = Record<string, string>;

/**
 * Contract every test-data source implements. A "dataset" is the source-specific
 * grouping of records:
 *   - Excel  -> worksheet name
 *   - SQLite -> table name
 *   - Redis  -> key prefix (hash per record + a set acting as an index)
 *   - JSON   -> file name (without .json)
 * Every record must expose a unique `key` column used for look-ups.
 *
 * Adding a new source (CSV, REST API, MongoDB, ...) = implement this interface and
 * register it in DataManager. No step definition needs to change.
 */
export interface DataProvider {
  readonly name: string;
  /** Lazily open connections / read files. Safe to call multiple times. */
  connect(): Promise<void>;
  getAll(dataset: string): Promise<DataRecord[]>;
  getByKey(dataset: string, key: string): Promise<DataRecord>;
  close(): Promise<void>;
}

/** Shared helper so every provider reports a missing key the same way. */
export function findByKey(records: DataRecord[], key: string, source: string, dataset: string): DataRecord {
  const record = records.find((r) => r.key === key);
  if (!record) {
    const keys = records.map((r) => r.key).join(', ');
    throw new Error(`[${source}] No record with key "${key}" in dataset "${dataset}". Available keys: ${keys}`);
  }
  return record;
}

/** Converts any primitive cell/column value into a trimmed string ('' for null/undefined). */
export function normalize(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'text' in (value as object)) return String((value as { text: unknown }).text).trim();
  if (typeof value === 'object' && 'result' in (value as object)) return String((value as { result: unknown }).result).trim();
  return String(value).trim();
}
