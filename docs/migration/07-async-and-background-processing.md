# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 07: Asynchronous & Background Processing

## 1. Executive Summary & Verification Check
This document analyzes all asynchronous operations, scheduled background jobs, concurrency models, timeouts, and process execution patterns in the **Prolt Energy / IEX Analytics Dashboard**.

### Batch 2 Processing Checklist Verification
- **Every Cron Job / Scheduler:** All 11 schedules cataloged from [`backend/src/services/cron.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts).
- **Queues, Event Emitters, WebSockets, SSE:** Exhaustively analyzed against active source code.
- **Async / Event-Loop Behavior:** Cataloged with file paths, concurrency risks, and timeouts.
- **Target Java Mapping:** Spring `@Scheduled`, Virtual Threads (Project Loom), `CompletableFuture`.

---

## 2. Scheduled Background Jobs & Cron Catalog

All scheduled jobs are declared in [`backend/src/services/cron.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts) using the `node-cron` package.
The scheduler executes **only if `config.runScraper === true`** (controlled by `process.env.RUN_SCRAPER`). All schedules explicitly enforce the `Asia/Kolkata` timezone.

### 2.1 Complete Job Schedule Catalog (11 Jobs)

| Job Index | Cron Expression | Schedule Description | Method / Script Invoked | Purpose & Processing Logic | Retry & Concurrency Model |
|---|---|---|---|---|---|
| **1** | `0 10 * * *` | Daily at 10:00 AM (IST) | [`checkAndSendDailyChargeAlerts()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts#L30) | Checks `StateCharges`, `StateTariff`, `CtuCharges`, `IstsCharges` for the current month. If any active state has missing rates, dispatches an alert email to operations. | Skipped in `dev` (`NODE_ENV === 'development'`). No automatic retry; re-runs next day. In-memory execution. |
| **2** | `*/5 * * * *` | Every 5 minutes | [`VidyutPravahScraper.scrapeStateDemand()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts) | Scrapes real-time demand met for all Indian states from Vidyut Pravah and saves records into `StateDemandData`. | Fire-and-forget inside cron callback. Errors logged via `console.error`. |
| **3** | `0 * * * *` | Hourly at minute 00 | [`WeatherEngine.updateHourlyForecast()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts) | Calls AccuWeather API for monitored cities; parses temperature, cloud cover, humidity; upserts into `WeatherForecastHourly`. | No retry. Logs error on network or API quota exhaustion. |
| **4** | `*/30 * * * *` | Every 30 minutes | [`ScraperService.scrapeRtm()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts) | Headless browser scraper for IEX Real-Time Market (RTM) half-hourly clearing snapshot. Persists records to `Dataset` and `RtmRecord`. | Logs execution to `ApiLog` table with status `SUCCESS` or `ERROR`. |
| **5** | `0 0 * * *` | Daily at 12:00 AM Midnight (IST) | [`WeatherEngine.updateDailyHistorical()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts) & `updateDailyForecastSummary()` | Archives yesterday's actual weather parameters and aggregates 24-hour forecast summaries in `WeatherHistorical`. | Sequential execution inside midnight cron callback. |
| **6** | `0 2 1 * *` | Monthly on 1st at 2:00 AM (IST) | [`seedCtuCharges()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/scripts/seed-ctu.ts) | Auto-populates Central Transmission Utility (CTU) national and regional transmission loss percentages and charges for the new month. | Single execution per month. |
| **7** | `0 7 * * *` | Daily at 7:00 AM (IST) | [`VidyutPravahScraper.getNppDemandData()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts) & `getNppGenerationData()` | Ingests previous day's final National Power Portal demand and generation; runs `NppAdjustmentService` to normalize 96 blocks. | Sequential pipeline: Demand -> Generation -> Demand Adjustment -> Generation Adjustment -> Hourly Weather. |
| **8** | `0 7 * * *` | Daily at 7:00 AM (IST) | [`ScraperService.scrapeDam()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts) & `scrapeGdam()` | Scrapes official IEX website for tomorrow's Day-Ahead Market (DAM) and Green Day-Ahead Market (GDAM) clearing prices across 96 time blocks. | Atomic transaction via `PersistenceService.persistDataset`. Auto-replaces existing record if duplicate found. Logs to `ApiLog`. |
| **9** | `*/4 * * * *` | Every 4 minutes | [`VidyutPravahScraper.getNppDemandData()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts) | High-frequency polling of NPP real-time demand and generation for `[today, yesterday]`. Inserts into `NppRawDemandData` with `skipDuplicates: true`. | Runs linear interpolation adjustment immediately after insert via `NppAdjustmentService.updateAdjustedDemandForDate()`. |
| **10** | `5 0 * * *` | Daily at 12:05 AM (IST) | [`ForecastService.getMarketSelectionForecast()`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/forecast/forecast.service.ts) | Fetches ML model market procurement recommendations for the next 7 days (`tomorrowStr` to `endDateStr`). | Caches forecast matrices in PostgreSQL. |
| **11a** | `*/30 * * * *` | Every 30 minutes | `child_process.exec("python3 up_market_sync.py --market RTM")` | Spawns external Python process executing direct SOAP API calls to IEX for UP RTM market telemetry. | Resolves virtual environment python binary (`venv/bin/python3` or system `python3`). Asynchronous process spawn. |
| **11b** | `0 7 * * *` | Daily at 7:00 AM (IST) | `child_process.exec("python3 up_market_sync.py --market DAM")` | Spawns external Python script fetching UP DAM clearing data. | Asynchronous process spawn. Output logged to standard console. |
| **11c** | `15 7 * * *` | Daily at 7:15 AM (IST) | `child_process.exec("python3 up_market_sync.py --market GDAM")` | Spawns external Python script fetching UP GDAM clearing data. | Asynchronous process spawn. |
| **11d** | `0 2 * * *` | Daily at 2:00 AM (IST) | `child_process.exec("bash db_backup.sh")` | Executes PostgreSQL database backup script, compresses with `gzip`, and prunes backups older than 7 days. | Asynchronous child process. |

---

## 3. Message Queues, Streams, WebSockets & Worker Threads

### 3.1 Message Queues
- **Codebase Reality:** There are **zero message queues** (Bull, BullMQ, RabbitMQ, Kafka, SQS, Celery) in the Node.js application.
- **Architectural Consequence:** All background workloads execute within the single Node.js main thread or are delegated to subshell child processes (`child_process.exec` / `child_process.execFileSync`).
- If an hourly Puppeteer scrape or heavy calculation takes significant CPU time, it can degrade HTTP event-loop response latency for other concurrent users.

### 3.2 WebSockets & Server-Sent Events (SSE)
- **Codebase Reality:** There are **no WebSockets** (`ws`, `socket.io`) and **no Server-Sent Events (SSE)** implemented in the backend.
- The client React application polls endpoints periodically via TanStack React Query (`refetchInterval`).

### 3.3 Streams
Streams are utilized in three specific areas:
1. **Database Seeding (`csv-parser`):** [`backend/prisma/seed.ts:L49-L54`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L49-L54) streams large tariff CSVs via `fs.createReadStream().pipe(csvParser())` to prevent high memory allocation.
2. **Database Backup Compression:** [`backend/scripts/db_backup.sh:L23`](file:///Users/yashgupta/IEX-Dashboard/backend/scripts/db_backup.sh#L23) pipes `pg_dump` output directly to `gzip`.
3. **Excel Workbook Download:** [`exceljs`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.export.ts) writes `.xlsx` workbooks directly to the Express `res` writable stream.

### 3.4 Worker Threads
- **Codebase Reality:** Node.js `worker_threads` are **not utilized**.
- CPU-intensive tasks (e.g. Word document proposal generation) are offloaded to Python scripts using synchronous child processes:
  [`backend/src/modules/proposal/proposal.service.ts:L99`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L99):
  `execFileSync(pythonExecutable, [scriptPath, tmpInputPath], { encoding: 'utf-8' })`.

---

## 4. Concurrency, Event-Loop & Async/Await Mechanics

### 4.1 Usage of `Promise.all` (Parallel Execution)
The codebase uses `Promise.all` in 8 performance-critical locations to parallelize non-dependent asynchronous I/O:
1. **Webhook Notification Dispatch ([`backend/src/utils/webhook-dispatcher.ts:L26`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/webhook-dispatcher.ts#L26)):**
   Dispatches HTTP notifications to all configured subscriber URLs simultaneously.
2. **Multi-Model Price Forecasting ([`backend/src/modules/forecast/forecast.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/forecast/forecast.service.ts)):**
   Pulls predictions from multiple machine learning model iterations concurrently.
3. **Dataset Listing & Row Counting ([`backend/src/modules/dataset/dataset.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.service.ts)):**
   Executes `prisma.dataset.findMany()` and `prisma.dataset.count()` in parallel.
4. **Log Aggregation ([`backend/src/modules/api-log/api-log.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/api-log/api-log.service.ts)):**
   Calculates total logs, success counts, and error counts in parallel database queries.
5. **Database Table Metrics ([`backend/src/modules/database/database.controller.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/database/database.controller.ts)):**
   Fetches counts across demand, generation, and weather tables concurrently.
6. **Trader Daily Load Meter Aggregations ([`backend/src/modules/trader-performance-daily/trader-performance-daily.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance-daily/trader-performance-daily.service.ts)):**
   Parallelizes interval summaries across days of the billing month.
7. **Scraper Batch Ingestion ([`backend/src/services/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts)):**
   Fetches state demand data across regional load dispatch centers simultaneously.
8. **IEX Interval Snapshot Fetching ([`backend/src/services/iex-scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/iex-scraper.service.ts)):**
   Processes multiple market trading sessions concurrently.

### 4.2 Timeouts & Deadlines
- **Graceful Shutdown Timeout:** 10,000 ms (`backend/src/server.ts:L55-L58`). If connections do not close within 10 seconds, `process.exit(1)` is invoked forcefully.
- **StarRocks Pool Connect Timeout:** 10,000 ms (`backend/src/services/starrocks.service.ts:L17`).
- **Webhook Dispatcher HTTP Timeout:** 30,000 ms (`backend/src/utils/webhook-dispatcher.ts:L17`).
- **UP Market Sync HTTP Timeout:** 120,000 ms (`backend/scripts/up_market_sync.py:L46`).
- **Puppeteer Navigation Timeout:** Default 30,000 ms on page navigation.

### 4.3 Race Conditions & Mitigation
1. **Concurrent Dataset Ingestion Race:**
   - *Risk:* Two operators upload the same market and delivery date at the same instant.
   - *Mitigation:* [`backend/src/modules/persistence/persistence.service.ts:L25-L57`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L25-L57) wraps dataset discovery and record creation inside a single `prisma.$transaction(async (tx) => ...)`. If an active dataset already exists and `action !== 'replace'`, the transaction aborts with `409 Conflict`.
2. **Cron Job Overlap (Long-Running Scrapers):**
   - *Risk:* An RTM scrape scheduled every 30 minutes takes longer than 30 minutes due to IEX website slowness, causing a second job to spawn concurrently.
   - *Current Codebase Vulnerability:* `node-cron` does not prevent overlapping executions. If Puppeteer hangs, multiple headless Chromium processes accumulate on the server, exhausting memory.

---

## 5. Proposed Java / Spring Boot Architecture

### 5.1 Spring Task Scheduling (`@Scheduled`)
Replace `node-cron` with Spring's native scheduling framework:
```java
@Configuration
@EnableScheduling
public class SchedulingConfiguration {

    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("iex-cron-");
        scheduler.initialize();
        return scheduler;
    }
}
```

```java
@Service
public class ScheduledMarketDataService {

    private final ScraperService scraperService;

    public ScheduledMarketDataService(ScraperService scraperService) {
        this.scraperService = scraperService;
    }

    // Daily 7:00 AM DAM Scraper (Asia/Kolkata)
    @Scheduled(cron = "0 0 7 * * *", zone = "Asia/Kolkata")
    @SchedulerLock(name = "scrapeDamJob", lockAtMostFor = "15m", lockAtLeastFor = "2m")
    public void runDailyDamScraper() {
        scraperService.scrapeAndPersistDam(LocalDate.now().plusDays(1));
    }

    // Every 4 minutes NPP Real-Time Polling
    @Scheduled(cron = "0 */4 * * * *", zone = "Asia/Kolkata")
    public void pollNppData() {
        scraperService.pollNppDemandAndGeneration();
    }
}
```

### 5.2 Clustered Concurrency Guard (ShedLock)
To prevent the cron overlap vulnerability and enable multi-node clustered deployment, integrate **ShedLock** backed by Redis:
```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class ShedLockConfiguration {
    @Bean
    public LockProvider lockProvider(RedisConnectionFactory connectionFactory) {
        return new RedisLockProvider(connectionFactory);
    }
}
```

### 5.3 Virtual Threads (Project Loom, Java 21)
Enable virtual threads in `application.yml`:
```yaml
spring:
  threads:
    virtual:
      enabled: true
```
All incoming HTTP requests and background `@Async` tasks will execute on lightweight virtual threads, scaling to thousands of concurrent calculation requests without thread pool exhaustion.

### 5.4 Replacement for Synchronous Python Execution
In the Node.js application, `ProposalService` blocks the thread calling Python `execFileSync`.
In Spring Boot, replace the Python script entirely with **Apache POI XWPF** (Java-native Word manipulation) or execute asynchronously via `CompletableFuture`:
```java
@Async
public CompletableFuture<byte[]> generateProposalAsync(ClientDataDTO dto) {
    byte[] docxBytes = apachePoiProposalGenerator.generate(dto);
    return CompletableFuture.completedFuture(docxBytes);
}
```

---

## 6. Open Questions & Asynchronous Observations

1. **Lack of Cron Overlap Protection in Node.js:** The existing `node-cron` tasks have no locking mechanism. If the IEX portal is unresponsive, multiple Puppeteer instances will spawn and crash the container due to out-of-memory errors. The Spring Boot migration must use ShedLock or Quartz.
2. **Synchronous Subprocess Blocking:** `ProposalService.generateProposal` calls `execFileSync`, which halts the Node.js worker process until Python completes. In Java, this should be written natively in Java with Apache POI to eliminate Python runtime dependencies in production.
3. **Background Job Failure Visibility:** If a cron job fails, it currently logs to console (`console.error`). There is no Dead Letter Queue (DLQ) or alerting mechanism other than the daily 10:00 AM email alert. A centralized alerting service (e.g. Sentry / Micrometer Alerting) should be integrated.
