import os
import yfinance as yf
import mysql.connector
from datetime import datetime

DB_CONFIG = {
    "host":     os.environ["DB_HOST"],
    "port":     int(os.environ.get("DB_PORT", "3306")),
    "user":     os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
}

DDL_LIVE_PRICES = """
CREATE TABLE IF NOT EXISTS dim_live_prices (
    ticker       VARCHAR(20)    NOT NULL PRIMARY KEY,
    live_price   DECIMAL(18,4)  NULL,
    updated_at   DATETIME       NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

UPSERT_SQL = """
INSERT INTO dim_live_prices (ticker, live_price, updated_at)
VALUES (%s, %s, %s)
ON DUPLICATE KEY UPDATE
    live_price = VALUES(live_price),
    updated_at = VALUES(updated_at);
"""

SELECT_TICKERS = "SELECT DISTINCT ticker FROM view_watching;"


def fetch_live_prices(tickers: list[str]) -> dict[str, float | None]:
    if not tickers:
        return {}

    raw = yf.download(
        tickers,
        period="1d",
        interval="1m",
        group_by="ticker",
        auto_adjust=True,
        progress=False,
        threads=True,
    )

    prices: dict[str, float | None] = {}

    if len(tickers) == 1:
        t = tickers[0]
        try:
            prices[t] = float(raw["Close"].dropna().iloc[-1])
        except (KeyError, IndexError):
            prices[t] = None
    else:
        for t in tickers:
            try:
                prices[t] = float(raw[t]["Close"].dropna().iloc[-1])
            except (KeyError, IndexError):
                prices[t] = None

    return prices


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute(DDL_LIVE_PRICES)
    conn.commit()

    cursor.execute(SELECT_TICKERS)
    tickers = [row[0] for row in cursor.fetchall()]

    if not tickers:
        print("No tickers found in view_watching.")
        return

    print(f"Fetching live prices for {len(tickers)} ticker(s): {tickers}")
    prices = fetch_live_prices(tickers)

    for t in tickers:
        if t.upper().endswith(".L") and prices.get(t) is not None:
            prices[t] = prices[t] / 100

    now = datetime.utcnow()
    rows = [(t, prices.get(t), now) for t in tickers]

    cursor.executemany(UPSERT_SQL, rows)
    conn.commit()

    for ticker, price, _ in rows:
        if price is None:
            status = "N/A (market closed or bad ticker)"
        elif ticker.upper().endswith(".L"):
            status = f"£{price:,.4f}  (converted from pence)"
        else:
            status = f"${price:,.4f}"
        print(f"  {ticker:<12} {status}")

    cursor.close()
    conn.close()
    print(f"\nDone — {len(rows)} ticker(s) updated at {now:%Y-%m-%d %H:%M:%S} UTC")


if __name__ == "__main__":
    main()
