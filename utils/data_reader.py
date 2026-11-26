"""Reads test data from four sources: Excel, SQLite (database), Redis and JSON.

Every source holds the same records. A record is a dict and always has a "key"
column, e.g. {"key": "valid_user", "email": "...", "password": "..."}.

    get_record("excel", "users", "valid_user")
    get_record("sqlite", "search_terms", "dress")
"""

import json
import os
import sqlite3
from pathlib import Path

import fakeredis
import redis
from openpyxl import load_workbook

DATA_DIR = Path(__file__).resolve().parent.parent / "test_data"
EXCEL_FILE = DATA_DIR / "test_data.xlsx"
DB_FILE = DATA_DIR / "test_data.db"
DATASETS = ["users", "search_terms"]


def read_json(dataset: str) -> list[dict]:
    """test_data/<dataset>.json"""
    return json.loads((DATA_DIR / f"{dataset}.json").read_text(encoding="utf-8"))


def read_excel(dataset: str) -> list[dict]:
    """Sheet <dataset> in test_data.xlsx. The first row holds the column names."""
    workbook = load_workbook(EXCEL_FILE, read_only=True)
    rows = list(workbook[dataset].iter_rows(values_only=True))
    workbook.close()
    header = rows[0]
    return [{column: str(value or "") for column, value in zip(header, row)} for row in rows[1:]]


def read_sqlite(dataset: str) -> list[dict]:
    """Table <dataset> in test_data.db."""
    if dataset not in DATASETS:  # table names come only from our own list
        raise ValueError(f"Unknown table: {dataset}")
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row  # rows behave like dicts
    rows = [dict(row) for row in connection.execute(f"SELECT * FROM {dataset}")]
    connection.close()
    return rows


def get_redis_client():
    """A real Redis server if REDIS_URL is set (CI does this), otherwise a fake
    in-memory Redis filled from the JSON files (no installation needed)."""
    url = os.getenv("REDIS_URL")
    if url:
        return redis.Redis.from_url(url, decode_responses=True)
    client = fakeredis.FakeRedis(decode_responses=True)
    fill_redis(client)
    return client


def fill_redis(client) -> None:
    """Stores every record as JSON text in a Redis hash: testdata:<dataset> -> {key: record}."""
    for dataset in DATASETS:
        for record in read_json(dataset):
            client.hset(f"testdata:{dataset}", record["key"], json.dumps(record))


def read_redis(dataset: str) -> list[dict]:
    """Hash testdata:<dataset> in Redis."""
    stored = get_redis_client().hgetall(f"testdata:{dataset}")
    return [json.loads(text) for text in stored.values()]


def get_records(source: str, dataset: str) -> list[dict]:
    """All records of a dataset from the chosen source."""
    if source == "excel":
        return read_excel(dataset)
    if source in ("sqlite", "db"):
        return read_sqlite(dataset)
    if source == "redis":
        return read_redis(dataset)
    if source == "json":
        return read_json(dataset)
    raise ValueError(f"Unknown data source '{source}'. Use excel, sqlite, redis or json.")


def get_record(source: str, dataset: str, key: str) -> dict:
    """One record, found by its "key" column."""
    for record in get_records(source, dataset):
        if record["key"] == key:
            return record
    raise KeyError(f"No record '{key}' in {dataset} ({source})")
