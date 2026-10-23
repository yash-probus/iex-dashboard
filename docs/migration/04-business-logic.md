# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 04: Business Logic, Domain Services & Execution Flows

## 1. Executive Summary & Core Calculations
The business logic of the Prolt Energy platform addresses complex power market clearing, open access tariff calculations, and time-series demand predictions governed by Indian Central Electricity Regulatory Commission (CERC) and State Electricity Regulatory Commission (SERC) regulations.

### 1.1 The Standard 96-Time-Block Indian Grid System
The Indian electrical grid operates on a **15-minute dispatch interval**. A standard operational day is divided into **96 time blocks**:
- Block 1: `00:00 - 00:15`
- Block 2: `00:15 - 00:30`
- ...
- Block 96: `23:45 - 24:00`

All interval records for DAM, GDAM, and RTM align precisely to these 96 blocks.

### 1.2 Open Access Landed Cost Financial Engine
The core financial algorithm determines whether an industrial/commercial consumer saves money procuring power from the exchange (DAM/GDAM/RTM) versus their local distribution licensee (Discom).

$$\text{Landed Cost (Rs/kWh)} = \frac{\text{MCP} + \text{CTU Loss Adjustment}}{1 - \text{STU Loss}} + \text{STU Charges} + \frac{\text{Wheeling Charges}}{1 - \text{Wheeling Loss}} + \text{CSS} + \text{AS} + \text{Banking} + \text{Duty} + \text{IEX Fee} + \text{Margin}$$

Where:
- **$\text{MCP}$:** Market Clearing Price discovered on IEX (Rs/kWh).
- **$\text{CTU Charges & Losses}$:** Central Transmission Utility (national grid) transmission charges and inter-state losses.
- **$\text{STU Charges & Losses}$:** State Transmission Utility intra-state charges and transmission losses.
- **$\text{Wheeling Charges & Losses}$:** Discom distribution network wheeling tariff and technical losses.
- **$\text{CSS (Cross-Subsidy Surcharge)}$:** Statutory surcharge levied by state discoms to subsidize agricultural and domestic consumers.
- **$\text{AS (Additional Surcharge)}$:** Compensatory charge for discom stranded power purchase capacity.
- **$\text{Duty}$:** State electricity duty percentage or fixed per-unit levy.
- **$\text{IEX Fees & Prolt Margin}$:** Exchange transaction charges (0.02 Rs/kWh) and Prolt management fees.

---

## 2. Mermaid Sequence Diagrams for the 10 Core Flows

### 2.1 Flow 1: Authentication & OTP Verification Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Client / Trader / Admin
    participant AuthRouter as /api/auth
    participant Limiter as loginLimiter (Rate Limit)
    participant AuthService as AuthService
    participant OTPService as OtpService
    participant Prisma as PostgreSQL (User)
    participant SMTP as SMTP Mail Transport

    User->>AuthRouter: POST /api/auth/send-otp { email }
    AuthRouter->>Limiter: Check IP Rate Limit (10 req / 15m)
    Limiter->>AuthService: sendOtp(email)
    AuthService->>Prisma: findUnique({ where: { email } })
    Prisma-->>AuthService: User entity
    AuthService->>OTPService: generateAndSendOtp(email)
    OTPService->>SMTP: sendMail({ to: email, subject: "Your Prolt Login OTP", text: "..." })
    SMTP-->>OTPService: Sent confirmation
    AuthService-->>User: 200 OK { success: true, message: "OTP sent to email" }

    User->>AuthRouter: POST /api/auth/verify-otp { email, otp }
    AuthRouter->>AuthService: verifyOtp(email, otp)
    AuthService->>OTPService: validateOtp(email, otp)
    alt OTP Valid & Not Expired
        AuthService->>Prisma: findUnique({ where: { email } })
        AuthService->>AuthService: generateJwtToken(user, JWT_SECRET, "7d")
        AuthService-->>User: 200 OK { success: true, token: "JWT...", user: { role, permissions } }
    else OTP Invalid
        AuthService-->>User: 400 Bad Request { success: false, message: "Invalid or expired OTP" }
    end
```

---

### 2.2 Flow 2: Market Data Upload & Ingestion (DAM, GDAM, RTM, REC)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Operations
    participant UploadRouter as /api/uploads
    participant Multer as Multer (50MB Disk)
    participant Validator as validateUploadRequest
    participant UploadSvc as UploadProcessingService
    participant Factory as ParserFactory
    participant Transform as TransformationService
    participant Persist as PersistenceService
    participant DB as PostgreSQL Transaction

    Admin->>UploadRouter: POST /api/uploads (multipart/form-data: file, market, deliveryDate, action)
    UploadRouter->>Multer: Stream file to /app/uploads/<market>/
    Multer->>Validator: Validate market enum & deliveryDate ISO format
    Validator->>UploadSvc: processUpload({ market, deliveryDate, filePath, fileName, action })
    UploadSvc->>Factory: getParser(market)
    Factory-->>UploadSvc: DamExcelParser / GdamExcelParser / RtmParser / RecParser
    UploadSvc->>UploadSvc: parser.parse(filePath)
    UploadSvc->>Transform: transform(parserResult)
    Transform->>Transform: Validate 96 interval records & numeric conversions
    Transform-->>UploadSvc: transformationResult.records
    
    UploadSvc->>Persist: persistDataset({ market, deliveryDate, records, action })
    Persist->>DB: prisma.$transaction(async tx => ...)
    alt Duplicate Check (Active Dataset Exists for Date)
        alt action !== 'replace'
            Persist-->>Admin: 409 Conflict { message: "Dataset already exists. Use ?action=replace" }
        else action === 'replace'
            DB->>DB: tx.dataset.update(status: 'REPLACED')
            DB->>DB: tx.damRecord.deleteMany({ datasetId: oldId })
            DB->>DB: tx.dataset.create(newDataset, status: 'ACTIVE')
            DB->>DB: tx.damRecord.createMany(96 records)
            DB->>DB: tx.uploadHistory.create(action: 'REPLACE')
            DB-->>Persist: Commit Transaction
            Persist-->>Admin: 201 Created { datasetId, rowCount: 96, parsed: true }
        end
    end
```

---

### 2.3 Flow 3: IEX Scraping & Sync Pipeline
```mermaid
sequenceDiagram
    autonumber
    participant Cron as CronService (node-cron)
    participant ScraperSvc as ScraperService
    participant Browser as Puppeteer (Chromium)
    participant IEX as Official IEX Website (iexindia.com)
    participant Persist as PersistenceService
    participant ApiLog as ApiLogService
    participant DB as PostgreSQL (exchange_dam_rate)

    Cron->>ScraperSvc: Trigger 7:00 AM DAM/GDAM Scraper
    ScraperSvc->>Browser: puppeteer.launch({ executablePath: /usr/bin/chromium })
    Browser->>IEX: Navigate to Market Snapshot page
    IEX-->>Browser: Render dynamic Angular/ASP.NET tables
    Browser->>Browser: Extract 96-time-block MCP, MCV, purchaseBid, sellBid
    Browser-->>ScraperSvc: 96 interval rows
    Browser->>Browser: Close browser instance
    
    ScraperSvc->>Persist: persistDataset(market, tomorrowDate, records)
    Persist->>DB: Save dataset and exchange_dam_rate records
    ScraperSvc->>ApiLog: createLog('IEX DAM Scraper', url, 'SUCCESS', 'Saved 96 records')
    ApiLog->>DB: Insert ApiLog entry
```

---

### 2.4 Flow 4: Savings Calculator Landed Cost Computation & History Tracking
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client User
    participant Router as /api/savings-calculator
    participant CalcController as SavingsCalculatorController
    participant CalcSvc as SavingsCalculatorService
    participant Redis as Redis Cache
    participant DB as PostgreSQL (Resource Center & Exchange Rates)

    Client->>Router: POST /api/savings-calculator/:id/calculate { month: "Jan 2026", version: 1 }
    Router->>CalcController: calculate(req, res)
    CalcController->>CalcSvc: calculateSavings(id, month, version)
    CalcSvc->>Redis: getCache(`calc_${id}_${month}_v${version}`)
    alt Cache Hit
        Redis-->>CalcSvc: Cached Calculation JSON
        CalcSvc-->>Client: 200 OK (Instant Response)
    else Cache Miss
        CalcSvc->>DB: Fetch Client Entry (contractDemand, TOD profile, state, discom, voltage)
        CalcSvc->>DB: Fetch StateCharges, StateTariff, CTU, FPPA for month
        CalcSvc->>DB: $queryRawUnsafe("SELECT date, interval_time, mcp, mcv FROM exchange_dam_rate...")
        CalcSvc->>CalcSvc: Compute Discom Cost: Demand Charges + Energy Charges + TOD Surcharge
        CalcSvc->>CalcSvc: Compute Open Access Landed Cost per 96 intervals
        CalcSvc->>CalcSvc: Net Savings = Discom Total Cost - Open Access Landed Cost
        CalcSvc->>Redis: setCache(cacheKey, result, TTL: 86400)
        CalcSvc-->>Client: 200 OK { success: true, data: result }
    end
```

---

### 2.5 Flow 5: Savings Calculator New Client Tariff Comparison & Market Decision
```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Power Portfolio Analyst
    participant Router as /api/savings-calculator-new
    participant Svc as SavingsCalculatorNewService
    participant DB as PostgreSQL (Multi-Market Rates)

    Analyst->>Router: GET /api/savings-calculator-new/entries/:id/market-decision?month=Aug 2026
    Router->>Svc: calculateMarketDecision(id, month, version)
    Svc->>DB: Fetch client entry & consumption matrix
    Svc->>DB: Fetch simultaneous DAM, GDAM, and RTM interval prices
    loop For each 15-minute Time Block (1 to 96)
        Svc->>Svc: Calculate Landed Cost for DAM, GDAM, and RTM
        Svc->>Svc: Evaluate Renewable Purchase Obligation (RPO) benefit for GDAM
        Svc->>Svc: Decision Logic:
        alt GDAM Landed Price < DAM Landed Price
            Svc->>Svc: Recommend: "Procure GDAM (Green Day-Ahead)"
        else DAM Landed Price < Discom Grid Tariff
            Svc->>Svc: Recommend: "Procure DAM (Day-Ahead)"
        else Discom Grid Tariff is Lowest
            Svc->>Svc: Recommend: "Draw from Grid (Discom)"
        end
    end
    Svc-->>Analyst: 200 OK { marketDecision: 96 blocks with optimal source, landed costs, savings }
```

---

### 2.6 Flow 6: Trader Performance Upload, Actuals & Benchmark Analytics
```mermaid
sequenceDiagram
    autonumber
    actor Trader as Energy Trader
    participant Router as /api/trader-performance
    participant Controller as TraderPerformanceController
    participant Parser as parse_trade_report.py
    participant StarRocks as StarRocks Cluster (prolt_load_data)
    participant DB as PostgreSQL (TraderPerformanceActualEntry)

    Trader->>Router: POST /api/trader-performance/upload (PDF execution sheets)
    Router->>Controller: uploadTradeReports(req, res)
    Controller->>Parser: Execute Python PDF trade extractor (pdfplumber)
    Parser-->>Controller: Parsed Trade Rows (traded_mw, cleared_price, exchange_session)
    Controller->>StarRocks: getConsumerActualDemandMap(dates, meterNumber)
    StarRocks-->>Controller: 15-minute consumer metered energy (kWh/kVAh)
    Controller->>DB: prisma.$transaction(upsert actual entries & compute trading slippage)
    DB-->>Controller: Committed
    Controller-->>Trader: 200 OK { importedTrades: 120, slippageRs: -45000, marginAchieved: true }
```

---

### 2.7 Flow 7: Technical & Commercial Proposal DOCX Generation Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Sales as Sales Engineer
    participant Router as /api/proposals
    participant Svc as ProposalService
    participant PyScript as generate_commercial_proposal.py
    participant NodeFallback as PizZip / Docxtemplater Fallback
    participant WordDoc as Static Template (.docx)

    Sales->>Router: POST /api/proposals/generate-commercial { clientData }
    Router->>Svc: generateProposal(clientData, 'commercial')
    Svc->>Svc: Resolve Dynamic Defaults based on State & Voltage (e.g. UP 33kV NPCL vs Discom)
    Svc->>Svc: Prepare Temporary JSON Payload in os.tmpdir()
    
    alt Primary Execution: Python python-docx Engine
        Svc->>PyScript: execFileSync(python3, [scriptPath, tmpInputPath])
        PyScript->>WordDoc: Open COMMERCIAL PROPOSAL_33KV.docx
        PyScript->>WordDoc: Populate Aptos typography, Indian currency formatting, replace XXXXXXXXXXXXX
        PyScript-->>Svc: Generated .docx binary buffer
    else Fallback: Pure Node PizZip XML Replacement
        Svc->>NodeFallback: Read template ZIP, parse word/document.xml
        NodeFallback->>NodeFallback: Strip yellow highlights (<w:highlight/>), replace XML paragraphs
        NodeFallback-->>Svc: Generated .docx binary buffer
    end
    Svc-->>Sales: 200 OK (Content-Type: application/vnd.openxmlformats-officedocument...)
```

---

### 2.8 Flow 8: Day-Ahead & Nowcast Forecasting Data Retrieval
```mermaid
sequenceDiagram
    autonumber
    actor Dashboard as Executive Forecasting Dashboard
    participant Router as /api/forecast/price
    participant Svc as ForecastService
    participant DB as PostgreSQL (forecasting schema)
    participant StarRocks as StarRocks OLAP

    Dashboard->>Router: GET /api/forecast/price?startDate=2026-09-22&endDate=2026-09-23&modelNumber=1
    Router->>Svc: getPriceForecast(startDate, endDate, modelNumber)
    Svc->>DB: $queryRawUnsafe("SELECT DISTINCT ON (forecasting_for::date, time_block) * FROM forecasting.dam_forecasting...")
    DB-->>Svc: Deduplicated 96-block price predictions
    Svc->>DB: Fetch actual cleared exchange_dam_rate for same dates
    DB-->>Svc: Actual cleared MCPs
    Svc->>Svc: Calculate MAPE (Mean Absolute Percentage Error) & RMSE
    Svc-->>Dashboard: 200 OK { forecastVsActual: 96 blocks, mape: 3.42%, rmse: 0.18 }
```

---

### 2.9 Flow 9: Resource Center Master Configuration CRUD & Audit Trail
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Regulatory Admin
    participant Router as /api/resource-center/:resourceType
    participant Svc as ResourceCenterService
    participant DB as PostgreSQL
    participant AuditLog as AuditLog Table

    Admin->>Router: PUT /api/resource-center/state-charges/102 { crossSubsidy: 1.85, wheelingCharges: 0.72 }
    Router->>Svc: updateResourceRecord('state-charges', 102, data)
    Svc->>DB: prisma.$transaction(async tx => ...)
    DB->>DB: tx.stateCharges.findUnique({ where: { id: 102 } })
    DB-->>Svc: oldData snapshot
    DB->>DB: tx.stateCharges.update({ where: { id: 102 }, data })
    DB->>AuditLog: tx.auditLog.create({ tableName: 'state_charges', recordId: '102', action: 'UPDATE', oldData, newData })
    DB-->>Svc: Updated record
    Svc-->>Admin: 200 OK { success: true, data: updatedRecord }
```

---

### 2.10 Flow 10: National Power Portal (NPP) & Weather Historical Demand Adjustment
```mermaid
sequenceDiagram
    autonumber
    participant Cron as CronService (every 4 mins)
    participant Scraper as VidyutPravahScraper
    participant NPP as Vidyut Pravah & NPP Portals
    participant AdjustSvc as NppAdjustmentService
    participant Weather as WeatherEngine
    participant DB as PostgreSQL (NppRawDemandData & NppAdjustedDemandData)

    Cron->>Scraper: getNppDemandData(dateStr)
    Scraper->>NPP: HTTP GET Vidyut Pravah Telemetry API
    NPP-->>Scraper: JSON Demand Met Streams
    Scraper->>DB: prisma.nppRawDemandData.createMany(skipDuplicates: true)
    
    Cron->>AdjustSvc: updateAdjustedDemandForDate(dateStr)
    AdjustSvc->>DB: Fetch raw demand points for dateStr
    AdjustSvc->>AdjustSvc: Linear interpolation mapping asynchronous timestamps to 96 blocks
    AdjustSvc->>DB: prisma.nppAdjustedDemandData.upsert(96 normalized blocks)
    
    Cron->>Weather: updateHourlyForecast()
    Weather->>DB: Save hourly temperature and precipitation metrics
```

---

## 3. Hidden Rules, Fallbacks, Silent Catches & Magic Numbers

1. **Fallback Smart Meter ID:**
   - **File:** [`backend/src/services/starrocks.service.ts:L50`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L50)
   - **Rule:** If no consumer meter number is supplied in request parameters, the system defaults to `'X2521837'` without error.
2. **Smart Meter Energy Scaling Factor (`0.4`):**
   - **File:** [`backend/src/services/starrocks.service.ts:L56-L57`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L56-L57)
   - **Rule:** Raw StarRocks meter values are multiplied by `0.4` (`ROUND(MAX(block_apparent_energy * 0.4), 2)`) to convert 15-minute CT-PT pulsed energy to standard kVAh/kWh billing units.
3. **Silent Redis Caching Fallback:**
   - **File:** [`backend/src/config/redis.ts:L13-L16`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/redis.ts#L13-L16)
   - **Rule:** If Redis fails to connect after 3 retries, it logs a warning and silently disables caching without failing requests (`isRedisConnected = false; return null;`).
4. **Primary-to-Secondary Database Failover Proxy:**
   - **File:** [`backend/src/config/prisma.ts:L31-L57`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts#L31-L57)
   - **Rule:** Transparent `Proxy` intercepts `$connect()`. If `DATABASE_URL` fails, it switches `activeClient` to `BACKUP_DATABASE_URL` dynamically.
5. **Proposal Generator Dual-Engine Fallback:**
   - **File:** [`backend/src/modules/proposal/proposal.service.ts:L108-L113`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L108-L113)
   - **Rule:** If python-docx script execution fails or crashes, the system catches the error silently and executes a pure Node.js PizZip template XML replacement fallback.
6. **Hardcoded State & Voltage Equipment Defaults in Proposals:**
   - **File:** [`backend/src/modules/proposal/proposal.service.ts:L51-L76`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L51-L76)
   - **Rules:**
     - Non-UP default: Supply Rs 4,50,000; Service Rs 3,50,000; Liaison Rs 3,00,000; Smart Rs 1,25,000.
     - UP default: Liaison Rs 3,95,000; Smart Rs 1,70,000.
     - UP 33kV NPCL: Supply Rs 8,45,000; Service Rs 3,58,000; Indoor CT-PT count: `"2 Nos."`.
     - UP 33kV non-NPCL: Supply Rs 7,45,000; Service Rs 3,58,000.
     - UP 11kV (All Discoms): Supply Rs 5,65,000; Service Rs 3,38,000.
7. **Strict 96-Record Constraint in Persistence:**
   - **File:** [`backend/src/modules/persistence/persistence.service.ts:L20-L22`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L20-L22)
   - **Rule:** Persisting DAM or GDAM datasets strictly requires `records.length === 96`. If less or more, transaction rejects with 400 Bad Request.
