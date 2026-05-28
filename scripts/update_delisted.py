"""
Mark a company as delisted and recalculate return metrics.

Usage:
    python update_delisted.py TICKER YYYY-MM-DD PRICE

Sets dim_companies.is_active = 0 + delisting_date + delisting_price, then
calls stored procedure update_delisted_return_metrics for the most recent
Annual and Semi-annual reports that lack return_1y metrics.

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
    "autocommit": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mark a company as delisted")
    parser.add_argument("ticker", help="Ticker symbol")
    parser.add_argument("delisting_date", help="Delisting date YYYY-MM-DD")
    parser.add_argument("delisting_price", type=float, help="Final delisting price")
    return parser.parse_args()


def find_reports_without_return_1y(cursor, company_id: int) -> list[tuple[int, str, int]]:
    cursor.execute(
        """
        SELECT DISTINCT fr.report_id, fr.report_type, fr.financial_year
        FROM fact_reports fr
        LEFT JOIN (
            SELECT DISTINCT fm.report_id
            FROM fact_metrics fm
            JOIN dim_metrics dm ON fm.metric_id = dm.metric_id
            WHERE dm.name = 'return_1y'
        ) rm ON fr.report_id = rm.report_id
        WHERE fr.company_id = %s
          AND rm.report_id IS NULL
        ORDER BY fr.report_type, fr.financial_year DESC
        """,
        (company_id,),
    )
    return cursor.fetchall()


def main() -> int:
    args = parse_args()
    ticker = args.ticker.strip().upper()
    price = args.delisting_price

    try:
        delisting_date = datetime.strptime(args.delisting_date, "%Y-%m-%d").date()
    except ValueError:
        print(f"ERROR: invalid delisting_date {args.delisting_date!r}", file=sys.stderr)
        return 1

    if price <= 0:
        print(f"ERROR: delisting_price must be positive, got {price}", file=sys.stderr)
        return 1

    print(f"Marking {ticker} delisted on {delisting_date} at {price}")

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT company_id, name, is_active FROM dim_companies WHERE UPPER(ticker) = %s",
            (ticker,),
        )
        row = cursor.fetchone()
        if not row:
            print(f"ERROR: {ticker} not found in dim_companies", file=sys.stderr)
            return 1
        company_id, name, is_active = row
        print(f"  Company: {name} (company_id={company_id}, currently {'active' if is_active else 'inactive'})")

        cursor.execute(
            """
            UPDATE dim_companies
            SET is_active = 0,
                delisting_date = %s,
                delisting_price = %s
            WHERE company_id = %s
            """,
            (delisting_date, price, company_id),
        )
        print("  Updated dim_companies (is_active = 0)")

        cursor.execute(
            "DELETE FROM app_date_overrides WHERE ticker = %s",
            (ticker,),
        )
        if cursor.rowcount:
            print(f"  Removed date override for {ticker}")

        reports = find_reports_without_return_1y(cursor, company_id)
        annuals = [r for r in reports if r[1].lower() in ("annual", "a")]
        semis = [r for r in reports if r[1].lower() in ("semi-annual", "semi", "h")]
        reports_to_update = []
        if annuals:
            reports_to_update.append(annuals[0])
        if semis:
            reports_to_update.append(semis[0])

        if reports_to_update:
            report_ids = ",".join(str(r[0]) for r in reports_to_update)
            print(f"  Calling update_delisted_return_metrics for report_ids={report_ids}")
            cursor.callproc("update_delisted_return_metrics", [company_id, report_ids, price])
            for result in cursor.stored_results():
                rows = result.fetchall()
                for r in rows:
                    print(f"    proc output: {r}")
            print(f"  Return metrics recalculated for {len(reports_to_update)} report(s)")
        else:
            print("  No reports needed return-metric updates")

        conn.commit()
        print(f"Done. {ticker} marked delisted.")
        return 0
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: rolled back due to: {exc}", file=sys.stderr)
        return 1
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
