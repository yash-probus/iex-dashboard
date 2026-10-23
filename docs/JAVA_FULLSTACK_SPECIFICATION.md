# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
## End-to-End Java Fullstack Architecture & Engineering Specification

---

## 1. Executive Summary & Domain Overview

### 1.1 Platform Purpose
The **Prolt Energy / IEX Analytics Dashboard** is an enterprise-grade power trading, portfolio optimization, and tariff analytics platform. It ingests high-frequency data from the **India Energy Exchange (IEX)**, **National Power Portal (NPP)**, state load dispatch centers (SLDCs), and weather services to provide:
1. **Exchange Market Analytics:** Real-time and historical analysis of Day-Ahead Market (DAM), Green Day-Ahead Market (GDAM), Real-Time Market (RTM), and Renewable Energy Certificates (REC).
2. **Open Access Financial Calculators:** Comprehensive landed cost of power calculation comparing grid tariff against open-access procurement from power exchanges (including CTU, STU, wheeling charges, cross-subsidy surcharge (CSS), additional surcharge (AS), banking, and electricity duty).
3. **Forecasting Engine:** Machine-learning-driven 96-time-block price and demand predictions for market procurement decisions.
4. **Trader Performance Benchmarking:** Actual vs. planned procurement margin, volume, and cost tracking.
5. **Automated Enterprise Reporting:** Generating client proposals in Microsoft Word (`.docx`) and high-volume data sheets in Microsoft Excel (`.xlsx`).

### 1.2 Core Domain Concepts (Indian Electricity Market)
- **Time Block:** The standard operational unit of the Indian grid is **15 minutes**. A single 24-hour day consists of exactly **96 time blocks**:
  - Block 1: `00:00 - 00:15`
  - Block 2: `00:15 - 00:30`
  - ...
  - Block 96: `23:45 - 24:00`
- **MCP (Market Clearing Price):** Price discovered on the exchange in Rs/MWh or Rs/kWh.
- **MCV (Market Clearing Volume):** Total volume cleared in MW or MWh.
- **Purchase Bid & Sell Bid:** Total demand (buy) and generation (sell) bids submitted by market participants.
- **Regional Bid Areas:**
  - `N1`: Haryana, Rajasthan, Delhi, Punjab, HP, J&K
  - `N2`: Uttar Pradesh (UP), Uttarakhand
  - `N3`: Punjab
  - `W1`, `W2`, `W3`: Western Region (Maharashtra, Gujarat, MP, Chhattisgarh, Goa)
  - `S1`, `S2`, `S3`: Southern Region (Andhra, Telangana, Karnataka, Tamil Nadu, Kerala)
  - `E1`, `E2`: Eastern Region (Bihar, Jharkhand, West Bengal, Odisha)
  - `A1`, `A2`: North-Eastern Region

---

## 2. Target Technology Stack

### 2.1 Backend (Java Enterprise)
- **Runtime & Language:** Java 21 (LTS) - Utilizing Project Loom Virtual Threads for high I/O throughput.
- **Framework:** Spring Boot 3.3.x or 3.4.x.
- **Security:** Spring Security 6 with stateless JWT authentication, password hashing (`BCrypt`), and Role-Based Access Control (RBAC).
- **ORM / Persistence:** Spring Data JPA (Hibernate 6) + Spring `JdbcTemplate` for high-speed batch operations.
- **Database:** PostgreSQL 16+ with dual schemas (`public` and `forecasting`).
- **Connection Pool:** HikariCP (configured for high concurrency).
- **Caching:** Spring Data Redis (`@Cacheable`, RedisTemplate).
- **Scheduling:** Spring `@Scheduled` / Quartz Scheduler for reliable clustered task execution in the `Asia/Kolkata` timezone.
- **Office Document Processing:** 
  - **Excel:** Apache POI (`SXSSFWorkbook` streaming parser and generator to avoid memory bottlenecks).
  - **Word DOCX:** Apache POI XWPF or `docx4j` for dynamic contract/proposal generation.
- **API Documentation:** SpringDoc OpenAPI 3 (`springdoc-openapi-starter-webmvc-ui` at `/swagger-ui.html`).
- **Build Tool:** Apache Maven 3.9+ or Gradle 8.8+.

### 2.2 Frontend (Single Page Application)
- **Framework:** React 18+ with TypeScript (or Next.js 14+ App Router).
- **Build Tool:** Vite 5+.
- **UI Libraries:** Tailwind CSS + Material UI (MUI v5) / Shadcn UI components.
- **Data Visualization & Charts:** Recharts and Chart.js (custom 96-time-block step, line, and dual-axis bar charts).
- **State & Server Cache:** TanStack Query (React Query v5) + Axios interceptors for automatic JWT refresh.
- **Icons:** Lucide React & MUI Icons.

---

## 3. Database Architecture & Schema Specification

The PostgreSQL database utilizes two schemas:
1. `public`: Application users, master configurations, exchange records, scrapers, calculators, and trader performance.
2. `forecasting`: ML model outputs, day-ahead/nowcast price predictions, and grid demand forecasts.

### 3.1 Multi-Schema Configuration in Spring Boot
In Spring Boot, entity mapping handles schemas explicitly:
```java
@Entity
@Table(name = "exchange_dam_rate", schema = "public")
public class ExchangeDamRate { ... }

@Entity
@Table(name = "dam_forecasting", schema = "forecasting")
public class DamForecasting { ... }
```

### 3.2 Complete Entity Catalog

#### A. User & Access Control
- `User`: `id` (UUID), `username` (VARCHAR 50, UNIQUE), `email` (VARCHAR 255, UNIQUE), `passwordHash` (VARCHAR 255), `role` (`SUPER_ADMIN`, `ADMIN`, `CLIENT`), `hiddenModules` (VARCHAR[]), `readOnlyModules` (VARCHAR[]), `createdAt`, `updatedAt`.
- `UserAuditLog`: `id`, `action`, `targetUserId`, `targetUser`, `performedBy`, `changes` (JSONB), `timestamp`.
- `AuditLog`: `id`, `tableName`, `recordId`, `action`, `oldData` (JSONB), `newData` (JSONB), `userId`, `createdAt`.

#### B. Market Data & Uploads
- `Dataset`: `id` (UUID), `market` (`DAM`, `GDAM`, `RTM`, `REC`), `deliveryDate` (DATE), `fileName` (VARCHAR 255), `status` (`ACTIVE`, `REPLACED`, `DELETED`), `uploadedAt`, `createdAt`, `updatedAt`.
- `UploadHistory`: `id`, `datasetId`, `market`, `deliveryDate`, `action` (`UPLOAD`, `REPLACE`, `DELETE`), `timestamp`.
- `DamRecord`: `id`, `datasetId`, `intervalNumber` (SMALLINT, 1-96), `intervalTime` (VARCHAR 15, e.g. "00:00-00:15"), `purchaseBid` (DECIMAL 18,4), `sellBid` (DECIMAL 18,4), `mcv` (DECIMAL 18,4), `fsv` (DECIMAL 18,4), `mcp` (DECIMAL 18,4), `date` (VARCHAR 10). *Unique constraint on `(datasetId, intervalNumber)`*.
- `GdamRecord` & `GdamNewRecord`: `id`, `datasetId`, `intervalNumber`, `intervalTime`, `purchaseBid`, `sellBidTotal`, `sellBidHydro`, `sellBidWind`, `sellBidOtherRE`, `sellBidDRE`, `mcvTotal`, `mcvHydro`, `mcvWind`, `mcvOtherRE`, `mcvDRE`, `fsvTotal`, `fsvHydro`, `fsvWind`, `fsvOtherRE`, `fsvDRE`, `mcp`, `date`.
- `RtmRecord`: `id`, `datasetId`, `intervalNumber`, `intervalTime`, `sessionId` (VARCHAR 50), `purchaseBid`, `sellBid`, `mcv`, `fsv`, `mcp`, `date`.
- `RecRecord`: `id`, `datasetId`, `buyBids`, `clearedPrice`, `clearedVolume`, `month`, `noOfParticipants`, `sellBids`, `type` (Solar/Non-Solar), `year`.
- `StateMarketRecord`: `id`, `market`, `area` (VARCHAR 100), `deliveryDate`, `intervalNumber`, `intervalTime`, `purchaseBid`, `sellBid`, `clearedVolume`, `price`, `createdAt`, `updatedAt`.

#### C. State & Exchange Direct Rate Tables (Populated by Scrapers)
- `exchange_dam_rate`: `id` (SERIAL), `date` (DATE), `intervalTime` (TIME), `mcp` (DECIMAL 10,2), `mcv` (DECIMAL 15,2), `purchaseBid` (DECIMAL 15,2), `sellBid` (DECIMAL 15,2), `state` (VARCHAR 50), `updated_at` (TIMESTAMPTZ). *Unique on `(date, intervalTime, state)`*.
- `exchange_gdam_rate`: Same schema as above. *Unique on `(date, intervalTime, state)`*.
- `exchange_rtm_rate`: Same schema as above. *Unique on `(date, intervalTime, state)`*.
- `market_operation`: `id` (UUID), `date` (DATE), `timeblock` (INT, 1-96), `dam_mcp` (DECIMAL 10,4), `rtm_mcp` (DECIMAL 10,4), `gdam_mcp` (DECIMAL 10,4), `createdAt`, `updatedAt`. *Unique on `(date, timeblock)`*.

#### D. Resource Center (Master Configuration & Charges)
- `region_state`: `id` (SERIAL), `regional_grid`, `region_code`, `region_name`, `state_name`, `state_code` (UNIQUE), `state_or_ut` (`state`, `ut`), `updated_at`.
- `discom_list`: `id`, `code` (VARCHAR 20, UNIQUE), `legal_name` (VARCHAR 255, UNIQUE), `state_code`, `discom_type`, `updated_at`.
- `ists_charges`: `id`, `ists_loss_percent` (DECIMAL 6,4), `start_date` (DATE), `end_date` (DATE), `updated_at`. *Unique on `(start_date, end_date)`*.
- `ctu_charges`: `id`, `state` (VARCHAR 50), `month` (INT), `ctu_charges_rs_per_kwh` (DECIMAL 12,6), `updated_at`. *Unique on `(state, month)`*.
- `iex_fees`: `id`, `month` (INT, UNIQUE), `exchange_fees`, `exchange_fees_gst`, `nldc_application_fees`, `nldcSchedulingFees`, `sldcSchedulingFees`, `otherFixCharges`, `updated_at`.
- `prolt_margin`: `id`, `month` (INT), `customer_id` (VARCHAR 50), `trading_margin`, `trading_margin_gst`, `prolt_margin`, `prolt_margin_gst`, `updated_at`. *Unique on `(month, customer_id)`*.
- `state_charges`: `id`, `state`, `category`, `sub_category`, `supply_voltage_category`, `voltage_level`, `from_date`, `to_date`, `demand_fixed_charge_kva_per_month_rs`, `cross_subsidy`, `distribution_wheeling_charges`, `stu_charges`, `stu_loss_percent`, `wheeling_loss_percent`, `additional_charge`, `discom`, `updated_at`.
- `state_tariff`: `id`, `month`, `state`, `sub_category`, `base_energy_rate`, `base_energy_unit`, `consumer_category`, `energy_rate`, `supply_voltage`, `supply_voltage_category`, `tod_charge_percent`, `tod_start_time`, `tod_end_time`, `discom`, `consumption_month`, `updated_at`.
- `fppa_charges`: `id`, `state`, `month`, `fppa_charge_percent`, `discom`, `billing_month`, `updated_at`. *Unique on `(state, discom, month)`*.
- `dsm_charges`: `id`, `state`, `month`, `dsm_charges_rs_per_kwh`, `updated_at`. *Unique on `(state, month)`*.

#### E. Savings Calculators & Trader Performance
- `savings_calculator_entries` & `savings_calculator_new_entries`:
  - `id` (UUID)
  - `client_name`, `industry_name`, `address`
  - `sanctioned_load_kw` (DECIMAL 12,4)
  - `billed_demand_kv` (DECIMAL 12,4)
  - `state_code`, `discom`, `consumer_category`, `voltage_level`
  - `tod_consumptions` (JSONB)
  - `prolt_margin`, `trader_margin`, `metering_charges`, `consultancy_fee`, `probus_platform_fee`
  - `apply_electricity_duty` (BOOLEAN, default TRUE)
  - `power_factor` (DECIMAL 5,4)
  - `arrear_amount`, `current_lpsc`, `bill_date`
  - `createdBy`, `updatedBy`, `created_at`, `updated_at`
- `savings_calculator_entry_histories` & `savings_calculator_new_entry_histories`:
  - Complete versioned audit clone of the entry table including `entry_id`, `version`, `changed_at`.
- `trader_performance_entries` & `trader_performance_actual_entries`:
  - Stores planned and actual client portfolio execution data, with corresponding `_histories` tables.

#### F. Forecasting Schema Entities (`forecasting`)
- `dam_forecasting`: `id`, `forecasting_for` (TIMESTAMP), `time_block` (SMALLINT, 1-96), `model_number` (INT), `forecast_date` (TIMESTAMP), `predicted_mcp` (DECIMAL 18,4), `confidence_pct`, `price_range`.
- `gdam_forecasting`: `id`, `date`, `intervalNumber`, `intervalTime`, `purchaseBid`, `sellBid`, `mcv`, `fsv`, `mcp`.
- `rtm_dayahead` & `rtm_nowcast`: `id`, `date`, `intervalNumber`, `intervalTime`, `forecastingFor`, `forecastDate`, `predictedMcp`, `predictedMcpP10`, `predictedMcpP50`, `predictedMcpP90`, `confidence`, `price_range`, `modelVersion`.
- `all_india_demand_forecasting`: `id`, `date`, `hour`, `intervalNumber`, `timeBlock`, `forecastedDemand`, `actualDemand`.
- `Generation_forecasting`: `id`, `forecast_generated_at`, `forecast_for_timestamp`, `source`, `forecast_mw`, `model_name`, `model_version`.

#### G. Grid Demand, Weather & Operations Logs
- `NppRawDemandData`, `NppRawGenerationData`, `NppAdjustedDemandData`, `NppAdjustedGenerationData`: National grid actual demand met and fuel-wise generation (Thermal, Gas, Nuclear, Hydro, Wind, Solar).
- `StateDemandData`: Vidyut Pravah 15-minute demand and price.
- `CityStateData`, `WeatherForecast`, `WeatherForecastHourly`, `WeatherHistorical`, `historical_weather`: Open-Meteo & AccuWeather temperature, solar radiation, wind speed, cloud cover, and rainfall.
- `HolidayCalendar`: State-wise gazetted and commercial holidays.
- `ApiLog`: Background sync audit status (`apiName`, `endpoint`, `status`, `details`, `createdAt`).

---

## 4. Complete REST API Specifications

All endpoints prefix with `/api`. Protected routes require Header: `Authorization: Bearer <JWT_TOKEN>`.

### 4.1 Authentication & User Management
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user (username/email + password), returns JWT & permissions | Public |
| `GET` | `/api/auth/me` | Fetch active user profile and accessible modules | Authenticated |
| `GET` | `/api/users` | List all users with assigned roles & module access | Admin / Super Admin |
| `POST` | `/api/users` | Create new client or admin user | Admin / Super Admin |
| `PUT` | `/api/users/{id}` | Update user credentials, role, `hiddenModules`, `readOnlyModules` | Admin / Super Admin |
| `DELETE`| `/api/users/{id}` | Delete user account (Super Admin protected) | Super Admin |
| `GET` | `/api/users/audit-logs`| Audit log history of user permissions and role changes | Admin / Super Admin |

#### Access Control Matrix
- `role`:
  - `SUPER_ADMIN`: Unrestricted system access.
  - `ADMIN`: User management and full CRUD on all resources.
  - `CLIENT`: Restricted access governed by `hiddenModules` and `readOnlyModules`.
- `hiddenModules`: Array of module IDs hidden from UI navigation (e.g. `['api-logs', 'database']`).
- `readOnlyModules`: Array of module IDs where user can only view.
  - Special flag: `"<module-id>-nodelete"` (e.g., `'savings-calculator-nodelete'`) grants **View & Edit**, but strictly **Blocks Deletion**.

---

### 4.2 Core Market Datasets & Uploads
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/uploads/{market}` | Upload CSV/Excel market file (`DAM`, `GDAM`, `RTM`, `REC`). Parses & persists 96 time blocks | Client (Edit) / Admin |
| `GET` | `/api/datasets` | List uploaded datasets with status, record count, and delivery date | Authenticated |
| `GET` | `/api/datasets/summary` | Aggregated high-level statistics per market type | Authenticated |
| `GET` | `/api/datasets/{datasetId}` | Fetch raw interval data (1-96 blocks) for a dataset | Authenticated |
| `DELETE`| `/api/datasets/{datasetId}` | Soft/Hard delete dataset and associated intervals | Client (Delete) / Admin |
| `GET` | `/api/upload-history` | Audit log of upload, replace, and delete operations | Authenticated |

---

### 4.3 Market Operations & Exchange Direct Rates
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/up-market/{market}` | Fetch regional & state-wise cleared rates (`market` = `DAM`, `GDAM`, `RTM`). Supports `state` filtering with regional aliases (`N1`, `N2`, `Haryana`, `UP`, `Punjab`) |
| `GET` | `/api/market-operations` | Compare MCP across DAM, GDAM, and RTM per timeblock |
| `POST` | `/api/market-operations/upload` | Upload daily Market Operations Excel file |

---

### 4.4 Resource Center Master Data
CRUD endpoints for grid and regulatory cost structures:
- `/api/resource-center/region-state`
- `/api/resource-center/discom-list`
- `/api/resource-center/ists-charges`
- `/api/resource-center/iex-fees`
- `/api/resource-center/ctu-charges`
- `/api/resource-center/state-charges`
- `/api/resource-center/state-tariff`
- `/api/resource-center/fppa-charges`
- `/api/resource-center/dsm-charges`
- `/api/resource-center/prolt-margin`

---

### 4.5 Savings Calculator Engines (Core Calculation Engine)

#### Routes:
- `/api/savings-calculator` (Legacy layout)
- `/api/savings-calculator-new` (Current modern layout)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/savings-calculator-new` | List client tariff analysis records |
| `POST` | `/api/savings-calculator-new` | Create client configuration entry |
| `GET` | `/api/savings-calculator-new/{id}`| Fetch single client entry |
| `PUT` | `/api/savings-calculator-new/{id}`| Update configuration and increment version |
| `DELETE`| `/api/savings-calculator-new/{id}`| Delete entry (enforces `savings-calculator-nodelete`) |
| `GET` | `/api/savings-calculator-new/{id}/calculate` | **Execute Full Tariff vs. Open Access Mathematical Model** |
| `GET` | `/api/savings-calculator-new/{id}/history` | Retrieve version history for audit comparison |
| `GET` | `/api/savings-calculator-new/{id}/export-excel` | Stream downloadable `.xlsx` workbook of 96-block landed costs |
| `POST` | `/api/proposal/generate` | Generate complete Microsoft Word `.docx` client proposal |

---

## 5. Mathematical & Business Logic Specification

### 5.1 Landed Cost of Open Access Power Formula
For any 15-minute time block $t$ and state $S$:

$$\text{Energy Price at Delivery} = \text{Exchange MCP}_t \quad (\text{Rs/kWh})$$

$$\text{ISTS Loss Adjusted Energy} = \frac{\text{Energy Price}}{1 - \text{ISTS Loss \%}}$$

$$\text{Transmission Charges} = \text{CTU Charge} + \text{STU Charge} \quad (\text{Rs/kWh})$$

$$\text{Wheeling & Distribution} = \frac{\text{Wheeling Charge}}{1 - \text{Wheeling Loss \%}} \quad (\text{Rs/kWh})$$

$$\text{Surcharges} = \text{Cross Subsidy Surcharge (CSS)} + \text{Additional Surcharge (AS)} + \text{FPPA Charge}$$

$$\text{Market Operations \& Margins} = \text{IEX Trading Fee} + \text{Application Fee} + \text{Prolt Margin} + \text{Trader Margin}$$

$$\text{Total Landed Cost}_t = \text{ISTS Loss Adjusted Energy} + \text{Transmission Charges} + \text{Wheeling} + \text{Surcharges} + \text{Margins}$$

$$\text{If Electricity Duty enabled:} \quad \text{Final Landed Cost}_t = \text{Total Landed Cost}_t \times (1 + \text{Electricity Duty \%})$$

### 5.2 DISCOM Grid Tariff Comparison & Net Savings
For the consumer category and voltage level:
- Base Energy Rate ($R_{base}$)
- Time of Day (TOD) Slot Multipliers ($M_{tod}$):
  - Normal Hours: $R_{tod} = R_{base}$
  - Peak Hours: $R_{tod} = R_{base} \times (1 + \text{TOD Charge \%})$
  - Off-Peak / Rebate Hours: $R_{tod} = R_{base} \times (1 - \text{TOD Rebate \%})$

$$\text{Net Savings per kWh}_t = R_{tod} - \text{Final Landed Cost}_t$$

$$\text{Total Monthly Net Savings (Rs)} = \sum_{t=1}^{N} \left( \text{Net Savings}_t \times \text{Consumption (kWh)}_t \right)$$

---

## 6. Background Schedulers & Data Ingestion

Implement in Java using Spring Task Scheduling (`@Scheduled`) with virtual threads or a dedicated ThreadPoolTaskScheduler configured with time zone `Asia/Kolkata`.

```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("iex-cron-");
        scheduler.initialize();
        return scheduler;
    }
}
```

### 6.1 Scheduled Jobs Catalog

| Job Name | Cron Expression | Execution Time | Functional Responsibility |
| :--- | :--- | :--- | :--- |
| **IEX RTM Sync** | `0 */30 * * * *` | Every 30 minutes | Calls IEX Trade Data API for Real-Time Market and updates `exchange_rtm_rate`. |
| **IEX DAM Sync** | `0 0 7 * * *` | Daily at 7:00 AM IST | Ingests Day-Ahead Market All-India clearing rates and regional blocks into `exchange_dam_rate`. |
| **IEX GDAM Sync**| `0 15 7 * * *` | Daily at 7:15 AM IST | Ingests Green Day-Ahead Market clearing rates into `exchange_gdam_rate`. |
| **National Grid Sync** | `0 0 7 * * *` | Daily at 7:00 AM IST | Pulls All-India demand met and fuel generation breakdown from NPP & Vidyut Pravah. |
| **Weather Hourly Sync** | `0 0 * * * *` | Every 1 hour | Pulls solar radiation, wind speed, and temperature from Open-Meteo. |
| **Database Maintenance** | `0 0 2 * * *` | Daily at 2:00 AM IST | Runs automated vacuum and backup snapshot. |

### 6.2 Critical Rule for IEX Trade Data API
The official endpoint:
`https://www.iexindia.com/IEXPublish/AppServices.svc/IEXGetTradeData/`
- **Strict Limitation:** An API call **MUST NOT span more than 31 days** between `From_Date` and `To_Date`. Passing a wider range results in:
  `400 Bad Request: The "toDate" must not be more than 31 days from the "fromDate"`.
- **Implementation Requirement:** When syncing historical ranges (e.g. 5 years), the Java service **MUST** chunk the date intervals month-by-month (`01/MM/YYYY` to `LastDay/MM/YYYY`) and iterate sequentially.
- **Regional Aliasing:** When processing regional codes, persist both the code and the state aliases:
  - `N1` $\rightarrow$ `Haryana`
  - `N2` $\rightarrow$ `UP`, `Uttar Pradesh`, `Uttarakhand`
  - `N3` $\rightarrow$ `Punjab`

---

## 7. Document & File Processing Engines

### 7.1 Streaming Excel Generation (Apache POI)
For exporting 96-time-block datasets across a month (up to 2,976 rows $\times$ 50 columns):
- Use `org.apache.poi.xssf.streaming.SXSSFWorkbook` with a row window size of `100` (`new SXSSFWorkbook(100)`).
- This ensures consumed memory remains under **30 MB** even when generating massive workbooks, preventing JVM `OutOfMemoryError`.

### 7.2 Proposal Document Engine (`.docx`)
The proposal module generates corporate audit reports:
- Replace template variables: `{{CLIENT_NAME}}`, `{{SANCTIONED_LOAD}}`, `{{MONTHLY_SAVINGS}}`, `{{TARIFF_RATE}}`.
- Insert dynamic summary tables for monthly TOD cost breakdown.
- Embed chart graphics rendered via Java 2D (`BufferedImage` / JFreeChart) or server-side headless Chromium.

---

## 8. Deployment, Infrastructure & CI/CD

### 8.1 Docker Multi-Stage Build (`Dockerfile`)
```dockerfile
# --- Build Stage ---
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# --- Runtime Stage ---
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
ENV TZ=Asia/Kolkata
RUN apt-get update && apt-get install -y tzdata ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/backend-spring-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-Xms512m", "-Xmx2048m", "-jar", "app.jar"]
```

### 8.2 Docker Compose Stack (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  iex-postgres:
    image: postgres:16-alpine
    container_name: iex-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-Prolt_Operations}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  iex-redis:
    image: redis:7-alpine
    container_name: iex-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  iex-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: iex-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - iex-postgres
      - iex-redis
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://iex-postgres:5432/Prolt_Operations
      SPRING_DATA_REDIS_HOST: iex-redis
      JWT_SECRET: ${JWT_SECRET}

volumes:
  postgres_data:
```

---

## 9. Developer Hand-off Checklist & Acceptance Criteria

When delivering this project, the engineering team must satisfy the following checklist:
- [ ] **Data Model Validation:** PostgreSQL multi-schema setup (`public` and `forecasting`) boots cleanly with Spring Data JPA.
- [ ] **JWT & RBAC:** Users can authenticate; `SUPER_ADMIN`, `ADMIN`, and `CLIENT` roles function with exact `hiddenModules` and `readOnlyModules` (including `-nodelete` enforcement).
- [ ] **IEX Scraper Robustness:** DAM, GDAM, and RTM cron jobs execute at 7:00 AM, 7:15 AM, and every 30 minutes, handling the 31-day chunking limit without throwing HTTP 400.
- [ ] **State & Regional Mapping:** All queries for `Haryana`, `UP`, and `Punjab` match both regional codes (`N1`, `N2`, `N3`) and plain text state names.
- [ ] **Savings Calculator Correctness:** Landed cost calculation matches the mathematical model in Section 5 with zero precision loss using `BigDecimal`.
- [ ] **High-Volume Exports:** Excel export streams 96-interval data in `.xlsx` in under 3 seconds without memory degradation.
- [ ] **Interactive Swagger UI:** All endpoints documented and testable at `/swagger-ui/index.html`.
