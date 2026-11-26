"""Builds the Excel file and the SQLite database from the JSON files.

    python test_data/create_test_data.py           -> test_data.xlsx + test_data.db
    python test_data/create_test_data.py --redis   -> also fills the Redis server in REDIS_URL
"""

import sqlite3
import sys
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # so "utils" can be imported
from utils.data_reader import DATASETS, DB_FILE, EXCEL_FILE, fill_redis, get_redis_client, read_json  # noqa: E402


def create_excel():
    workbook = Workbook()
    workbook.remove(workbook.active)
    for dataset in DATASETS:
        records = read_json(dataset)
        sheet = workbook.create_sheet(dataset)
        columns = list(records[0].keys())
        sheet.append(columns)
        for record in records:
            sheet.append([record[column] for column in columns])
    workbook.save(EXCEL_FILE)
    print(f"Excel  -> {EXCEL_FILE.name}")


def create_sqlite():
    DB_FILE.unlink(missing_ok=True)
    connection = sqlite3.connect(DB_FILE)
    for dataset in DATASETS:
        records = read_json(dataset)
        columns = list(records[0].keys())
        connection.execute(f"CREATE TABLE {dataset} ({', '.join(c + ' TEXT' for c in columns)})")
        placeholders = ", ".join("?" for _ in columns)
        for record in records:
            connection.execute(f"INSERT INTO {dataset} VALUES ({placeholders})", [record[c] for c in columns])
    connection.commit()
    connection.close()
    print(f"SQLite -> {DB_FILE.name}")


if __name__ == "__main__":
    create_excel()
    create_sqlite()
    if "--redis" in sys.argv:
        fill_redis(get_redis_client())
        print("Redis  -> filled")
