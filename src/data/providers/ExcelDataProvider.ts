import * as fs from 'node:fs';
import ExcelJS from 'exceljs';
import { findByKey, normalize, type DataProvider, type DataRecord } from '../DataProvider';

/**
 * Reads test data from an .xlsx workbook. Each worksheet is a dataset; the first
 * row holds the column headers and must contain a `key` column.
 */
export class ExcelDataProvider implements DataProvider {
  readonly name = 'excel';
  private workbook?: ExcelJS.Workbook;
  private readonly cache = new Map<string, DataRecord[]>();

  constructor(private readonly filePath: string) {}

  async connect(): Promise<void> {
    if (this.workbook) return;
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`[excel] Workbook not found: ${this.filePath}. Run "npm run data:seed" to create it.`);
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.filePath);
    this.workbook = workbook;
  }

  async getAll(sheetName: string): Promise<DataRecord[]> {
    await this.connect();
    const cached = this.cache.get(sheetName);
    if (cached) return cached;

    const sheet = this.workbook!.getWorksheet(sheetName);
    if (!sheet) {
      const sheets = this.workbook!.worksheets.map((s) => s.name).join(', ');
      throw new Error(`[excel] Sheet "${sheetName}" not found. Available sheets: ${sheets}`);
    }

    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
      headers[col] = normalize(cell.value);
    });

    const records: DataRecord[] = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: DataRecord = {};
      headers.forEach((header, col) => {
        if (header) record[header] = normalize(row.getCell(col).value);
      });
      if (record.key) records.push(record);
    });

    this.cache.set(sheetName, records);
    return records;
  }

  async getByKey(sheetName: string, key: string): Promise<DataRecord> {
    return findByKey(await this.getAll(sheetName), key, this.name, sheetName);
  }

  async close(): Promise<void> {
    this.workbook = undefined;
    this.cache.clear();
  }
}
