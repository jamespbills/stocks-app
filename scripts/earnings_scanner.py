"""
Earnings Calendar Scanner.

Fetches upcoming earnings dates from Finnhub (US) and FMP (US + UK + international)
into earnings_calendar_tracking. Run from the app via scripts:launchBuiltin.

Env vars (injected by the app):
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    FINNHUB_API_KEY, FMP_API_KEY
"""

import logging
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Set, Tuple

import mysql.connector
import requests
from mysql.connector import Error

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", "3306")),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
}

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")
FMP_API_KEY = os.environ.get("FMP_API_KEY", "")

DAYS_AHEAD = 21

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@dataclass
class EarningsRecord:
    ticker: str
    release_date: str
    fiscal_year: Optional[int]
    quarter: Optional[int]
    report_time: Optional[str]
    eps_estimate: Optional[float]
    revenue_estimate: Optional[float]
    source: str
    # FMP only: the reported fiscal period end (Finnhub uses `quarter` instead).
    fiscal_date_ending: Optional[str] = None


def _parse_iso_date(value: Optional[str]) -> Optional[date]:
    """Parse a 'YYYY-MM-DD' (or longer ISO) string to a date, else None."""
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _matches_tracked_period_end(
    period_end: date, tracked: Set[Tuple[int, int]], tolerance_days: int = 5
) -> bool:
    """True if `period_end` falls within ±tolerance_days of any tracked (month, day)
    period end, checking adjacent years so a late-December end still matches a
    turn-of-year target. Only the annual/semiannual period ends James tracks live in
    `tracked`, so a Q1/Q3 fiscal end (e.g. Mar-31 / Sep-30) returns False."""
    for month, day in tracked:
        for year in (period_end.year - 1, period_end.year, period_end.year + 1):
            try:
                candidate = date(year, month, day)
            except ValueError:
                # e.g. Feb-29 in a non-leap year — clamp to the 28th.
                candidate = date(year, month, min(day, 28))
            if abs((period_end - candidate).days) <= tolerance_days:
                return True
    return False


class FinnhubClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_earnings(self, from_date: str, to_date: str) -> List[EarningsRecord]:
        url = "https://finnhub.io/api/v1/calendar/earnings"
        params = {
            "from": from_date,
            "to": to_date,
            "token": self.api_key,
            "international": "false",
        }
        try:
            logger.info(f"Finnhub: fetching {from_date} to {to_date}")
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            records = []
            for item in data.get("earningsCalendar", []):
                if item.get("symbol") and item.get("date"):
                    records.append(
                        EarningsRecord(
                            ticker=item["symbol"],
                            release_date=item["date"],
                            fiscal_year=item.get("year"),
                            quarter=item.get("quarter"),
                            report_time=item.get("hour"),
                            eps_estimate=item.get("epsEstimate"),
                            revenue_estimate=item.get("revenueEstimate"),
                            source="finnhub",
                        )
                    )
            logger.info(f"Finnhub: {len(records)} records")
            return records
        except Exception as e:
            logger.error(f"Finnhub error: {e}")
            return []


class FMPClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_earnings(self, from_date: str, to_date: str) -> List[EarningsRecord]:
        url = "https://financialmodelingprep.com/api/v3/earning_calendar"
        params = {"from": from_date, "to": to_date, "apikey": self.api_key}
        try:
            logger.info(f"FMP: fetching {from_date} to {to_date}")
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            # One-time visibility: confirm fiscalDateEnding is present in the payload
            # (the period-end filter depends on it; if absent, rows are kept as a fallback).
            if data:
                logger.info(f"FMP: sample item keys: {sorted(data[0].keys())}")
            records = []
            for item in data:
                if item.get("symbol") and item.get("date"):
                    records.append(
                        EarningsRecord(
                            ticker=item["symbol"],
                            release_date=item["date"],
                            fiscal_year=None,
                            quarter=None,
                            report_time=item.get("time"),
                            eps_estimate=item.get("epsEstimated"),
                            revenue_estimate=item.get("revenueEstimated"),
                            source="fmp",
                            fiscal_date_ending=item.get("fiscalDateEnding"),
                        )
                    )
            logger.info(f"FMP: {len(records)} records")
            return records
        except Exception as e:
            logger.error(f"FMP error: {e}")
            return []


class EarningsScanner:
    def __init__(self):
        self.finnhub = FinnhubClient(FINNHUB_API_KEY) if FINNHUB_API_KEY else None
        self.fmp = FMPClient(FMP_API_KEY) if FMP_API_KEY else None
        self.connection = None
        self.cursor = None

    def connect(self) -> bool:
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            self.cursor = self.connection.cursor(dictionary=True)
            logger.info(f"Connected to {DB_CONFIG['database']}")
            return True
        except Error as e:
            logger.error(f"Database error: {e}")
            return False

    def disconnect(self):
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def get_tracked_tickers(self) -> Dict[str, int]:
        self.cursor.execute(
            """
            SELECT vc.ticker, c.company_id
            FROM view_earnings_calendar_actionable vc
            LEFT JOIN dim_companies c ON vc.ticker = c.ticker
            """
        )
        return {row["ticker"]: row["company_id"] for row in self.cursor.fetchall()}

    def get_period_ends(self) -> Dict[str, Set[Tuple[int, int]]]:
        """Per ticker, the set of (month, day) fiscal period ends James actually tracks,
        read from the real reports in fact_reports. Used to drop off-cycle FMP dates
        (Q1/Q3) that FMP gives us with no quarter label."""
        self.cursor.execute(
            """
            SELECT dc.ticker AS ticker,
                   MONTH(fr.report_date) AS m,
                   DAY(fr.report_date) AS d
            FROM fact_reports fr
            JOIN dim_companies dc ON fr.company_id = dc.company_id
            WHERE fr.report_date IS NOT NULL AND dc.delisting_date IS NULL
            GROUP BY dc.ticker, m, d
            """
        )
        out: Dict[str, Set[Tuple[int, int]]] = {}
        for row in self.cursor.fetchall():
            out.setdefault(row["ticker"], set()).add((int(row["m"]), int(row["d"])))
        return out

    def get_existing_record(self, ticker: str, source: str) -> Optional[dict]:
        self.cursor.execute(
            """
            SELECT tracking_id, release_date
            FROM earnings_calendar_tracking
            WHERE ticker = %s AND source = %s
            """,
            (ticker, source),
        )
        return self.cursor.fetchone()

    def update_existing_statuses(self):
        self.cursor.execute(
            """
            UPDATE earnings_calendar_tracking
            SET
                days_until_release = DATEDIFF(release_date, CURDATE()),
                status = CASE
                    WHEN DATEDIFF(release_date, CURDATE()) < 0 THEN 'missed'
                    WHEN DATEDIFF(release_date, CURDATE()) = 0 THEN 'due_today'
                    WHEN DATEDIFF(release_date, CURDATE()) <= 7 THEN 'due_soon'
                    ELSE 'upcoming'
                END
            """
        )
        updated = self.cursor.rowcount
        if updated > 0:
            logger.info(f"Updated status for {updated} existing records")

    def upsert_record(self, record: EarningsRecord, company_id: Optional[int]) -> str:
        try:
            release_dt = datetime.strptime(record.release_date, "%Y-%m-%d").date()
            today = datetime.now().date()
            days_until = (release_dt - today).days

            if days_until < 0:
                status = "missed"
            elif days_until == 0:
                status = "due_today"
            elif days_until <= 7:
                status = "due_soon"
            else:
                status = "upcoming"

            existing = self.get_existing_record(record.ticker, record.source)

            if existing:
                existing_date = existing["release_date"]
                if hasattr(existing_date, "strftime"):
                    existing_date = existing_date.strftime("%Y-%m-%d")

                if existing_date == record.release_date:
                    self.cursor.execute(
                        """
                        UPDATE earnings_calendar_tracking
                        SET days_until_release = %s, status = %s
                        WHERE tracking_id = %s
                        """,
                        (days_until, status, existing["tracking_id"]),
                    )
                    return "unchanged"
                else:
                    self.cursor.execute(
                        """
                        UPDATE earnings_calendar_tracking
                        SET release_date = %s,
                            fiscal_year = %s,
                            quarter = %s,
                            report_time = %s,
                            eps_estimate = %s,
                            revenue_estimate = %s,
                            days_until_release = %s,
                            status = %s
                        WHERE tracking_id = %s
                        """,
                        (
                            record.release_date,
                            record.fiscal_year,
                            record.quarter,
                            record.report_time,
                            record.eps_estimate,
                            int(record.revenue_estimate) if record.revenue_estimate else None,
                            days_until,
                            status,
                            existing["tracking_id"],
                        ),
                    )
                    logger.info(
                        f"Updated {record.ticker} ({record.source}): {existing_date} -> {record.release_date}"
                    )
                    return "updated"
            else:
                self.cursor.execute(
                    """
                    INSERT INTO earnings_calendar_tracking (
                        company_id, ticker, release_date, fiscal_year, quarter,
                        report_time, eps_estimate, revenue_estimate,
                        days_until_release, status, source
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        company_id,
                        record.ticker,
                        record.release_date,
                        record.fiscal_year,
                        record.quarter,
                        record.report_time,
                        record.eps_estimate,
                        int(record.revenue_estimate) if record.revenue_estimate else None,
                        days_until,
                        status,
                        record.source,
                    ),
                )
                return "inserted"

        except Exception as e:
            logger.debug(f"Upsert error for {record.ticker}: {e}")
            return "errors"

    def run(self):
        if not self.connect():
            return

        try:
            tickers = self.get_tracked_tickers()
            logger.info(f"Tracking {len(tickers)} tickers from view_earnings_calendar_actionable")

            if not tickers:
                logger.warning("No tickers in view_earnings_calendar_actionable")
                return

            period_ends = self.get_period_ends()

            self.update_existing_statuses()

            from_date = datetime.now().strftime("%Y-%m-%d")
            to_date = (datetime.now() + timedelta(days=DAYS_AHEAD)).strftime("%Y-%m-%d")
            logger.info(f"Scanning {from_date} to {to_date} ({DAYS_AHEAD} days)")

            all_records: List[EarningsRecord] = []
            if self.finnhub:
                all_records.extend(self.finnhub.get_earnings(from_date, to_date))
            if self.fmp:
                all_records.extend(self.fmp.get_earnings(from_date, to_date))
            logger.info(f"Total API records: {len(all_records)}")

            stats = {
                "inserted": 0,
                "updated": 0,
                "unchanged": 0,
                "errors": 0,
                "skipped_quarter": 0,
                "skipped_period": 0,
            }
            matched: set = set()

            for record in all_records:
                if record.ticker not in tickers:
                    continue

                # Finnhub labels the quarter — drop Q1/Q3 outright.
                if record.quarter in (1, 3):
                    stats["skipped_quarter"] += 1
                    continue

                # FMP gives no quarter, so filter its off-cycle (Q1/Q3) dates by matching
                # the reported fiscal period end against the ticker's real annual/semiannual
                # period ends (±5 days). Missing/unparseable period end, or a ticker with no
                # tracked ends, falls through and is kept for the view guards to handle.
                if record.source == "fmp":
                    tracked = period_ends.get(record.ticker)
                    fde = _parse_iso_date(record.fiscal_date_ending)
                    if tracked and fde is not None and not _matches_tracked_period_end(fde, tracked):
                        stats["skipped_period"] += 1
                        continue

                result = self.upsert_record(record, tickers[record.ticker])
                stats[result] += 1
                if result in ("inserted", "updated", "unchanged"):
                    matched.add(record.ticker)

            self.connection.commit()
            logger.info(f"Matched {len(matched)} tickers")
            logger.info(
                f"Inserted: {stats['inserted']}, Updated: {stats['updated']}, "
                f"Unchanged: {stats['unchanged']}, Skipped Q1/Q3: {stats['skipped_quarter']}, "
                f"Skipped FMP off-cycle: {stats['skipped_period']}"
            )
        finally:
            self.disconnect()


if __name__ == "__main__":
    if not FINNHUB_API_KEY and not FMP_API_KEY:
        print("ERROR: neither FINNHUB_API_KEY nor FMP_API_KEY is set in config.local.json", file=sys.stderr)
        sys.exit(1)
    EarningsScanner().run()
