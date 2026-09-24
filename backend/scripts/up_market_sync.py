import os
import logging
from datetime import datetime, date, time
from decimal import Decimal
from calendar import monthrange

import argparse
import requests
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv


# ============================================================
# Configuration
# ============================================================

load_dotenv()

IEX_API_URL = os.getenv("IEX_API_URL", "https://www.iexindia.com/IEXPublish/AppServices.svc/IEXGetTradeData/")
IEX_API_TOKEN = os.getenv("IEX_API_TOKEN", "NCLIEXHkl7900@8Uyhkj")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "iex-postgres")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DATABASE = os.getenv("POSTGRES_DATABASE", "Prolt_Operations")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")

DAM_PRODUCT_CODE = int(os.getenv("DAM_PRODUCT_CODE", "1"))
GDAM_PRODUCT_CODE = int(os.getenv("GDAM_PRODUCT_CODE", "2"))
RTM_PRODUCT_CODE = int(os.getenv("RTM_PRODUCT_CODE", "3"))

FROM_TOKEN = int(os.getenv("FROM_TOKEN", "1"))
TO_TOKEN = int(os.getenv("TO_TOKEN", "96"))
DATE_TYPE = int(os.getenv("DATE_TYPE", "1"))

STATE = os.getenv("STATE", "UP")

CURRENT_DATE = date.today()
FROM_YEAR = int(os.getenv("FROM_YEAR", str(CURRENT_DATE.year)))
FROM_MONTH = int(os.getenv("FROM_MONTH", str(CURRENT_DATE.month)))
TO_YEAR = int(os.getenv("TO_YEAR", str(CURRENT_DATE.year)))
TO_MONTH = int(os.getenv("TO_MONTH", str(CURRENT_DATE.month)))

REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "120"))
API_RETRY_COUNT = int(os.getenv("API_RETRY_COUNT", "3"))


# ============================================================
# Logging
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logger = logging.getLogger(__name__)


# ============================================================
# PostgreSQL
# ============================================================

def get_db_connection():
    connection = psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DATABASE,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

    with connection.cursor() as cursor:
        cursor.execute("SET TIME ZONE 'Asia/Kolkata'")

    return connection


# ============================================================
# Month utilities
# ============================================================

def get_month_range(from_year, from_month, to_year, to_month):
    """Return every calendar month in the inclusive requested range."""

    start = date(from_year, from_month, 1)
    end = date(to_year, to_month, 1)

    if start > end:
        raise ValueError(
            "FROM_YEAR/FROM_MONTH must be before or equal to "
            "TO_YEAR/TO_MONTH"
        )

    months = []
    year = start.year
    month = start.month

    while (year, month) <= (end.year, end.month):
        months.append((year, month))

        month += 1
        if month == 13:
            month = 1
            year += 1

    return months


def get_month_dates(year, month):
    first_day = date(year, month, 1)
    last_day = date(year, month, monthrange(year, month)[1])

    return first_day, last_day


# ============================================================
# API
# ============================================================

def build_api_request(product_code, from_date, to_date):

    return {
        "APITokenNo": IEX_API_TOKEN,
        "Product_Code": product_code,
        "From_Date": from_date.strftime("%d/%m/%Y"),
        "To_Date": to_date.strftime("%d/%m/%Y"),
        "From_Token": FROM_TOKEN,
        "To_Token": TO_TOKEN,
        "Date_Type": DATE_TYPE
    }


def call_iex_api(product_code, from_date, to_date):

    payload = build_api_request(
        product_code,
        from_date,
        to_date
    )

    logger.info(
        "Calling IEX API | product=%s | from=%s | to=%s",
        product_code,
        payload["From_Date"],
        payload["To_Date"]
    )

    last_exception = None

    for attempt in range(1, API_RETRY_COUNT + 1):

        try:

            response = requests.post(
                IEX_API_URL,
                json=payload,
                timeout=REQUEST_TIMEOUT
            )

            response.raise_for_status()

            data = response.json()

            if not data.get("Status", False):

                raise RuntimeError(
                    f"IEX API returned failure: "
                    f"{data.get('Message')}"
                )

            logger.info(
                "API success | product=%s | message=%s",
                product_code,
                data.get("Message")
            )

            return data

        except Exception as exc:

            last_exception = exc

            logger.warning(
                "API attempt %s/%s failed: %s",
                attempt,
                API_RETRY_COUNT,
                exc
            )

            if attempt < API_RETRY_COUNT:
                import time
                time.sleep(2 ** attempt)

    raise RuntimeError(
        f"IEX API failed after {API_RETRY_COUNT} attempts"
    ) from last_exception


# ============================================================
# Token → Interval
# ============================================================

def token_to_interval(token_no):

    if token_no < 1 or token_no > 96:
        raise ValueError(
            f"Invalid token number: {token_no}"
        )

    total_minutes = (token_no - 1) * 15

    hours = total_minutes // 60
    minutes = total_minutes % 60

    return time(
        hour=hours,
        minute=minutes
    )


# ============================================================
# Transformation
# ============================================================

def transform_response(api_response):

    rows = []

    delivery_dates = api_response.get(
        "Delivery_Date_Details",
        []
    )

    for delivery in delivery_dates:

        delivery_date_str = delivery.get("DeliveryDate")

        if not delivery_date_str:
            continue

        delivery_date = datetime.strptime(
            delivery_date_str,
            "%d/%m/%Y"
        ).date()

        token_wise = delivery.get("Token_Wise") or []

        for token_data in token_wise:

            token_no = token_data.get("Token_NO")

            if token_no is None:
                continue

            interval_time = token_to_interval(token_no)

            for area_data in token_data.get("Area_Details", []):

                if area_data.get("Area_code") != "N2":
                    continue

                market_summary = area_data.get("Area_Codes")

                if not market_summary:
                    continue

                all_india_summary = token_data.get(
                    "All_India_DAM_GDAM_RTM",
                    {}
                )

                row = (
                    interval_time,
                    delivery_date,
                    market_summary.get(
                        "Area_Price",
                        market_summary.get("Clearing_Price")
                    ),
                    all_india_summary.get("Cleared_Volume"),
                    market_summary.get("Buy_Volume"),
                    market_summary.get("Sell_Volume"),
                    STATE
                )

                rows.append(row)

    return rows


# ============================================================
# PostgreSQL Upsert
# ============================================================

def persist_rows(connection, rows, table_name):

    if not rows:
        logger.warning(
            "No rows to persist for table=%s",
            table_name
        )
        return 0

    sql = f"""
        INSERT INTO {table_name}
        (
            "intervalTime",
            "date",
            mcp,
            mcv,
            "purchaseBid",
            "sellBid",
            state
        )
        VALUES %s
        ON CONFLICT ("date", "intervalTime", state)
        DO UPDATE SET
            mcp = EXCLUDED.mcp,
            mcv = EXCLUDED.mcv,
            "purchaseBid" = EXCLUDED."purchaseBid",
            "sellBid" = EXCLUDED."sellBid",
            updated_at = CURRENT_TIMESTAMP
    """

    with connection.cursor() as cursor:

        execute_values(
            cursor,
            sql,
            rows,
            page_size=1000
        )

    connection.commit()

    logger.info(
        "Persisted %s rows into %s",
        len(rows),
        table_name
    )

    return len(rows)


# ============================================================
# Process one market/month
# ============================================================

def process_market_month(
    connection,
    product_code,
    table_name,
    year,
    month
):

    from_date, to_date = get_month_dates(
        year,
        month
    )

    logger.info(
        "Processing %s | %04d-%02d",
        table_name,
        year,
        month
    )

    response = call_iex_api(
        product_code,
        from_date,
        to_date
    )

    rows = transform_response(response)

    logger.info(
        "Transformed %s rows | %s | %04d-%02d",
        len(rows),
        table_name,
        year,
        month
    )

    persist_rows(
        connection,
        rows,
        table_name
    )

    return len(rows)


# ============================================================
# Main
# ============================================================

def main():

    logger.info(
        "Starting IEX market data import"
    )

    logger.info(
        "Fetching months from %04d-%02d to %04d-%02d",
        FROM_YEAR,
        FROM_MONTH,
        TO_YEAR,
        TO_MONTH
    )

    months = get_month_range(
        FROM_YEAR,
        FROM_MONTH,
        TO_YEAR,
        TO_MONTH
    )

    connection = None

    total_dam_rows = 0
    total_rtm_rows = 0

    try:

        connection = get_db_connection()

        logger.info(
            "PostgreSQL connection established"
        )
        
        parser = argparse.ArgumentParser()
        parser.add_argument('--market', type=str, choices=['ALL', 'DAM', 'GDAM', 'RTM'], default='ALL')
        args = parser.parse_args()

        for year, month in months:

            logger.info(
                "================================================"
            )

            logger.info(
                "Processing month: %04d-%02d",
                year,
                month
            )

            # ------------------------------------------------
            # DAM
            # ------------------------------------------------
            if args.market in ['ALL', 'DAM']:
                try:

                    rows = process_market_month(
                        connection=connection,
                        product_code=DAM_PRODUCT_CODE,
                        table_name="exchange_dam_rate",
                        year=year,
                        month=month
                    )

                    total_dam_rows += rows

                except Exception:

                    logger.exception(
                        "DAM processing failed for %04d-%02d",
                        year,
                        month
                    )

            # ------------------------------------------------
            # GDAM
            # ------------------------------------------------
            if args.market in ['ALL', 'GDAM']:
                try:

                    rows = process_market_month(
                        connection=connection,
                        product_code=GDAM_PRODUCT_CODE,
                        table_name="exchange_gdam_rate",
                        year=year,
                        month=month
                    )

                except Exception:

                    logger.exception(
                        "GDAM processing failed for %04d-%02d",
                        year,
                        month
                    )

            # ------------------------------------------------
            # RTM
            # ------------------------------------------------
            if args.market in ['ALL', 'RTM']:
                try:

                    rows = process_market_month(
                        connection=connection,
                        product_code=RTM_PRODUCT_CODE,
                        table_name="exchange_rtm_rate",
                        year=year,
                        month=month
                    )

                    total_rtm_rows += rows

                except Exception:

                    logger.exception(
                        "RTM processing failed for %04d-%02d",
                        year,
                        month
                    )

        logger.info(
            "================================================"
        )

        logger.info(
            "Import completed"
        )

        logger.info(
            "Total DAM rows: %s",
            total_dam_rows
        )

        logger.info(
            "Total RTM rows: %s",
            total_rtm_rows
        )

    finally:

        if connection:
            connection.close()

            logger.info(
                "PostgreSQL connection closed"
            )


if __name__ == "__main__":
    main()