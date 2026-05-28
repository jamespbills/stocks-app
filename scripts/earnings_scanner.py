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
from datetime import datetime, timedelta
from typing import Optional, List, Dict

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

            stats = {"inserted": 0, "updated": 0, "unchanged": 0, "errors": 0, "skipped_quarter": 0}
            matched: set = set()

            for record in all_records:
                if record.ticker in tickers:
                    if record.quarter in (1, 3):
                        stats["skipped_quarter"] += 1
                        continue
                    result = self.upsert_record(record, tickers[record.ticker])
                    stats[result] += 1
                    if result in ("inserted", "updated", "unchanged"):
                        matched.add(record.ticker)

            self.connection.commit()
            logger.info(f"Matched {len(matched)} tickers")
            logger.info(
                f"Inserted: {stats['inserted']}, Updated: {stats['updated']}, "
                f"Unchanged: {stats['unchanged']}, Skipped Q1/Q3: {stats['skipped_quarter']}"
            )
        finally:
            self.disconnect()


if __name__ == "__main__":
    if not FINNHUB_API_KEY and not FMP_API_KEY:
        print("ERROR: neither FINNHUB_API_KEY nor FMP_API_KEY is set in config.local.json", file=sys.stderr)
        sys.exit(1)
    EarningsScanner().run()
