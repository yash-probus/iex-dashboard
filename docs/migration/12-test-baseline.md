# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 12: Test Baseline & Parity Verification Strategy

## 1. Executive Summary & Verification Check
This document establishes the test baseline of the existing **Prolt Energy / IEX Analytics Dashboard** codebase and specifies the complete parity testing strategy required to guarantee bug-for-bug functional equivalence during the migration to **Java 21 / Spring Boot 3.x**.

---

## 2. Inventory of Existing Tests & Code Coverage Analysis

### 2.1 Test Framework & Runner Setup
- **Test Runner:** Jest (`jest ^30.4.2`) with `ts-jest ^29.4.12` declared in [`backend/package.json:L83, L87`](file:///Users/yashgupta/IEX-Dashboard/backend/package.json#L83).
- **Mocking Utility:** `jest-mock-extended ^4.0.1` ([`backend/package.json:L84`](file:///Users/yashgupta/IEX-Dashboard/backend/package.json#L84)).
- **Execution Command:** `npm test` runs `jest` across the project.

### 2.2 Complete Codebase Test Inventory (1 Test File)
A thorough scan of all 230 files across the backend reveals that **only one single automated unit test file exists** in the active codebase:

- **Path:** [`backend/src/modules/savings-calculator/__tests__/savings-calculator.service.test.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/__tests__/savings-calculator.service.test.ts)
- **Lines of Code:** 65 lines.
- **Scenarios Covered (3 Total Scenarios):**
  1. `calculateMarketDecision`: Expects an error throw `'Savings calculator entry not found'` when the entry does not exist in `savingsCalculatorEntry` or `savingsCalculatorEntryHistory`.
  2. `calculateMarketDecision`: Expects an error throw `'State is required to calculate savings. Please edit this entry to select a state.'` when `mockEntry.state` is undefined.
  3. `getEntryOrVersion`: Verifies that `savingsCalculatorEntryHistory.findFirst` is called when a specific `version` parameter is provided.
- **Missing Mock Dependency Bug (Critical Finding):**
  - Line 2 of this test file imports `prismaMock` from `../../../config/__mocks__/prisma`.
  - While compiled artifact [`backend/dist/config/__mocks__/prisma.js`](file:///Users/yashgupta/IEX-Dashboard/backend/dist/config/__mocks__/prisma.js) exists, the TypeScript source file [`backend/src/config/__mocks__/prisma.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/__mocks__/prisma.ts) was **deleted or omitted from source control**.
  - As a result, running `npm test` fails out-of-the-box in a fresh checkout due to the missing TypeScript module.

### 2.3 What Is NOT Covered (Test Coverage Gap: ~99.5%)
There are **zero automated tests** for:
- Authentication & JWT Token Issuance ([`auth.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.service.ts))
- OTP Generation & Email Dispatch ([`otp.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts))
- User Administration & RBAC Guards ([`users.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.service.ts), [`auth.middleware.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/auth.middleware.ts))
- Webhook Secret Verification ([`scraper.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.routes.ts))
- Headless Browser Scraping & Direct IEX APIs ([`scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts))
- 96-Block Tariff Calculations ([`landing-price-calc.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts))
- Commercial & Technical Word Proposal Generation ([`proposal.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts))
- Excel Spreadsheet Parsing & Data Transformations ([`upload-processing.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/upload-processing.service.ts))
- StarRocks OLAP Telemetry Queries ([`starrocks.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts))
- All 11 Background Cron Schedulers ([`cron.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts))

---

## 3. Behavior-Verification Scenarios for Critical Endpoints

To ensure zero behavioral regressions during the Spring Boot conversion, the following end-to-end verification scenarios must be codified as integration tests. Each scenario details the HTTP method, route, request payload, expected response structure, and edge/error variants derived directly from active source code.

---

### 3.1 Authentication & OTP Endpoints

#### Scenario AUTH-01: Standard Username/Password Login (Success)
- **Route:** `POST /api/auth/login` ([`auth.controller.ts:L9-L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L9-L17))
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "Password123!"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c1f7a6b2-8419-4b2a-8921-274e1d1f0340",
      "username": "admin",
      "role": "ADMIN",
      "hiddenModules": [],
      "readOnlyModules": []
    }
  }
  ```
- **Edge / Error Cases:**
  - `AUTH-01a` (Missing username/password): Status `400 Bad Request`, body `{ "success": false, "message": "Username and password are required" }`.
  - `AUTH-01b` (Invalid credentials): Status `401 Unauthorized`, body `{ "success": false, "message": "Invalid username or password" }`.
  - `AUTH-01c` (Rate limit exceeded): 11th request within 15 minutes returns `429 Too Many Requests`.

#### Scenario AUTH-02: Email OTP Generation (Success)
- **Route:** `POST /api/auth/otp/generate` ([`auth.controller.ts:L19-L34`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L19-L34))
- **Request Body:** `{ "email": "ops@probus.io" }`
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "OTP sent to your email address"
  }
  ```
- **Edge / Error Cases:**
  - `AUTH-02a` (Email not found in User table): Status `404 Not Found`, body `{ "success": false, "message": "No account associated with this email" }`.
  - `AUTH-02b` (Invalid email format): Status `400 Bad Request`, body `{ "success": false, "message": "Please provide a valid email address" }`.

#### Scenario AUTH-03: Email OTP Verification - Superadmin Backdoor Verification
- **Route:** `POST /api/auth/otp/verify` ([`otp.service.ts:L19-L27, L87-L90`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L19-L27))
- **Request Body:**
  ```json
  {
    "email": "super.admin@probus.io",
    "otp": "749261"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "superadmin",
      "role": "SUPER_ADMIN"
    }
  }
  ```
- **Edge / Error Cases:**
  - `AUTH-03a` (Incorrect OTP for superadmin): Payload `{ "email": "super.admin@probus.io", "otp": "000000" }` returns `401 Unauthorized` `{ "success": false, "message": "Invalid or expired OTP" }`.
  - `AUTH-03b` (Expired OTP): Standard user OTP entered after 5 minutes returns `401 Unauthorized`.

---

### 3.2 User Administration Endpoints

#### Scenario USER-01: Create User (RBAC Superadmin Enforced)
- **Route:** `POST /api/users` ([`users.controller.ts:L14-L28`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.controller.ts#L14-L28))
- **Headers:** `Authorization: Bearer <SUPER_ADMIN_JWT>`
- **Request Body:**
  ```json
  {
    "username": "trader_john",
    "email": "john@probus.io",
    "password": "SecurePassword123!",
    "role": "CLIENT",
    "hiddenModules": ["trader-performance", "admin-settings"],
    "readOnlyModules": ["savings-calculator"]
  }
  ```
- **Expected Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "UUID",
      "username": "trader_john",
      "email": "john@probus.io",
      "role": "CLIENT",
      "hiddenModules": ["trader-performance", "admin-settings"],
      "readOnlyModules": ["savings-calculator"],
      "createdAt": "2026-10-22T07:00:00.000Z"
    }
  }
  ```
- **Edge / Error Cases:**
  - `USER-01a` (Caller has `ADMIN` or `CLIENT` role): Returns `403 Forbidden` `{ "success": false, "message": "Access denied: insufficient permissions" }`.
  - `USER-01b` (Duplicate username or email): Returns `409 Conflict` `{ "success": false, "message": "Username or email already exists" }`.

---

### 3.3 Market Datasets & Timeseries Endpoints

#### Scenario DATA-01: Fetch 96-Block Market Clearing Prices
- **Route:** `GET /api/dataset/timeseries?date=2026-06-20&market=DAM` ([`dataset.controller.ts:L30-L55`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L30-L55))
- **Headers:** `Authorization: Bearer <VALID_JWT>`
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "timeBlock": 1,
        "time": "00:00 - 00:15",
        "mcp": 3450.25,
        "mcv": 4210.50,
        "purchaseBid": 5120.00,
        "sellBid": 4900.00
      }
      // Exactly 96 items for full day
    ],
    "count": 96
  }
  ```
- **Edge / Error Cases:**
  - `DATA-01a` (Invalid market query param): `GET /api/dataset/timeseries?date=2026-06-20&market=XYZ` returns `400 Bad Request` `{ "success": false, "message": "Invalid market specified. Must be DAM, GDAM, or RTM" }`.
  - `DATA-01b` (No records found for date): Returns `200 OK` with `data: []` and `count: 0`.

---

### 3.4 Scraper Ingestion & Webhook Endpoints

#### Scenario SCRAPE-01: Inbound Webhook Data Import
- **Route:** `POST /api/scraper/import` ([`scraper.routes.ts:L15-L25`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.routes.ts#L15-L25))
- **Headers:** `x-webhook-secret: <WEBHOOK_SECRET_VALUE>`
- **Request Body:**
  ```json
  {
    "market": "DAM",
    "deliveryDate": "2026-06-21",
    "records": [
      {
        "timeBlock": 1,
        "mcp": 3800.00,
        "mcv": 4500.00,
        "purchaseBid": 5000.00,
        "sellBid": 4800.00
      }
    ]
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully imported 1 records for DAM 2026-06-21"
  }
  ```
- **Edge / Error Cases:**
  - `SCRAPE-01a` (Missing or invalid `x-webhook-secret` header): Returns `401 Unauthorized` `{ "success": false, "message": "Invalid webhook secret" }`.

---

### 3.5 Savings Calculator Endpoints

#### Scenario CALC-01: Calculate Landed Cost Savings
- **Route:** `POST /api/savings-calculator/calculate` ([`savings-calculator.controller.ts:L20-L45`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.controller.ts#L20-L45))
- **Headers:** `Authorization: Bearer <VALID_JWT>`
- **Request Body:**
  ```json
  {
    "clientName": "Acme Steel Mills",
    "state": "Uttar Pradesh",
    "tariffCategory": "HV-2",
    "contractDemandKva": 5000,
    "connectedVoltage": "33kV",
    "consumptionKwh": 1250000,
    "monthYear": "Jun 2026"
  }
  ```
- **Expected Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "discomBillAmount": 10525000.00,
      "iexTotalCost": 7420000.00,
      "totalSavings": 3105000.00,
      "percentageSavings": 29.50,
      "breakdown": {
        "energyCost": 5200000.00,
        "ctuLossAndCharges": 620000.00,
        "stLossAndCharges": 480000.00,
        "crossSubsidySurcharge": 850000.00,
        "additionalSurcharge": 270000.00
      }
    }
  }
  ```
- **Edge / Error Cases:**
  - `CALC-01a` (Missing state field): Returns `400 Bad Request` `{ "success": false, "message": "State is required to calculate savings. Please edit this entry to select a state." }` (matches existing unit test in `savings-calculator.service.test.ts`).

---

## 4. Parity Testing Strategy (Node vs. Spring Boot)

```
       +---------------------------------------------+
       |           Test Orchestrator (JUnit 5)       |
       +---------------------------------------------+
               |                             |
      HTTP Request A                HTTP Request B
               v                             v
  +------------------------+    +------------------------+
  |  Node.js Target App    |    |   Spring Boot 3 App    |
  |  (Docker Container)    |    |   (Local / Container)  |
  +------------------------+    +------------------------+
               |                             |
               +-------------+---------------+
                             |
                             v
           +-----------------------------------+
           |    Unified Shared Database        |
           |    (PostgreSQL Testcontainer)     |
           +-----------------------------------+
                             |
                             v
           +-----------------------------------+
           |  JSON Response Diff Engine        |
           |  (AssertJ / JSONassert)           |
           +-----------------------------------+
```

### 4.1 Dual-Run Response Diffing Strategy
1. **Containerized Execution:** Run both the legacy Node.js backend container (`node:20-slim`) and the target Spring Boot 3 application (`eclipse-temurin:21-jre`) simultaneously in a dedicated test network.
2. **Shared State:** Both applications point to the exact same PostgreSQL test instance initialized using **Testcontainers**.
3. **Execution Script:** A JUnit 5 test suite dispatches identical HTTP requests to:
   - Target A: `http://localhost:5001/api/...` (Node.js)
   - Target B: `http://localhost:8080/api/...` (Spring Boot 3)
4. **Assertion & Tolerance:**
   - Status codes must match exactly.
   - Response headers (e.g. `Content-Type`) must match.
   - Response bodies are compared via `org.skyscreamer.jsonassert.JSONAssert` with `JSONCompareMode.LENIENT` (allowing timestamp formatting variations while strictly asserting numeric and string equivalence).
   - Numeric fields (floating-point vs BigDecimal) are compared with an absolute tolerance of `0.0001`.

### 4.2 OpenAPI Contract Validation
- Using [`docs/migration/openapi.yaml`](file:///Users/yashgupta/IEX-Dashboard/docs/migration/openapi.yaml) as the single source of truth:
- Run **Schemathesis** or **Atlassian Swagger Request Validator** during the Spring Boot build:
  ```xml
  <dependency>
      <groupId>com.atlassian.oai</groupId>
      <artifactId>swagger-request-validator-mockmvc</artifactId>
      <version>2.40.0</version>
      <scope>test</scope>
  </dependency>
  ```
- Every `@SpringBootTest` MockMvc test verifies that the HTTP response strictly adheres to the OpenAPI schema.

### 4.3 Testcontainers Infrastructure Setup
The Spring Boot test baseline requires three container definitions managed via Testcontainers:
1. **PostgreSQL 17 Container:**
   ```java
   @Container
   static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
       .withDatabaseName("Prolt_Operations")
       .withUsername("postgres")
       .withPassword("testpass");
   ```
2. **Redis 7 Container:**
   ```java
   @Container
   static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
       .withExposedPorts(6379);
   ```
3. **WireMock Mock Server:**
   - Mocks outbound HTTP responses for Open-Meteo (`api.open-meteo.com`), NPP (`npp.gov.in`), and Vidyut Pravah to make tests deterministic and independent of public network availability.

---

## 5. Sample Test Data & Fixtures

### 5.1 Test User Fixture (SQL Seed)
```sql
INSERT INTO "User" ("id", "username", "email", "password", "role", "hiddenModules", "readOnlyModules", "createdAt", "updatedAt")
VALUES 
  ('c1f7a6b2-8419-4b2a-8921-274e1d1f0340', 'superadmin', 'super.admin@probus.io', '$2b$10$wOqAecZqU1q87kX8s75rOup8P/1wP6jD3Mh8m5r2F5LgT3KxY9ySe', 'SUPER_ADMIN', '[]'::jsonb, '[]'::jsonb, NOW(), NOW()),
  ('d2f7a6b2-8419-4b2a-8921-274e1d1f0341', 'operations_admin', 'admin@probus.io', '$2b$10$wOqAecZqU1q87kX8s75rOup8P/1wP6jD3Mh8m5r2F5LgT3KxY9ySe', 'ADMIN', '[]'::jsonb, '[]'::jsonb, NOW(), NOW()),
  ('e3f7a6b2-8419-4b2a-8921-274e1d1f0342', 'test_client', 'client@test.com', '$2b$10$wOqAecZqU1q87kX8s75rOup8P/1wP6jD3Mh8m5r2F5LgT3KxY9ySe', 'CLIENT', '["admin-settings"]'::jsonb, '["savings-calculator"]'::jsonb, NOW(), NOW());
```

### 5.2 96-Block Market Clearing Price Fixture
Stored in `src/test/resources/fixtures/dam_2026_06_20.json` containing 96 entries:
```json
[
  { "timeBlock": 1, "interval": "00:00 - 00:15", "mcp": 3150.00, "mcv": 4100.25, "purchaseBid": 4800.00, "sellBid": 4500.00 },
  { "timeBlock": 2, "interval": "00:15 - 00:30", "mcp": 3120.50, "mcv": 4050.00, "purchaseBid": 4750.00, "sellBid": 4480.00 }
  // ... blocks 3 to 96
]
```

### 5.3 Tariff Rate Fixture (`StateTariff`)
```sql
INSERT INTO "StateTariff" ("id", "state", "tariffCategory", "voltage", "energyChargePerKwh", "fixedChargePerKva", "effectiveDate")
VALUES 
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Uttar Pradesh', 'HV-2', '33kV', 7.10, 320.00, '2026-01-01'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Haryana', 'HT-Industrial', '11kV', 6.65, 290.00, '2026-01-01');
```
