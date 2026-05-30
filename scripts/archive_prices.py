"""archive_prices.py — the single writer of historical OHLCV into new_stocks_db.

Coverage-driven: reads vw_archive_coverage_target (which coalesces play-universe +
manual-watch + ISA claims into one contiguous window per ticker) and fetches from
yfinance, upserting into fact_historical_prices. Every fetch is logged to
dim_price_runs.

Launched by the app via scripts:launchBuiltin('archive_prices', [...args]) — DB
credentials arrive as env vars (DB_HOST etc.). Speaks line-delimited JSON on stdout
so the renderer's Build panel can show live progress; one JSON object per line:

  {"type":"progress","current":N,"total":M,"ticker":"X"}
  {"type":"ticker_done","ticker":"X","status":"ok|no_data|failed","bars":N}
  {"type":"log","message":"..."}        {"type":"stderr","message":"..."}
  {"type":"final","payload":{"summary":{...}}}

Design rules (see docs/decisions/price-archive-implementation.md §6):
  * Resumable — only the missing head/tail of each ticker's window is fetched.
  * Manual wins — rows whose existing source is manual_* are never overwritten by
    a yfinance fetch unless --force.
  * A batch never aborts on one ticker; failures are logged and the run continues.
"""

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta

import mysql.connector
import yfinance as yf

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
}

MANUAL_SOURCES = ("manual_investingcom", "manual_csv")

UPSERT_SQL = """
INSERT INTO fact_historical_prices
    (ticker, trade_date, open_price, high_price, low_price, close_price,
     adj_close_price, volume, source, source_run_id)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'yfinance', %s)
ON DUPLICATE KEY UPDATE
    open_price      = VALUES(open_price),
    high_price      = VALUES(high_price),
    low_price       = VALUES(low_price),
    close_price     = VALUES(close_price),
    adj_close_price = VALUES(adj_close_price),
    volume          = VALUES(volume),
    source          = VALUES(source),
    source_run_id   = VALUES(source_run_id)
"""


def emit(obj: dict) -> None:
    """Write one line-delimited JSON event to stdout and flush immediately."""
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def log(message: str) -> None:
    emit({"type": "log", "message": message})


def to_date(value) -> "date | None":
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()


# ── Work list resolution ────────────────────────────────────────────────────


def resolve_work_list(cursor, args) -> "list[dict]":
    """Return [{ticker, target_from, target_to}] from the coverage target view."""
    today = date.today()
    if args.ticker:
        if args.from_date and args.to_date:
            return [{
                "ticker": args.ticker,
                "target_from": to_date(args.from_date),
                "target_to": to_date(args.to_date),
            }]
        cursor.execute(
            "SELECT ticker, target_from, COALESCE(target_to, CURDATE()) AS target_to "
            "FROM vw_archive_coverage_target WHERE ticker = %s",
            (args.ticker,),
        )
    else:
        cursor.execute(
            "SELECT ticker, target_from, COALESCE(target_to, CURDATE()) AS target_to "
            "FROM vw_archive_coverage_target ORDER BY ticker"
        )
    rows = cursor.fetchall()
    work = []
    for r in rows:
        tf = to_date(r["target_from"])
        tt = to_date(r["target_to"]) or today
        if tf is None:
            tf = tt - timedelta(days=730)
        work.append({"ticker": r["ticker"], "target_from": tf, "target_to": tt})
    return work


def existing_coverage(cursor, ticker: str) -> "tuple[date | None, date | None]":
    cursor.execute(
        "SELECT MIN(trade_date) AS lo, MAX(trade_date) AS hi "
        "FROM fact_historical_prices WHERE ticker = %s",
        (ticker,),
    )
    row = cursor.fetchone()
    return to_date(row["lo"]), to_date(row["hi"])


def manual_dates(cursor, ticker: str) -> "set[date]":
    """trade_dates whose existing source is manual_* — these must not be clobbered."""
    cursor.execute(
        "SELECT trade_date FROM fact_historical_prices "
        "WHERE ticker = %s AND source IN ('manual_investingcom','manual_csv')",
        (ticker,),
    )
    return {to_date(r["trade_date"]) for r in cursor.fetchall()}


def missing_segments(target_from, target_to, have_lo, have_hi, force):
    """Return [(from, to)] segments to fetch. With --force, the whole window."""
    if force or have_lo is None or have_hi is None:
        return [(target_from, target_to)]
    segments = []
    if target_from < have_lo:                       # head gap
        segments.append((target_from, have_lo - timedelta(days=1)))
    if target_to > have_hi:                          # tail gap
        segments.append((have_hi + timedelta(days=1), target_to))
    return segments


# ── Fetch + upsert ──────────────────────────────────────────────────────────


def fetch_segment(ticker, seg_from, seg_to):
    """yfinance OHLCV for one window. Returns a list of per-row tuples (no run id)."""
    # yfinance 'end' is exclusive — add a day so seg_to is included.
    df = yf.Ticker(ticker).history(
        start=seg_from.isoformat(),
        end=(seg_to + timedelta(days=1)).isoformat(),
        auto_adjust=False,
        actions=False,
    )
    out = []
    if df is None or df.empty:
        return out
    for idx, row in df.iterrows():
        trade_date = idx.date() if hasattr(idx, "date") else to_date(idx)
        close = row.get("Close")
        if close is None or close != close:          # NaN guard — close is NOT NULL
            continue
        adj = row.get("Adj Close")
        out.append((
            ticker,
            trade_date,
            _num(row.get("Open")),
            _num(row.get("High")),
            _num(row.get("Low")),
            _num(close),
            _num(adj),
            _vol(row.get("Volume")),
        ))
    return out


def _num(v):
    if v is None or v != v:
        return None
    return float(v)


def _vol(v):
    if v is None or v != v:
        return None
    return int(v)


def open_run(conn, cursor, ticker, source, req_from, req_to, triggered_by):
    cursor.execute(
        "INSERT INTO dim_price_runs "
        "(ticker, source, requested_from, requested_to, status, triggered_by) "
        "VALUES (%s, %s, %s, %s, 'running', %s)",
        (ticker, source, req_from, req_to, triggered_by),
    )
    conn.commit()
    return cursor.lastrowid


def close_run(conn, cursor, run_id, inserted, updated, status, error=None):
    cursor.execute(
        "UPDATE dim_price_runs SET rows_inserted = %s, rows_updated = %s, "
        "status = %s, error_message = %s, finished_at = NOW() WHERE run_id = %s",
        (inserted, updated, status, error, run_id),
    )
    conn.commit()


def process_ticker(conn, cursor, item, force, triggered_by):
    """Fetch + upsert one ticker. Returns its terminal status string."""
    ticker = item["ticker"]
    tfrom, tto = item["target_from"], item["target_to"]
    have_lo, have_hi = existing_coverage(cursor, ticker)
    segments = missing_segments(tfrom, tto, have_lo, have_hi, force)

    if not segments:
        emit({"type": "ticker_done", "ticker": ticker, "status": "ok", "bars": 0})
        return "ok"

    protected = set() if force else manual_dates(cursor, ticker)
    run_id = open_run(conn, cursor, ticker, "yfinance", tfrom, tto, triggered_by)

    inserted = updated = 0
    try:
        for seg_from, seg_to in segments:
            rows = fetch_segment(ticker, seg_from, seg_to)
            for r in rows:
                if r[1] in protected:               # manual wins
                    continue
                # INSERT ... ON DUPLICATE: affected rows = 1 (insert) or 2 (update)
                cursor.execute(UPSERT_SQL, r + (run_id,))
                if cursor.rowcount == 1:
                    inserted += 1
                elif cursor.rowcount == 2:
                    updated += 1
        conn.commit()
    except Exception as exc:                          # network / API — never abort the batch
        conn.rollback()
        close_run(conn, cursor, run_id, inserted, updated, "failed", str(exc)[:1000])
        emit({"type": "stderr", "message": f"{ticker}: {exc}"})
        emit({"type": "ticker_done", "ticker": ticker, "status": "failed", "bars": 0})
        return "failed"

    bars = inserted + updated
    status = "ok" if bars > 0 else "no_data"
    close_run(conn, cursor, run_id, inserted, updated, status)
    emit({"type": "ticker_done", "ticker": ticker, "status": status, "bars": bars})
    return status


# ── Entry point ───────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the historical price archive.")
    parser.add_argument("--all", action="store_true", help="build the full coverage target")
    parser.add_argument("--ticker", help="single ticker")
    parser.add_argument("--from", dest="from_date", help="window start (single-ticker override)")
    parser.add_argument("--to", dest="to_date", help="window end (single-ticker override)")
    parser.add_argument("--force", action="store_true", help="re-fetch and overwrite manual rows")
    parser.add_argument("--triggered-by", default="coverage_build",
                        choices=["coverage_build", "single_ticker", "manual_upload",
                                 "watchlist_refresh", "scheduled"])
    args = parser.parse_args()

    if not args.all and not args.ticker:
        emit({"type": "stderr", "message": "Specify --all or --ticker T"})
        sys.exit(2)

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    try:
        work = resolve_work_list(cursor, args)
        total = len(work)
        log(f"Resolved {total} ticker(s) from coverage target.")

        counts = {"ok": 0, "no_data": 0, "failed": 0}
        failed = []
        for i, item in enumerate(work, start=1):
            emit({"type": "progress", "current": i, "total": total, "ticker": item["ticker"]})
            status = process_ticker(conn, cursor, item, args.force, args.triggered_by)
            counts[status] = counts.get(status, 0) + 1
            if status == "failed":
                failed.append(item["ticker"])

        emit({"type": "final", "payload": {"summary": {
            "tickers": total,
            "ok": counts["ok"],
            "no_data": counts["no_data"],
            "failed": counts["failed"],
            "failed_tickers": failed,
        }}})
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
