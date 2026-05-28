"""
Disregard a pending report.

Usage:
    python disregard_report.py TICKER YEAR {A|H} YYYY-MM-DD

Inserts (or updates) a row in disregarded_reports so the report is removed
from the calendar countdown.

Env vars:
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME  (injected by the app)
"""

import argparse
import os
import sys
from datetime import datetime

import mysql.connector

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
    "charset": "utf8mb4",
    "autocommit": True,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Disregard a pending report")
    parser.add_argument("ticker", help="Ticker symbol (e.g. RL)")
    parser.add_argument("year", type=int, help="Financial year (e.g. 2025)")
    parser.add_argument(
        "filing",
        choices=["A", "H", "a", "h"],
        help="Filing identifier: A (Annual) or H (Semi-annual)",
    )
    parser.add_argument("release_date", help="Release date YYYY-MM-DD")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ticker = args.ticker.strip().upper()
    year = args.year
    filing = args.filing.upper()

    try:
        release_date = datetime.strptime(args.release_date, "%Y-%m-%d").date()
    except ValueError:
        print(f"ERROR: invalid release_date {args.release_date!r} (expected YYYY-MM-DD)", file=sys.stderr)
        return 1

    if not (1900 <= year <= 2100):
        print(f"ERROR: implausible financial year {year}", file=sys.stderr)
        return 1

    filing_type = "Annual" if filing == "A" else "Semi-annual"
    print(f"Disregarding {ticker} FY{year} {filing_type} ({release_date})")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT name, is_active FROM dim_companies WHERE UPPER(ticker) = %s",
            (ticker,),
        )
        row = cursor.fetchone()
        if row:
            name, is_active = row
            print(f"  Company: {name} ({'active' if is_active else 'inactive'})")
        else:
            print(f"  WARNING: {ticker} not found in dim_companies (continuing)")

        cursor.execute(
            """
            SELECT review_date FROM disregarded_reports
            WHERE ticker = %s AND financial_year = %s AND filing_identifier = %s
            """,
            (ticker, year, filing),
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE disregarded_reports
                SET release_date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE ticker = %s AND financial_year = %s AND filing_identifier = %s
                """,
                (release_date, ticker, year, filing),
            )
            print(f"  Updated existing row (was reviewed {existing[0]})")
        else:
            cursor.execute(
                """
                INSERT INTO disregarded_reports
                    (ticker, financial_year, filing_identifier, release_date)
                VALUES (%s, %s, %s, %s)
                """,
                (ticker, year, filing, release_date),
            )
            print("  Inserted new row")

        print(f"Done. {ticker} FY{year} {filing_type} marked as disregarded.")
        return 0
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
