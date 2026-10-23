# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 08: External Integrations & Third-Party Services

## 1. Executive Summary & Verification Check
This document catalogs every external integration, third-party REST API, database driver, cache instance, mail transport, and web scraping target utilized across the **Prolt Energy / IEX Analytics Dashboard**.

### Batch 2 Integrations Checklist Verification
- **Every Third-Party API, SDK, Database & Cache:** All 11 external systems inventoried.
- **Per Integration Details:** Exact endpoints, HTTP methods, authentication tokens, request/response structures, timeouts, retries, error handling, and calling source files.
- **Target Java Mapping:** Spring Boot `RestClient`, `WebClient`, `JdbcTemplate`, Spring Data Redis, Spring Mail, and Playwright/Selenium.

---

## 2. Complete External Integrations Catalog (11 Systems)

### 2.1 India Energy Exchange (IEX) Official Snapshot Portal (Web Scraping)
- **Calling Files:**
  - [`backend/src/modules/scraper/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts)
  - [`backend/src/services/iex-scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/iex-scraper.service.ts)
- **Purpose:** Ingests official market clearing snapshots for Day-Ahead Market (DAM), Green Day-Ahead Market (GDAM), and Real-Time Market (RTM) directly from the exchange's public portal.
- **Target URLs:**
  - DAM: `https://www.iexindia.com/market-data/day-ahead-market/market-snapshot`
  - GDAM: `https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot`
  - RTM: `https://www.iexindia.com/market-data/real-time-market/market-snapshot`
- **Method / Transport:** Headless browser scraping via **Puppeteer** (`puppeteer ^25.4.0`) using Chromium (`/usr/bin/chromium`).
- **Authentication:** None (Public HTML table scraping).
- **Timeouts:** 30,000 ms navigation timeout.
- **Request / Response Behavior:**
  - The scraper navigates to the ASP.NET/Angular snapshot page, waits for dynamic DOM rendering, selects the delivery date dropdown, and extracts 96 HTML rows corresponding to 15-minute intervals.
  - Extracted fields: `intervalNumber` (1-96), `intervalTime`, `purchaseBid` (MW), `sellBid` (MW), `mcv` (Market Clearing Volume in MW), `mcp` (Market Clearing Price in Rs/MWh).
- **Error Handling & Retries:** Handled via `try/catch`. Failed executions write an `ERROR` record to the `ApiLog` database table and throw `AppError`.
- **Proposed Java Client Approach:** **Playwright for Java** or **Selenium WebDriver** (Chromium headless) executing in an isolated `@Async` worker thread.

---

### 2.2 Direct IEX Exchange Web Service (SOAP / REST API)
- **Calling File:** [`backend/scripts/up_market_sync.py`](file:///Users/yashgupta/IEX-Dashboard/backend/scripts/up_market_sync.py)
- **Purpose:** High-frequency, machine-to-machine exchange trade data synchronization for regional bid areas (e.g. N1, N2 / Uttar Pradesh).
- **Endpoint URL:** `https://www.iexindia.com/IEXPublish/AppServices.svc/IEXGetTradeData/` (configured via `process.env.IEX_API_URL`).
- **HTTP Method:** `POST` / `GET`
- **Authentication:** Proprietary API security token passed via header:
  `IEX_API_TOKEN: NCLIEXHkl7900@8Uyhkj` (sourced from `process.env.IEX_API_TOKEN`).
- **Parameters:**
  - `ProductCode`: `1` (DAM), `2` (GDAM), `3` (RTM)
  - `FromToken`: `1`, `ToToken`: `96`
  - `DateType`: `1`
  - `State`: `UP` / Regional Grid Area
  - `FromYear`, `FromMonth`, `ToYear`, `ToMonth`
- **Timeouts:** `120 seconds` (`REQUEST_TIMEOUT = 120`).
- **Retries:** `3 retries` (`API_RETRY_COUNT = 3`) with backoff.
- **Error Handling:** Logged via Python `logging.error`; failed batches abort without corrupting PostgreSQL database records.
- **Proposed Java Client Approach:** Spring Boot 3 `RestClient` or `WebClient` with custom header interceptor and exponential retry backoff.

---

### 2.3 National Power Portal (NPP) Ingestion API
- **Calling File:** [`backend/src/services/scraper.service.ts:L183-L286`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts#L183-L286)
- **Purpose:** Ingests real-time national power demand met and multi-fuel power generation telemetry across India.
- **Target Endpoints:**
  1. **Demand Met Telemetry:** `GET https://npp.gov.in/dashBoard/demandmet1chartdata?date={YYYY-MM-DD}`
  2. **Generation Breakdown Telemetry:** `GET https://npp.gov.in/dashBoard/demandmet2chartdata?date={YYYY-MM-DD}`
- **Authentication:** None.
- **SSL Configuration:** Uses custom `https.Agent({ rejectUnauthorized: false })` to bypass invalid/expired SSL certificate chains on the government portal.
- **Timeouts:** `30,000 ms`.
- **Retries:** Configured with `axios-retry` (3 retries with exponential backoff on network errors and HTTP 429).
- **Response Structure (JSON):**
  ```json
  [
    {
      "name_of_data": "THERMAL",
      "value_of_data": "142500.5",
      "updated_on": 1726982400000
    },
    {
      "name_of_data": "SOLAR",
      "value_of_data": "18400.2",
      "updated_on": 1726982400000
    }
  ]
  ```
- **Error Handling:** Catches errors, logs to `ApiLog` table with status `ERROR`, and returns empty array `[]`.
- **Proposed Java Client Approach:** Spring `RestClient` configured with a relaxed `SSLContext` (TrustAllStrategy) and Resilience4j retry decorator.

---

### 2.4 Vidyut Pravah State-Level Power Portal
- **Calling File:** [`backend/src/services/scraper.service.ts:L288-L345`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts#L288-L345)
- **Purpose:** Pulls real-time actual power procurement prices and state demand met across 36 Indian states and union territories.
- **Target Endpoints:**
  1. **State Area Clearing Prices (JSON):** `GET https://vidyutpravah.in/PXDashboard/BindStatePricesFromJS`
  2. **State Demand Met (HTML Scraping):** `GET https://vidyutpravah.in/state-data/{state-slug}` (e.g. `uttar-pradesh`, `maharashtra`)
- **Transport / Method:**
  - Prices: HTTP GET via Axios.
  - Demands: Puppeteer headless browser scraping in batches of 2 states with image/stylesheet request blocking to minimize memory footprint.
- **Timeouts:** `30,000 ms`.
- **Error Handling:** Errors in individual state pages are logged without aborting other states in the batch.
- **Proposed Java Client Approach:** Spring `RestClient` for `BindStatePricesFromJS` JSON feed; Playwright for Java for state data DOM extraction.

---

### 2.5 Open-Meteo High-Resolution Weather API
- **Calling File:** [`backend/src/services/weather.service.ts:L33`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts#L33)
- **Purpose:** Ingests 16-day rolling 15-minute weather forecasts (temperature, relative humidity, wind speed, precipitation probability) and daily solar metrics (sunrise, sunset, sunshine duration) for solar generation forecasting.
- **Target URL:**
  `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&minutely_15=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,precipitation_probability&daily=sunrise,sunset,sunshine_duration&forecast_days=16&timezone=auto`
- **Authentication:** None (Public Open-Meteo API tier).
- **Timeouts:** `10,000 ms`.
- **Retries:** `axios-retry` (3 retries with exponential delay, specifically handling rate limit HTTP 429).
- **Response Structure (JSON):**
  ```json
  {
    "latitude": 28.5355,
    "longitude": 77.391,
    "minutely_15": {
      "time": ["2026-08-24T00:00", "2026-08-24T00:15"],
      "temperature_2m": [31.2, 30.8],
      "relative_humidity_2m": [65, 68],
      "wind_speed_10m": [8.4, 7.9],
      "precipitation_probability": [10, 15]
    },
    "daily": {
      "sunrise": ["2026-08-24T05:54"],
      "sunset": ["2026-08-24T18:52"],
      "sunshine_duration": [38400]
    }
  }
  ```
- **Error Handling:** Logs failure per city, continues processing subsequent cities in `CityStateData`.
- **Proposed Java Client Approach:** Spring Boot `RestClient` with Jackson JSON mapping into `OpenMeteoResponseDTO`.

---

### 2.6 AccuWeather REST API (Legacy / Secondary Provider)
- **Calling File:** [`backend/src/services/weather.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts), referenced in [`backend/.env.example:L36`](file:///Users/yashgupta/IEX-Dashboard/backend/.env.example#L36).
- **Purpose:** Historical weather actuals and secondary forecast validations.
- **Authentication:** `apikey` query parameter (`ACCUWEATHER_API_KEY`).
- **Endpoints:**
  - `GET http://dataservice.accuweather.com/locations/v1/cities/search`
  - `GET http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/{locationKey}`
  - `GET http://dataservice.accuweather.com/currentconditions/v1/{locationKey}`
- **Proposed Java Client Approach:** OpenFeign client or Spring `RestClient`.

---

### 2.7 StarRocks Distributed Analytical Database (OLAP)
- **Calling File:** [`backend/src/services/starrocks.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts)
- **Purpose:** Executes high-speed aggregate queries on massive 15-minute consumer smart meter telemetry tables (`prolt_load_data`).
- **Driver / Protocol:** MySQL Wire Protocol via `mysql2/promise` (`mysql2 ^3.23.3`).
- **Connection Configuration:**
  - Host: `process.env.STARROCKS_HOST` (default: `prolt-prod-starrocks.probussense.com`)
  - Port: `process.env.STARROCKS_PORT` (default: `9030`)
  - User: `process.env.STARROCKS_USER` (default: `read_only_user`)
  - Password: `process.env.STARROCKS_PASSWORD` (default: `Probus@123`)
  - Database: `process.env.STARROCKS_DATABASE` (default: `prolt_hes_db`)
  - Pool Settings: `connectionLimit: 10`, `connectTimeout: 10000`, `waitForConnections: true`.
- **Primary SQL Query Executed:**
  ```sql
  SELECT 
    DATE_FORMAT(datetime_slot, '%Y-%m-%d') as date_str,
    DATE_FORMAT(datetime_slot, '%H:%i') as time_str,
    ROUND(MAX(block_apparent_energy * 0.4), 2) as total_apparent_kvah,
    ROUND(MAX(block_active_energy * 0.4), 2) as total_active_kwh
  FROM prolt_load_data 
  WHERE DATE_FORMAT(datetime_slot, '%Y-%m-%d') IN (?)
    AND meter_number = ?
  GROUP BY datetime_slot, date_str, time_str
  ORDER BY datetime_slot ASC
  ```
- **Error Handling:** Errors return empty `Map<string, number>` without interrupting caller execution.
- **Proposed Java Client Approach:** Spring Boot Secondary `DataSource` configured with HikariCP connecting via MySQL Connector/J (`com.mysql.cj.jdbc.Driver`) and queried using Spring `JdbcTemplate`.

---

### 2.8 Distributed Redis Cache
- **Calling File:** [`backend/src/config/redis.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/redis.ts)
- **Purpose:** High-speed in-memory caching of complex 96-time-block landed cost models and market operations comparisons.
- **Client Library:** `ioredis` (`^5.4.1`).
- **Connection URL:** `process.env.REDIS_URL` (default: `redis://localhost:6379`).
- **Retry Strategy:** Max 3 retries; after 3 retries, caching is **silently disabled** (`isRedisConnected = false; return null;`).
- **Key Operations Used:**
  - `redis.get(key)`
  - `redis.set(key, JSON.stringify(val), 'EX', ttlSeconds)` (default TTL: `86400` s / 24 hours)
  - `redis.keys(pattern)` & `redis.del(...keys)` (Cache pattern invalidation)
- **Proposed Java Client Approach:** **Spring Data Redis** with Jedis or Lettuce client, using `@Cacheable` and `RedisTemplate<String, Object>`.

---

### 2.9 Primary & Standby PostgreSQL Relational Databases
- **Calling File:** [`backend/src/config/prisma.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts)
- **Purpose:** Core persistence for users, datasets, regulatory tables, and forecasting models.
- **Client Library:** `@prisma/client` (`^5.22.0`).
- **Connection URLs:**
  - Primary: `DATABASE_URL`
  - Backup: `BACKUP_DATABASE_URL`
- **Failover Architecture:** Transparent JavaScript `Proxy` intercepts `$connect()`. If `DATABASE_URL` fails, disconnects and reconnects to `BACKUP_DATABASE_URL`.
- **Proposed Java Client Approach:** Native multi-host JDBC failover configured in standard HikariCP connection URL:
  `jdbc:postgresql://primary-host:5432,standby-host:5432/Prolt_Operations?targetServerType=primary`

---

### 2.10 SMTP Mail Server (Nodemailer)
- **Calling Files:**
  - [`backend/src/modules/auth/otp.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts)
  - [`backend/src/services/email-alert.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts)
- **Purpose:** One-Time Passwords for user authentication; daily operational alert emails for missing Resource Center charges.
- **Transport / Protocol:** SMTP (Simple Mail Transfer Protocol).
- **Credentials:** Sourced from `SMTP_HOST`, `SMTP_PORT` (default `587`), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- **Proposed Java Client Approach:** **Spring Boot Starter Mail** (`JavaMailSender`) with Thymeleaf or Freemarker HTML email templates.

---

### 2.11 IEX Landed Cost Calculator External Microservice
- **Calling File:** [`backend/src/modules/landing-price-calc/landing-price-calc.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts)
- **Purpose:** Proxies calculations to official IEX calculator API endpoint to verify landed cost against exchange benchmarks.
- **Target URL:** `${IEX_CALCULATOR_API_URL}/api/v1/calculator` (default: `https://www.iexindia.com/api/v1/calculator`).
- **HTTP Method:** `GET`
- **Query Parameters:** `voltage`, `state`, `consumerCategory`, `todMonth`, `todSlot`, `iexPrice`.
- **Error Handling:** Rejection bubbles up to global error handler.
- **Proposed Java Client Approach:** Spring `RestClient` or OpenFeign client.

---

## 3. Summary of External Integrations & Proposed Java Clients

| External System | Current Node.js Driver / Client | Proposed Java / Spring Boot Equivalent | Migration Effort |
|---|---|---|---|
| **IEX Official Portal** | Puppeteer (Chromium Headless) | Playwright for Java / Headless Chromium | High |
| **IEX Trade Data Service** | Python `requests` in `up_market_sync.py` | Spring `RestClient` / `WebClient` | Low |
| **National Power Portal (NPP)**| Axios + custom HTTPS Agent (TrustAll) | Spring `RestClient` + custom SSLContext | Low |
| **Vidyut Pravah Portal** | Axios (JSON) + Puppeteer (HTML) | Spring `RestClient` + Playwright for Java | Medium |
| **Open-Meteo Weather API** | Axios + `axios-retry` | Spring `RestClient` + Resilience4j | Low |
| **StarRocks OLAP Database** | `mysql2/promise` (Connection Pool) | Secondary `DataSource` (MySQL Connector/J + HikariCP) | Low |
| **Redis Distributed Cache** | `ioredis` (`Redis.get`, `Redis.set`) | Spring Data Redis (`RedisTemplate` / Lettuce) | Low |
| **PostgreSQL Database** | Prisma Client (with JS Proxy Failover) | Spring Data JPA + Multi-Host JDBC URL | Low |
| **SMTP Mail Server** | `nodemailer` | `JavaMailSender` (`spring-boot-starter-mail`) | Low |
| **IEX Calculator API** | Axios | Spring `RestClient` | Low |
| **Outbound Webhooks** | Axios (`Promise.all`) | Spring `RestClient` with Virtual Threads | Low |

---

## 4. Open Questions & Integration Observations

1. **Bypassing Government Portal SSL (`rejectUnauthorized: false`):** [`backend/src/services/scraper.service.ts:L11`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts#L11) disables SSL verification to scrape NPP and Vidyut Pravah. In enterprise Java environments, trusting all certificates requires an explicit custom `TrustStrategy`. Should a corporate certificate authority (CA) bundle be configured instead?
2. **Hardcoded External Tokens:** The token `NCLIEXHkl7900@8Uyhkj` is hardcoded as default in [`backend/scripts/up_market_sync.py:L21`](file:///Users/yashgupta/IEX-Dashboard/backend/scripts/up_market_sync.py#L21) and the StarRocks password `Probus@123` is hardcoded in [`backend/src/services/starrocks.service.ts:L12`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L12). These should be externalized strictly to AWS Secrets Manager, HashiCorp Vault, or environment variables.
3. **Puppeteer Container Footprint:** Headless Chromium requires substantial container resources (~500MB RAM and browser dependencies like `libnss3`). Moving to Java Playwright requires installing Chromium in the Docker container, or offloading scrapers to a dedicated scraping microservice.
