"""
Ingestion of Historical 15-Minute Weather for all 75 Uttar Pradesh Districts
into PostgreSQL public.weather_regionwise
--------------------------------------------------------------------------
Date range: 2024-12-01 to Present
Region: N2 (Official IEX Bid Area for Uttar Pradesh)
Resolution: 15-minute intervals (Open-Meteo Historical Forecast API)
"""

import os
import sys
import time
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import psycopg2
from psycopg2.extras import execute_values
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Ensure console supports UTF-8
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ============================================================
# CONFIGURATION
# ============================================================

TODAY_STR = datetime.now().strftime("%Y-%m-%d")
START_DATE = os.getenv("START_DATE", "2024-12-01")
END_DATE = os.getenv("END_DATE", TODAY_STR)
TIMEZONE = "Asia/Kolkata"

OPEN_METEO_WEATHER_URL = "https://historical-forecast-api.open-meteo.com/v1/forecast"

DB_CONFIG = {
    "host": os.getenv("PGHOST", "13.206.77.155"),
    "port": int(os.getenv("PROD_PGPORT", os.getenv("PGPORT", "5436"))),
    "database": os.getenv("PGDATABASE", "Prolt_Operations"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "iex_sec_k9P2mX_2026"),
}

TABLE_NAME = os.getenv("WEATHER_TABLE", "weather_regionwise")
BATCH_SIZE = 2000
MAX_WORKERS = 3  # Parallel threads to keep within Open-Meteo limits while speeding up ingestion

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("up_weather_ingest")


# ============================================================
# 75 DISTRICTS OF UTTAR PRADESH
# ============================================================

UP_DISTRICTS_DATA = [
    ("Agra", 27.1767, 78.0081),
    ("Aligarh", 27.8974, 78.0880),
    ("Ambedkar Nagar", 26.4300, 82.5400),
    ("Amethi", 26.1550, 81.8100),
    ("Amroha", 28.9034, 78.4677),
    ("Auraiya", 26.4650, 79.5150),
    ("Ayodhya", 26.7922, 82.1998),
    ("Azamgarh", 26.0685, 83.1859),
    ("Baghpat", 28.9447, 77.2186),
    ("Bahraich", 27.5743, 81.5947),
    ("Ballia", 25.7584, 84.1490),
    ("Balrampur", 27.4300, 82.1800),
    ("Banda", 25.4760, 80.3360),
    ("Barabanki", 26.9226, 81.1834),
    ("Bareilly", 28.3670, 79.4304),
    ("Basti", 26.8000, 82.7300),
    ("Bhadohi", 25.3950, 82.5700),
    ("Bijnor", 29.3724, 78.1358),
    ("Budaun", 28.0389, 79.1267),
    ("Bulandshahr", 28.4070, 77.8498),
    ("Chandauli", 25.2600, 83.2700),
    ("Chitrakoot", 25.2000, 80.9000),
    ("Deoria", 26.5024, 83.7791),
    ("Etah", 27.5588, 78.6627),
    ("Etawah", 26.7855, 79.0215),
    ("Farrukhabad", 27.3910, 79.5800),
    ("Fatehpur", 25.9304, 80.8138),
    ("Firozabad", 27.1592, 78.3957),
    ("Gautam Buddha Nagar", 28.5355, 77.3910),
    ("Ghaziabad", 28.6692, 77.4538),
    ("Ghazipur", 25.5880, 83.5780),
    ("Gonda", 27.1339, 81.9619),
    ("Gorakhpur", 26.7606, 83.3732),
    ("Hamirpur", 25.9560, 80.1480),
    ("Hapur", 28.7306, 77.7759),
    ("Hardoi", 27.3950, 80.1300),
    ("Hathras", 27.5960, 78.0530),
    ("Jalaun", 25.9900, 79.4500),
    ("Jaunpur", 25.7463, 82.6836),
    ("Jhansi", 25.4484, 78.5685),
    ("Kannauj", 27.0514, 79.9151),
    ("Kanpur Dehat", 26.4300, 79.9900),
    ("Kanpur Nagar", 26.4499, 80.3319),
    ("Kasganj", 27.8080, 78.6480),
    ("Kaushambi", 25.5300, 81.3800),
    ("Kushinagar", 26.9050, 83.9800),
    ("Lakhimpur Kheri", 27.9470, 80.7800),
    ("Lalitpur", 24.6900, 78.4100),
    ("Lucknow", 26.8467, 80.9462),
    ("Maharajganj", 27.1400, 83.5600),
    ("Mahoba", 25.2920, 79.8730),
    ("Mainpuri", 27.2350, 79.0250),
    ("Mathura", 27.4924, 77.6737),
    ("Mau", 25.9417, 83.5611),
    ("Meerut", 28.9845, 77.7064),
    ("Mirzapur", 25.1460, 82.5690),
    ("Moradabad", 28.8386, 78.7733),
    ("Muzaffarnagar", 29.4727, 77.7085),
    ("Pilibhit", 28.6310, 79.8040),
    ("Pratapgarh", 25.8970, 81.9450),
    ("Prayagraj", 25.4358, 81.8463),
    ("Raebareli", 26.2345, 81.2409),
    ("Rampur", 28.8100, 79.0300),
    ("Saharanpur", 29.9680, 77.5510),
    ("Sambhal", 28.5850, 78.5710),
    ("Sant Kabir Nagar", 26.7700, 83.0700),
    ("Shahjahanpur", 27.8830, 79.9100),
    ("Shamli", 29.4500, 77.3100),
    ("Shravasti", 27.6900, 81.9300),
    ("Siddharthnagar", 27.2900, 83.0900),
    ("Sitapur", 27.5650, 80.6830),
    ("Sonbhadra", 24.6900, 83.0700),
    ("Sultanpur", 26.2648, 82.0727),
    ("Unnao", 26.5470, 80.4880),
    ("Varanasi", 25.3176, 82.9739),
]

def build_locations_list():
    locations = []
    for d, lat, lon in UP_DISTRICTS_DATA:
        slug = d.lower().replace(" ", "_")
        hub_code = f"{slug}_up"
        # Avoid primary key collision with Rajasthan's 'Pratapgarh District'
        station_name = "Pratapgarh (UP) District" if d == "Pratapgarh" else f"{d} District"
        locations.append({
            "station_name": station_name,
            "hub_code": hub_code,
            "state": "Uttar Pradesh",
            "district": d,
            "region": "N2",
            "latitude": lat,
            "longitude": lon,
        })
    return locations

UP_LOCATIONS = build_locations_list()


# ============================================================
# HTTP SESSION WITH RETRIES
# ============================================================

def create_http_session():
    retry_strategy = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=10,
    )
    session = requests.Session()
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": "up-weather-ingestion/1.0",
        "Accept": "application/json",
    })
    return session


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


# ============================================================
# FETCH & PARSE WEATHER
# ============================================================

def fetch_weather(session, location):
    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "start_date": START_DATE,
        "end_date": END_DATE,
        "minutely_15": (
            "shortwave_radiation,direct_radiation,diffuse_radiation,direct_normal_irradiance,"
            "wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_direction_80m,wind_direction_120m,wind_gusts_10m,"
            "temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,"
            "cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,"
            "visibility,surface_pressure,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,is_day"
        ),
        "timezone": TIMEZONE,
        "wind_speed_unit": "ms",
        "temperature_unit": "celsius",
        "precipitation_unit": "mm",
    }

    response = session.get(OPEN_METEO_WEATHER_URL, params=params, timeout=120)
    if response.status_code != 200:
        raise RuntimeError(f"Open-Meteo API error {response.status_code}: {response.text[:500]}")

    data = response.json()
    if "minutely_15" not in data:
        raise RuntimeError("API response does not contain 'minutely_15'")

    return data["minutely_15"]


def get_val(data, key, idx):
    v = data.get(key)
    if v is None or idx >= len(v):
        return None
    return v[idx]


def parse_rows(weather_data, location):
    times = weather_data.get("time", [])
    rows = []
    station_name = location["station_name"]
    hub_code = location["hub_code"]
    state = location["state"]
    district = location["district"]
    region = location["region"]
    lat = location["latitude"]
    lon = location["longitude"]

    for i, ts in enumerate(times):
        row = (
            station_name,
            hub_code,
            state,
            district,
            region,
            lat,
            lon,
            ts,
            get_val(weather_data, "wind_speed_10m", i),
            get_val(weather_data, "shortwave_radiation", i),
            get_val(weather_data, "direct_radiation", i),
            get_val(weather_data, "diffuse_radiation", i),
            get_val(weather_data, "direct_normal_irradiance", i),
            get_val(weather_data, "wind_speed_80m", i),
            get_val(weather_data, "wind_speed_120m", i),
            get_val(weather_data, "wind_direction_80m", i),
            get_val(weather_data, "wind_direction_120m", i),
            get_val(weather_data, "wind_gusts_10m", i),
            get_val(weather_data, "temperature_2m", i),
            get_val(weather_data, "relative_humidity_2m", i),
            get_val(weather_data, "dew_point_2m", i),
            get_val(weather_data, "precipitation", i),
            get_val(weather_data, "cloud_cover", i),
            get_val(weather_data, "cloud_cover_low", i),
            get_val(weather_data, "cloud_cover_mid", i),
            get_val(weather_data, "cloud_cover_high", i),
            get_val(weather_data, "visibility", i),
            get_val(weather_data, "surface_pressure", i),
            get_val(weather_data, "soil_moisture_0_to_1cm", i),
            get_val(weather_data, "soil_moisture_1_to_3cm", i),
            get_val(weather_data, "is_day", i),
        )
        rows.append(row)
    return rows


# ============================================================
# DB UPSERT
# ============================================================

def insert_rows(conn, rows):
    if not rows:
        return 0

    insert_sql = f"""
    INSERT INTO public.{TABLE_NAME} (
        location, hub_name, state, district, region, latitude, longitude, time,
        wind_speed_10m, shortwave_radiation, direct_radiation, diffuse_radiation, direct_normal_irradiance,
        wind_speed_80m, wind_speed_120m, wind_direction_80m, wind_direction_120m, wind_gusts_10m,
        temperature_2m, relative_humidity_2m, dew_point_2m, precipitation,
        cloud_cover, cloud_cover_low, cloud_cover_mid, cloud_cover_high,
        visibility, surface_pressure, soil_moisture_0_to_1cm, soil_moisture_1_to_3cm, is_day
    )
    VALUES %s
    ON CONFLICT (location, time)
    DO UPDATE SET
        hub_name = EXCLUDED.hub_name,
        state = EXCLUDED.state,
        district = EXCLUDED.district,
        region = EXCLUDED.region,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        wind_speed_10m = EXCLUDED.wind_speed_10m,
        shortwave_radiation = EXCLUDED.shortwave_radiation,
        direct_radiation = EXCLUDED.direct_radiation,
        diffuse_radiation = EXCLUDED.diffuse_radiation,
        direct_normal_irradiance = EXCLUDED.direct_normal_irradiance,
        wind_speed_80m = EXCLUDED.wind_speed_80m,
        wind_speed_120m = EXCLUDED.wind_speed_120m,
        wind_direction_80m = EXCLUDED.wind_direction_80m,
        wind_direction_120m = EXCLUDED.wind_direction_120m,
        wind_gusts_10m = EXCLUDED.wind_gusts_10m,
        temperature_2m = EXCLUDED.temperature_2m,
        relative_humidity_2m = EXCLUDED.relative_humidity_2m,
        dew_point_2m = EXCLUDED.dew_point_2m,
        precipitation = EXCLUDED.precipitation,
        cloud_cover = EXCLUDED.cloud_cover,
        cloud_cover_low = EXCLUDED.cloud_cover_low,
        cloud_cover_mid = EXCLUDED.cloud_cover_mid,
        cloud_cover_high = EXCLUDED.cloud_cover_high,
        visibility = EXCLUDED.visibility,
        surface_pressure = EXCLUDED.surface_pressure,
        soil_moisture_0_to_1cm = EXCLUDED.soil_moisture_0_to_1cm,
        soil_moisture_1_to_3cm = EXCLUDED.soil_moisture_1_to_3cm,
        is_day = EXCLUDED.is_day;
    """

    with conn.cursor() as cur:
        for start in range(0, len(rows), BATCH_SIZE):
            batch = rows[start:start + BATCH_SIZE]
            execute_values(cur, insert_sql, batch, page_size=BATCH_SIZE)
    conn.commit()
    return len(rows)


# ============================================================
# WORKER FUNCTION
# ============================================================

def process_one_district(location, index, total):
    session = create_http_session()
    conn = None
    station_name = location["station_name"]

    try:
        conn = get_db_connection()
        # Check if already fully ingested
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT count(*) FROM public.{TABLE_NAME} WHERE location = %s AND time >= %s;",
                (station_name, START_DATE)
            )
            existing_count = cur.fetchone()[0]

        if existing_count >= 60000:
            logger.info("SKIP  [%2d/%2d] | %-28s | Already has %d rows", index, total, station_name, existing_count)
            return existing_count

        logger.info("FETCH [%2d/%2d] | %-28s (lat=%.4f, lon=%.4f, reg=%s)", index, total, station_name, location["latitude"], location["longitude"], location["region"])
        t0 = time.time()
        w_data = fetch_weather(session, location)
        fetch_time = time.time() - t0

        rows = parse_rows(w_data, location)
        t1 = time.time()
        inserted = insert_rows(conn, rows)
        insert_time = time.time() - t1

        logger.info(
            "DONE  [%2d/%2d] | %-28s | rows=%d (fetch=%.1fs, insert=%.1fs)",
            index, total, station_name, inserted, fetch_time, insert_time
        )
        return inserted

    except Exception as exc:
        if conn:
            conn.rollback()
        logger.exception("FAIL  [%2d/%2d] | %-28s | %s", index, total, station_name, exc)
        return 0

    finally:
        if conn:
            conn.close()
        session.close()


# ============================================================
# MAIN
# ============================================================

def main():
    start_time = datetime.now()
    total_districts = len(UP_LOCATIONS)

    logger.info("=" * 70)
    logger.info("UTTAR PRADESH WEATHER INGESTION -> public.%s", TABLE_NAME)
    logger.info("Date Range: %s -> %s", START_DATE, END_DATE)
    logger.info("Region:     N2 (IEX Bid Area for Uttar Pradesh)")
    logger.info("Districts:  %d", total_districts)
    logger.info("Workers:    %d concurrent threads", MAX_WORKERS)
    logger.info("=" * 70)

    total_rows = 0
    successful = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_loc = {
            executor.submit(process_one_district, loc, idx, total_districts): loc
            for idx, loc in enumerate(UP_LOCATIONS, 1)
        }

        for future in as_completed(future_to_loc):
            loc = future_to_loc[future]
            try:
                rows_count = future.result()
                if rows_count > 0:
                    successful += 1
                    total_rows += rows_count
                else:
                    failed += 1
            except Exception as e:
                logger.error("Exception for %s: %s", loc["station_name"], e)
                failed += 1

    elapsed = datetime.now() - start_time
    logger.info("=" * 70)
    logger.info("UP INGESTION FINISHED in %s", elapsed)
    logger.info("Successful districts: %d / %d", successful, total_districts)
    logger.info("Failed districts:     %d", failed)
    logger.info("Total rows handled:   %s", f"{total_rows:,}")
    logger.info("=" * 70)

    # Verification query
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT count(*), min(time), max(time), count(DISTINCT location), count(DISTINCT district)
                FROM public.{TABLE_NAME}
                WHERE region = 'N2';
            """)
            stats = cur.fetchone()
            logger.info("Verification for region = 'N2':")
            logger.info("  Total rows       : %s", f"{stats[0]:,}" if stats[0] else "0")
            logger.info("  Earliest time    : %s", stats[1])
            logger.info("  Latest time      : %s", stats[2])
            logger.info("  Distinct stations: %s", stats[3])
            logger.info("  Distinct districts: %s", stats[4])
        conn.close()
    except Exception as e:
        logger.error("Verification failed: %s", e)


if __name__ == "__main__":
    main()
