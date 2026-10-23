# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 02: API Contract Specification & Catalog

## 1. Executive Summary & Verification Check
This document defines the exhaustive, production-accurate API contract for the **Prolt Energy / IEX Analytics Dashboard**.

### Route Count Verification
- **Total Unique Route Paths:** **99**
- **Total HTTP Route Operations:** **117**
- **Contract Verification:** 100% of routes registered in [`backend/src/app.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts) and all sub-routers appear in this catalog.
- **Accompanying Artifact:** Complete OpenAPI 3.0 YAML specification located at [`docs/migration/openapi.yaml`](file:///Users/yashgupta/IEX-Dashboard/docs/migration/openapi.yaml).

---

## 2. Global Cross-Cutting Policies

### 2.1 CORS Policy
- **Configuration File:** [`backend/src/app.ts:L37-L42`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L37-L42)
- **Behavior:** Dynamic origin reflection supporting multi-origin configuration via `process.env.CORS_ORIGIN` (defaulting to allow the requesting origin or `*`).
- **Credentials:** `credentials: true` (permits authorization headers and cross-origin cookies).
- **Allowed Headers:** `Content-Type`, `Authorization`, `x-webhook-token`, `Accept`, `Origin`.

### 2.2 Security Headers & Payloads
- **Helmet:** Implemented via [`backend/src/app.ts:L19-L29`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L19-L29) configuring Content Security Policy (`default-src 'self'`, `script-src 'self' 'unsafe-inline' 'unsafe-eval'`).
- **Payload Limits:** `50mb` limit enforced for both JSON and URL-encoded bodies via `express.json({ limit: '50mb' })` and `express.urlencoded({ extended: true, limit: '50mb' })`.

### 2.3 Rate Limiting Architecture
Two dedicated rate limiters are enforced via `express-rate-limit`:
1. **Authentication Limiter ([`backend/src/modules/auth/auth.routes.ts:L11-L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.routes.ts#L11-L17)):**
   - Window: `15 minutes` (`15 * 60 * 1000` ms)
   - Max requests: `10` per IP
   - Applied to: `/api/auth/login`, `/api/auth/send-otp`, `/api/auth/verify-otp`
   - Rejection Response: `429 Too Many Requests` with `{ success: false, message: "Too many login attempts, please try again after 15 minutes" }`
2. **Upload Limiter ([`backend/src/modules/upload/upload.routes.ts:L16-L22`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.routes.ts#L16-L22)):**
   - Window: `1 hour` (`60 * 60 * 1000` ms)
   - Max requests: `30` per IP
   - Applied to: `/api/uploads`
   - Rejection Response: `429 Too Many Requests` with `{ success: false, message: "Upload limit exceeded. Please try again after an hour." }`

### 2.4 Pagination, Filtering & Sorting Standards
- **Resource Center:** Filtered by `regionalGrid`, `state`, `discom`, `category`, `subCategory`, `voltageLevel`, `effectiveDate`.
- **Dataset Queries:** Filtered by `market` (`DAM`, `GDAM`, `RTM`, `REC`), `startDate`, `endDate`, `status` (`ACTIVE`, `REPLACED`, `DELETED`).
- **Trader Performance & Savings Calculator:** Entries support historical versioning via `?version=<number>` or default to latest active record.
- **Audit Logs:** Paginated with `page` (default `1`) and `limit` (default `50`), sorted descending by `timestamp`.

### 2.5 File Upload & Download Policies
- **Multipart Uploads:** Multer with custom disk storage under [`backend/uploads/`](file:///Users/yashgupta/IEX-Dashboard/backend/uploads/).
- **Upload Size Limits:**
  - Market Datasets (`/api/uploads`): `50 MB` limit.
  - Trader Performance PDF Uploads: `10 MB` per file, max 200 files.
  - Daily Trader Performance PDF Uploads: `25 MB` per file, max 200 files.
- **Automatic Cleanup:** [`backend/src/middleware/upload.middleware.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/upload.middleware.ts) unlinks temporary disk files immediately on validation failure or parser rejection.
- **Binary Downloads:**
  - Excel files streamed via `exceljs` with header `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Word documents streamed with header `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

---

## 3. Complete Endpoint Catalog (117 Endpoints)

### 3.1 Authentication Module (`/api/auth`)
Mounted in [`backend/src/app.ts:L81`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L81) from [`backend/src/modules/auth/auth.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.routes.ts).

#### 1. POST `/api/auth/login`
- **Controller:** [`login`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L10)
- **Middleware Pipeline:** `loginLimiter` -> `validateLoginDTO` -> `asyncHandler(login)`
- **Auth:** Public
- **Request Body:** JSON
  - `email` (string, required, valid email format)
  - `password` (string, required, min 6 chars)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "admin@proltenergy.com",
      "name": "admin",
      "role": "ADMIN",
      "hiddenModules": [],
      "readOnlyModules": []
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "success": false, "message": "Email and password are required" }`
  - `401 Unauthorized`: `{ "success": false, "message": "Invalid email or password" }`
  - `429 Too Many Requests`: Rate limit exceeded.

#### 2. POST `/api/auth/send-otp`
- **Controller:** [`sendOtp`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L45)
- **Middleware Pipeline:** `loginLimiter` -> `asyncHandler(sendOtp)`
- **Auth:** Public
- **Request Body:** JSON
  - `email` (string, required)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "OTP sent to email"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "success": false, "message": "Email is required" }`
  - `404 Not Found`: `{ "success": false, "message": "User not found" }`
  - `500 Internal Server Error`: SMTP transport failure.

#### 3. POST `/api/auth/verify-otp`
- **Controller:** [`verifyOtp`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L70)
- **Middleware Pipeline:** `loginLimiter` -> `asyncHandler(verifyOtp)`
- **Auth:** Public
- **Request Body:** JSON
  - `email` (string, required)
  - `otp` (string, required, 6 digits)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": { "id": "uuid", "email": "user@example.com", "name": "user", "role": "CLIENT" }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "success": false, "message": "Invalid or expired OTP" }`

#### 4. GET `/api/auth/me`
- **Controller:** [`getMe`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.controller.ts#L95)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getMe)`
- **Auth:** Bearer JWT required
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "admin@proltenergy.com",
      "username": "admin",
      "role": "SUPER_ADMIN",
      "hiddenModules": [],
      "readOnlyModules": []
    }
  }
  ```
- **Error Responses:** `401 Unauthorized` if token missing or invalid.

---

### 3.2 Dataset Upload Module (`/api/uploads`)
Mounted in [`backend/src/app.ts:L82`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L82) from [`backend/src/modules/upload/upload.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.routes.ts).

#### 5. POST `/api/uploads`
- **Controller:** [`handleFileUpload`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.controller.ts#L10)
- **Middleware Pipeline:** `authMiddleware` -> `uploadLimiter` -> `handleUpload` (Multer) -> `validateUploadRequest` -> `asyncHandler(handleFileUpload)` -> `uploadCleanupOnError`
- **Auth:** Bearer JWT required
- **Content-Type:** `multipart/form-data`
- **Body / Form Params:**
  - `file` (binary file, required, `.xlsx` or `.csv`, max 50MB)
  - `market` (string, required, enum: `DAM`, `GDAM`, `RTM`, `REC`)
  - `deliveryDate` (string, required, format: `YYYY-MM-DD`)
  - `action` (string, optional, enum: `replace`)
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Dataset uploaded and parsed successfully",
    "data": {
      "datasetId": "4bfd8234-7d52-4a0b-9993-3d0cf3c88019",
      "market": "DAM",
      "deliveryDate": "2026-09-22T00:00:00.000Z",
      "rowCount": 96,
      "parsed": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: File missing, wrong file type, invalid 96-slot interval format.
  - `409 Conflict`: Active dataset already exists for date (must specify `action=replace`).
  - `429 Too Many Requests`: Upload rate limit exceeded (max 30/hour).

#### 6. GET `/api/uploads/health`
- **Controller:** [`getUploadHealth`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.controller.ts#L40)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getUploadHealth)`
- **Auth:** Bearer JWT required
- **Success Response (200 OK):** `{ "success": true, "status": "Upload service operational" }`

---

### 3.3 Dataset Query & Upload History Module (`/api/datasets` & `/api/upload-history`)
Mounted in [`backend/src/app.ts:L83-L84`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L83-L84) from [`backend/src/modules/dataset/dataset.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.routes.ts).

#### 7. GET `/api/datasets/summary`
- **Controller:** [`getDatasetSummary`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L10)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getDatasetSummary)`
- **Auth:** Bearer JWT required
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalDatasets": 142,
      "markets": { "DAM": 45, "GDAM": 45, "RTM": 45, "REC": 7 },
      "latestDeliveryDates": { "DAM": "2026-09-23", "GDAM": "2026-09-23", "RTM": "2026-09-22" }
    }
  }
  ```

#### 8. GET `/api/datasets`
- **Controller:** [`getDatasets`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L35)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getDatasets)`
- **Auth:** Bearer JWT required
- **Query Params:**
  - `market` (optional, enum: `DAM`, `GDAM`, `RTM`, `REC`)
  - `status` (optional, enum: `ACTIVE`, `REPLACED`, `DELETED`)
  - `startDate` (optional, `YYYY-MM-DD`)
  - `endDate` (optional, `YYYY-MM-DD`)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "market": "DAM",
        "deliveryDate": "2026-09-22T00:00:00.000Z",
        "fileName": "DAM_22-09-2026.xlsx",
        "status": "ACTIVE",
        "uploadedAt": "2026-09-22T04:15:00.000Z"
      }
    ]
  }
  ```

#### 9. GET `/api/datasets/:datasetId`
- **Controller:** [`getDatasetById`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L70)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getDatasetById)`
- **Auth:** Bearer JWT required
- **Path Param:** `datasetId` (UUID string, required)
- **Success Response (200 OK):** Full dataset details including 96 interval records (`damRecords`, `gdamRecords`, `rtmRecords`, or `recRecords`).
- **Error Responses:** `404 Not Found` if dataset does not exist.

#### 10. GET `/api/datasets/:datasetId/history`
- **Controller:** [`getDatasetHistory`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L100)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getDatasetHistory)`
- **Auth:** Bearer JWT required
- **Path Param:** `datasetId` (UUID string, required)
- **Success Response (200 OK):** List of upload/replacement actions associated with dataset.

#### 11. DELETE `/api/datasets/:datasetId`
- **Controller:** [`deleteDataset`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L125)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(deleteDataset)`
- **Auth:** Bearer JWT required (Soft-deletes status to `DELETED`)
- **Success Response (200 OK):** `{ "success": true, "message": "Dataset soft-deleted successfully" }`

#### 12. GET `/api/upload-history`
- **Controller:** [`getUploadHistory`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L150)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(getUploadHistory)`
- **Auth:** Bearer JWT required
- **Success Response (200 OK):** Returns all historical `UploadHistory` audit records.

---

### 3.4 Public Market Analytics Dashboard (`/api/dashboard`)
Mounted in [`backend/src/app.ts:L85`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L85) from [`backend/src/modules/dataset/dashboard.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.routes.ts).
*Note: Public endpoints designed for unauthenticated executive dashboard consumption.*

#### 13. GET `/api/dashboard/overview`
- **Controller:** [`getOverviewData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L10)
- **Auth:** Public
- **Success Response (200 OK):** Consolidated metrics across all exchange markets.

#### 14. GET `/api/dashboard/dam`
- **Controller:** [`getDamData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L35)
- **Query Params:** `date` (format: `YYYY-MM-DD`, optional, defaults to latest)
- **Success Response (200 OK):** Array of 96 DAM interval records with MCP, MCV, purchaseBid, sellBid.

#### 15. GET `/api/dashboard/gdam`
- **Controller:** [`getGdamData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L60)
- **Query Params:** `date` (format: `YYYY-MM-DD`, optional)
- **Success Response (200 OK):** Array of 96 GDAM interval records with technology breakdown (Solar, Wind, Hydro, DRE).

#### 16. GET `/api/dashboard/rtm`
- **Controller:** [`getRtmData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L85)
- **Query Params:** `date` (format: `YYYY-MM-DD`, optional)
- **Success Response (200 OK):** Array of RTM half-hourly session interval records.

#### 17. GET `/api/dashboard/rec`
- **Controller:** [`getRecData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L110)
- **Query Params:** `year` (number, optional)
- **Success Response (200 OK):** Monthly REC trade session records.

#### 18. GET `/api/dashboard/dam/analytics`
- **Controller:** [`getDamAnalytics`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L135)
- **Query Params:** `startDate`, `endDate`
- **Success Response (200 OK):** Aggregated metrics: Average MCP, Peak MCP, Off-Peak MCP, Total MCV, Liquidity ratios.

#### 19. GET `/api/dashboard/gdam/analytics`
- **Controller:** [`getGdamAnalytics`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L160)
- **Query Params:** `startDate`, `endDate`
- **Success Response (200 OK):** GDAM statistical aggregations by renewable generation fuel type.

#### 20. GET `/api/dashboard/rtm/analytics`
- **Controller:** [`getRtmAnalytics`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L185)
- **Query Params:** `startDate`, `endDate`
- **Success Response (200 OK):** RTM real-time volatility indices and clearance percentages.

#### 21. GET `/api/dashboard/rec/analytics`
- **Controller:** [`getRecAnalytics`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.controller.ts#L210)
- **Query Params:** `year`
- **Success Response (200 OK):** Annual REC market volume and clearing price trends.

---

### 3.5 Resource Center Regulatory Master Data (`/api/resource-center`)
Mounted in [`backend/src/app.ts:L86`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L86) from [`backend/src/modules/resource-center/routes/resource-center.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/routes/resource-center.routes.ts).
Resource types (`:resourceType`): `region-state`, `discom-list`, `ists-charges`, `iex-fees`, `prolt-margin`, `ctu-charges`, `state-charges`, `state-tariff`, `fppa-charges`, `dsm-charges`.

#### 22. GET `/api/resource-center/:resourceType`
- **Controller:** [`getResourceData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/controllers/resource-center.controller.ts#L10)
- **Path Param:** `resourceType` (string, required)
- **Query Params:** Dynamic filter fields matching model columns.
- **Success Response (200 OK):** List of resource records.

#### 23. POST `/api/resource-center/:resourceType`
- **Controller:** [`createResourceRecord`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/controllers/resource-center.controller.ts#L40)
- **Path Param:** `resourceType` (string, required)
- **Request Body:** JSON entity object.
- **Success Response (201 Created):** Created record object with auto-generated ID.

#### 24. POST `/api/resource-center/:resourceType/bulk`
- **Controller:** [`createBulkResourceRecords`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/controllers/resource-center.controller.ts#L70)
- **Path Param:** `resourceType` (string, required)
- **Request Body:** JSON array of entity objects.
- **Success Response (200 OK):** `{ "success": true, "count": 25 }`

#### 25. PUT `/api/resource-center/:resourceType/:id`
- **Controller:** [`updateResourceRecord`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/controllers/resource-center.controller.ts#L100)
- **Path Params:** `resourceType`, `id` (integer or string)
- **Request Body:** Partial or complete updated record fields.
- **Success Response (200 OK):** Updated record object.

#### 26. DELETE `/api/resource-center/:resourceType/:id`
- **Controller:** [`deleteResourceRecord`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/controllers/resource-center.controller.ts#L130)
- **Path Params:** `resourceType`, `id`
- **Success Response (200 OK):** `{ "success": true, "message": "Record deleted successfully" }`

---

### 3.6 Scraper & Webhook Ingestion Module (`/api/scraper`)
Mounted in [`backend/src/app.ts:L87`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L87) from [`backend/src/modules/scraper/scraper.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.routes.ts).

#### 27. POST `/api/scraper/sync`
- **Controller:** [`triggerScraper`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.controller.ts#L9)
- **Middleware Pipeline:** `authMiddleware` -> `asyncHandler(triggerScraper)`
- **Auth:** Bearer JWT required
- **Request Body:** JSON `{ "market": "DAM" }` (enum: `DAM`, `GDAM`, `RTM`, `REC`)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully scraped and saved 96 records for DAM",
    "datasetId": "uuid"
  }
  ```

#### 28. POST `/api/scraper/import`
- **Controller:** [`importScrapedData`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.controller.ts#L75)
- **Middleware Pipeline:** `asyncHandler(importScrapedData)`
- **Auth:** Webhook Token Header: `x-webhook-token: <WEBHOOK_SECRET>`
- **Request Body:** JSON
  - `type` (string, required, enum: `dataset`, `state-demand`, `state-market-records`)
  - `payload` (object, required)
- **Success Response (200 OK):** `{ "success": true, "datasetId": "uuid" }` or `{ "success": true, "count": 96 }`
- **Error Responses:** `401 Unauthorized` if token missing or invalid.

---

### 3.7 Database, Weather & Holidays Module (`/api/database`)
Mounted in [`backend/src/app.ts:L88`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L88) from [`backend/src/modules/database/database.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/database/database.routes.ts).

#### 29. GET `/api/database/demand`
- **Controller:** `databaseController.getDemandData`
- **Query Params:** `date`, `startDate`, `endDate`, `state`
- **Success Response (200 OK):** National Power Portal (NPP) demand telemetry.

#### 30. GET `/api/database/generation`
- **Controller:** `databaseController.getGenerationData`
- **Query Params:** `date`, `startDate`, `endDate`
- **Success Response (200 OK):** Thermal, Gas, Hydro, Nuclear, Wind, and Solar generation data.

#### 31. GET `/api/database/weather`
- **Controller:** `databaseController.getWeatherData`
- **Query Params:** `date`, `city`
- **Success Response (200 OK):** Temperature, humidity, cloud cover, and precipitation records.

#### 32. GET `/api/database/export/csv`
- **Controller:** `databaseController.exportCSV`
- **Query Params:** `type` (`demand` | `generation` | `weather`), `date`
- **Success Response (200 OK):** Binary CSV stream (`text/csv`).

#### 33. GET `/api/database/holidays`
- **Controller:** `databaseController.getHolidays`
- **Query Params:** `year` (optional), `state` (optional)
- **Success Response (200 OK):** Array of HolidayCalendar records.

#### 34. POST `/api/database/holidays`
- **Controller:** `databaseController.createHoliday`
- **Request Body:** JSON `{ "holidayDate": "2026-10-02", "name": "Gandhi Jayanti", "state": "ALL", "isOperationalHoliday": true }`
- **Success Response (201 Created):** Created holiday record.

#### 35. POST `/api/database/holidays/upload`
- **Controller:** `databaseController.uploadHolidays`
- **Middleware Pipeline:** `handleUpload` (Multer) -> controller -> `uploadCleanupOnError`
- **Content-Type:** `multipart/form-data` with `file`
- **Success Response (200 OK):** `{ "success": true, "imported": 24 }`

#### 36. PUT `/api/database/holidays/:id`
- **Controller:** `databaseController.updateHoliday`
- **Path Param:** `id` (integer)
- **Request Body:** Partial updated fields.
- **Success Response (200 OK):** Updated record.

#### 37. PATCH `/api/database/holidays/:id/toggle`
- **Controller:** `databaseController.toggleHoliday`
- **Path Param:** `id` (integer)
- **Success Response (200 OK):** Toggles `isOperationalHoliday` boolean.

#### 38. GET `/api/database/city-state`
- **Controller:** `databaseController.getCityStateData`
- **Success Response (200 OK):** Array of mapped cities, states, and coordinates.

#### 39. POST `/api/database/city-state`
- **Controller:** `databaseController.createCityStateData`
- **Request Body:** JSON `{ "cityName": "Noida", "stateName": "Uttar Pradesh", "latitude": 28.5355, "longitude": 77.3910 }`
- **Success Response (201 Created):** Created city-state mapping.

---

### 3.8 Execution Logs Module (`/api/logs`)
Mounted in [`backend/src/app.ts:L89`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L89) from [`backend/src/modules/api-log/api-log.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/api-log/api-log.routes.ts).

#### 40. GET `/api/logs/api-names`
- **Controller:** `ApiLogController.getUniqueApiNames`
- **Success Response (200 OK):** Array of distinct API names from `ApiLog` table.

#### 41. GET `/api/logs/stats`
- **Controller:** `ApiLogController.getStats`
- **Success Response (200 OK):** Success rates, failure counts, average latency metrics.

#### 42. GET `/api/logs`
- **Controller:** `ApiLogController.getLogs`
- **Query Params:** `apiName`, `status` (`SUCCESS` | `ERROR`), `page`, `limit`
- **Success Response (200 OK):** Paginated log records.

---

### 3.9 Market Operations Cross-Product Module (`/api/market-operations`)
Mounted in [`backend/src/app.ts:L90`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L90) from [`backend/src/modules/market-operations/market-operations.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/market-operations/market-operations.routes.ts).

#### 43. GET `/api/market-operations`
- **Controller:** `controller.getRecords`
- **Query Params:** `date` (`YYYY-MM-DD`, required), `market` (optional)
- **Success Response (200 OK):** Merged 96-time-block comparison array aligning DAM, GDAM, and RTM prices and volumes in a single row.

---

### 3.10 Savings Calculator (Classic) (`/api/savings-calculator`)
Mounted in [`backend/src/app.ts:L91`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L91) from [`backend/src/modules/savings-calculator/savings-calculator.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.routes.ts).
*Protected by `authMiddleware`.*

#### 44. GET `/api/savings-calculator`
- **Controller:** `SavingsCalculatorController.getAll`
- **Success Response (200 OK):** Array of client entries.

#### 45. POST `/api/savings-calculator`
- **Controller:** `SavingsCalculatorController.create`
- **Request Body:** JSON client tariff entry parameters.
- **Success Response (201 Created):** Created entry object.

#### 46. GET `/api/savings-calculator/:id`
- **Controller:** `SavingsCalculatorController.getById`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Entry configuration.

#### 47. PUT `/api/savings-calculator/:id`
- **Controller:** `SavingsCalculatorController.update`
- **Path Param:** `id` (UUID)
- **Request Body:** Updated parameters (triggers history snapshot).
- **Success Response (200 OK):** Updated entry.

#### 48. DELETE `/api/savings-calculator/:id`
- **Controller:** `SavingsCalculatorController.delete`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** `{ "success": true }`

#### 49. GET `/api/savings-calculator/:id/overview`
- **Controller:** `SavingsCalculatorController.getClientOverview`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Client executive summary.

#### 50. GET `/api/savings-calculator/:id/history`
- **Controller:** `SavingsCalculatorController.getHistory`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Array of versioned history snapshots.

#### 51. POST `/api/savings-calculator/:id/calculate`
- **Controller:** `SavingsCalculatorController.calculate`
- **Path Param:** `id` (UUID)
- **Request Body:** `{ "month": "Jan 2026", "version": 1 }`
- **Success Response (200 OK):** 96-time-block landed cost and savings calculations.

#### 52. POST `/api/savings-calculator/:id/calculate-market-decision`
- **Controller:** `SavingsCalculatorController.calculateMarketDecision`
- **Path Param:** `id` (UUID)
- **Request Body:** `{ "month": "Jan 2026", "version": 1 }`
- **Success Response (200 OK):** Optimal procurement decision (DAM vs GDAM vs Grid).

#### 53. POST `/api/savings-calculator/:id/demand-shift-insights`
- **Controller:** `SavingsCalculatorController.getDemandShiftInsights`
- **Path Param:** `id` (UUID)
- **Request Body:** Demand shifting scenario bounds.
- **Success Response (200 OK):** Financial impact of shifting peak load to solar blocks.

#### 54. GET `/api/savings-calculator/:id/demand-shift-insights/export-excel`
- **Controller:** `SavingsCalculatorController.exportDemandShiftExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary Excel `.xlsx` workbook stream.

#### 55. GET `/api/savings-calculator/:id/export-excel`
- **Controller:** `SavingsCalculatorController.exportExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary Excel `.xlsx` landed cost workbook stream.

---

### 3.11 Savings Calculator New (Enterprise V2) (`/api/savings-calculator-new`)
Mounted in [`backend/src/app.ts:L93`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L93) from [`backend/src/modules/savings-calculator-new/savings-calculator-new.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.routes.ts).
*Protected by `authMiddleware`.*

#### 56. GET `/api/savings-calculator-new/entries`
- **Controller:** `SavingsCalculatorNewController.getAll`
- **Success Response (200 OK):** List of enterprise calculator client entries.

#### 57. GET `/api/savings-calculator-new/entries/resource-defaults`
- **Controller:** `SavingsCalculatorNewController.getResourceDefaults`
- **Query Params:** `state`, `discom`, `category`, `voltageLevel`
- **Success Response (200 OK):** Auto-resolved cross-subsidy, wheeling, STU, and electricity duty defaults.

#### 58. POST `/api/savings-calculator-new/entries`
- **Controller:** `SavingsCalculatorNewController.create`
- **Request Body:** Complete enterprise entry JSON (clientName, state, discom, category, voltage, contractedDemand, todProfiles).
- **Success Response (201 Created):** Created entry object.

#### 59. GET `/api/savings-calculator-new/entries/:id`
- **Controller:** `SavingsCalculatorNewController.getById`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Detailed entry record.

#### 60. PUT `/api/savings-calculator-new/entries/:id`
- **Controller:** `SavingsCalculatorNewController.update`
- **Path Param:** `id` (UUID)
- **Request Body:** Updated fields (increments `version` and archives previous version in `SavingsCalculatorNewEntryHistory`).
- **Success Response (200 OK):** Updated entry.

#### 61. DELETE `/api/savings-calculator-new/entries/:id`
- **Controller:** `SavingsCalculatorNewController.delete`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Soft or hard deletes entry.

#### 62. GET `/api/savings-calculator-new/entries/:id/history`
- **Controller:** `SavingsCalculatorNewController.getHistory`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Array of historical versions with timestamp and modifier details.

#### 63. GET `/api/savings-calculator-new/entries/:id/client-overview`
- **Controller:** `SavingsCalculatorNewController.getClientOverview`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Executive overview metrics.

#### 64. GET `/api/savings-calculator-new/entries/:id/calculate`
- **Controller:** `SavingsCalculatorNewController.calculateSavings`
- **Path Param:** `id` (UUID)
- **Query Params:** `month` (e.g. `Aug 2026`), `version` (optional number)
- **Success Response (200 OK):** Detailed 96-slot landed cost comparison across Grid, DAM, GDAM, and RTM.

#### 65. GET `/api/savings-calculator-new/entries/:id/market-decision`
- **Controller:** `SavingsCalculatorNewController.calculateMarketDecision`
- **Path Param:** `id` (UUID)
- **Query Params:** `month`, `version`
- **Success Response (200 OK):** Block-by-block procurement strategy recommendations.

#### 66. POST `/api/savings-calculator-new/entries/:id/demand-shift-insights`
- **Controller:** `SavingsCalculatorNewController.getDemandShiftInsights`
- **Path Param:** `id` (UUID)
- **Request Body:** JSON shift criteria.
- **Success Response (200 OK):** Demand shift cost savings summary.

#### 67. GET `/api/savings-calculator-new/entries/:id/export-excel`
- **Controller:** `SavingsCalculatorNewController.exportExcel`
- **Path Param:** `id` (UUID)
- **Query Params:** `month`, `version`
- **Success Response (200 OK):** Binary `.xlsx` download.

#### 68. GET `/api/savings-calculator-new/entries/:id/demand-shift-insights/export-excel`
- **Controller:** `SavingsCalculatorNewController.exportDemandShiftExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary `.xlsx` download for demand shift scenario.

---

### 3.12 Forecasting Engine Module (`/api/forecast` and `/forecast`)
Dual-mounted in [`backend/src/app.ts:L94-L95`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L94-L95) from [`backend/src/modules/forecast/forecast.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/forecast/forecast.routes.ts).

#### 69 & 75. GET `/api/forecast/price` & GET `/forecast/price`
- **Controller:** `ForecastController.getPriceForecast`
- **Query Params:** `startDate`, `endDate`, `modelNumber` (optional, default: `1`), `market` (optional, default: `DAM`)
- **Success Response (200 OK):** 96-time-block forecasted MCP vs actual MCP.

#### 70 & 76. GET `/api/forecast/demand` & GET `/forecast/demand`
- **Controller:** `ForecastController.getDemandForecast`
- **Query Params:** `startDate`, `endDate`, `meterId` (optional)
- **Success Response (200 OK):** Forecasted vs actual consumer load demand in MW/kWh.

#### 71 & 77. GET `/api/forecast/generation` & GET `/forecast/generation`
- **Controller:** `ForecastController.getGenerationForecast`
- **Query Params:** `startDate`, `endDate`
- **Success Response (200 OK):** Forecasted solar, wind, and thermal generation profiles.

#### 72 & 78. GET `/api/forecast/dates` & GET `/forecast/dates`
- **Controller:** `ForecastController.getForecastDates`
- **Success Response (200 OK):** Array of distinct dates available in `forecasting` schema tables.

#### 73 & 79. GET `/api/forecast/meters` & GET `/forecast/meters`
- **Controller:** `ForecastController.getMeters`
- **Success Response (200 OK):** Array of distinct meter numbers available from StarRocks / PostgreSQL.

#### 74 & 80. GET `/api/forecast/market-selection` & GET `/forecast/market-selection`
- **Controller:** `ForecastController.getMarketSelectionForecast`
- **Query Params:** `startDate`, `endDate`
- **Success Response (200 OK):** Machine learning market procurement recommendations (DAM vs GDAM vs RTM) per block.

---

### 3.13 User Management & RBAC Module (`/api/users`)
Mounted in [`backend/src/app.ts:L96`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L96) from [`backend/src/modules/users/users.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.routes.ts).
*Protected by `authMiddleware` AND `superAdminMiddleware`.*

#### 81. GET `/api/users`
- **Controller:** `getUsers`
- **Auth:** `SUPER_ADMIN` required
- **Success Response (200 OK):** List of all user accounts without password hashes.

#### 82. GET `/api/users/audit-logs`
- **Controller:** `getAuditLogs`
- **Auth:** `SUPER_ADMIN` required
- **Query Params:** `page`, `limit`
- **Success Response (200 OK):** Audit log of user creation, role changes, and deletions.

#### 83. POST `/api/users`
- **Controller:** `createUser`
- **Auth:** `SUPER_ADMIN` required
- **Middleware:** `validateCreateUser`
- **Request Body:** JSON `{ "username": "trader1", "email": "trader1@prolt.com", "password": "...", "role": "CLIENT", "hiddenModules": [], "readOnlyModules": [] }`
- **Success Response (201 Created):** Created user object.

#### 84. PUT `/api/users/:id`
- **Controller:** `updateUser`
- **Auth:** `SUPER_ADMIN` required
- **Middleware:** `validateUpdateUser`
- **Path Param:** `id` (UUID)
- **Request Body:** Updated role, modules, or password.
- **Success Response (200 OK):** Updated user.

#### 85. DELETE `/api/users/:id`
- **Controller:** `deleteUser`
- **Auth:** `SUPER_ADMIN` required
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** `{ "success": true, "message": "User deleted" }`

---

### 3.14 Proposal Generation Module (`/api/proposals`)
Mounted in [`backend/src/app.ts:L97`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L97) from [`backend/src/modules/proposal/proposal.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.routes.ts).

#### 86. POST `/api/proposals/generate`
- **Controller:** `controller.generate`
- **Request Body:** JSON client parameter payload.
- **Success Response (200 OK):** Binary `.docx` stream (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).

#### 87. POST `/api/proposals/generate-technical`
- **Controller:** `controller.generateTechnical`
- **Request Body:** JSON technical contract parameters.
- **Success Response (200 OK):** Binary `.docx` stream.

#### 88. POST `/api/proposals/generate-commercial`
- **Controller:** `controller.generateCommercial`
- **Request Body:** JSON commercial contract parameters.
- **Success Response (200 OK):** Binary `.docx` stream.

---

### 3.15 Trader Performance (Classic) (`/api/trader-performance`)
Mounted in [`backend/src/app.ts:L98`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L98) from [`backend/src/modules/trader-performance/trader-performance.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.routes.ts).

#### 89. POST `/api/trader-performance/upload`
- **Controller:** `uploadTradeReports`
- **Middleware Pipeline:** `upload.array('files', 200)` (Multer, max 10MB each)
- **Content-Type:** `multipart/form-data`
- **Success Response (200 OK):** Parsed trade execution summary.

#### 90. GET `/api/trader-performance`
- **Controller:** `TraderPerformanceController.getAll`
- **Success Response (200 OK):** Array of trader benchmark records.

#### 91. POST `/api/trader-performance`
- **Controller:** `TraderPerformanceController.create`
- **Request Body:** JSON benchmark parameters.
- **Success Response (201 Created):** Created entry.

#### 92. GET `/api/trader-performance/resource-defaults`
- **Controller:** `TraderPerformanceController.getResourceDefaults`
- **Success Response (200 OK):** State and discom tariff defaults.

#### 93. GET `/api/trader-performance/:id`
- **Controller:** `TraderPerformanceController.getById`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Record details.

#### 94. PUT `/api/trader-performance/:id`
- **Controller:** `TraderPerformanceController.update`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Updated record.

#### 95. DELETE `/api/trader-performance/:id`
- **Controller:** `TraderPerformanceController.delete`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** `{ "success": true }`

#### 96. GET `/api/trader-performance/:id/client-overview`
- **Controller:** `TraderPerformanceController.getClientOverview`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Trader savings overview.

#### 97. GET `/api/trader-performance/:id/history`
- **Controller:** `TraderPerformanceController.getHistory`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Historical revisions.

#### 98. GET `/api/trader-performance/:id/calculate`
- **Controller:** `TraderPerformanceController.calculateSavings`
- **Path Param:** `id` (UUID)
- **Query Params:** `month`, `version`
- **Success Response (200 OK):** Actual vs planned procurement costs.

#### 99. GET `/api/trader-performance/:id/market-decision`
- **Controller:** `TraderPerformanceController.calculateMarketDecision`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Ex-post market clearance decisions.

#### 100. GET `/api/trader-performance/:id/demand-shift-insights`
- **Controller:** `TraderPerformanceController.getDemandShiftInsights`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Shifting analytics.

#### 101. GET `/api/trader-performance/:id/export-excel`
- **Controller:** `TraderPerformanceController.exportExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary `.xlsx` spreadsheet.

#### 102. GET `/api/trader-performance/:id/actual-trader/export-excel`
- **Controller:** `TraderPerformanceController.exportActualTraderExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary `.xlsx` spreadsheet for actuals.

#### 103. GET `/api/trader-performance/:id/demand-shift-insights/export-excel`
- **Controller:** `TraderPerformanceController.exportDemandShiftExcel`
- **Path Param:** `id` (UUID)
- **Success Response (200 OK):** Binary `.xlsx` spreadsheet for shifted demand.

---

### 3.16 Daily Trader Performance & Smart Meter Analysis (`/api/trader-performance-daily`)
Mounted in [`backend/src/app.ts:L99`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L99) from [`backend/src/modules/trader-performance-daily/trader-performance-daily.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance-daily/trader-performance-daily.routes.ts).

#### 104. POST `/api/trader-performance-daily/upload`
- **Controller:** `uploadDailyTradeReports`
- **Middleware Pipeline:** `upload.array('files', 200)` (Multer, max 25MB each)
- **Content-Type:** `multipart/form-data`
- **Success Response (200 OK):** Parsed daily execution sheets.

#### 105. GET `/api/trader-performance-daily/meters`
- **Controller:** `TraderPerformanceDailyController.getAvailableMeters`
- **Success Response (200 OK):** List of smart meter IDs from StarRocks / PostgreSQL.

#### 106. GET `/api/trader-performance-daily/consumers`
- **Controller:** `TraderPerformanceDailyController.getConsumers`
- **Success Response (200 OK):** List of enrolled consumers and mapped meter numbers.

#### 107. POST `/api/trader-performance-daily/consumers`
- **Controller:** `TraderPerformanceDailyController.saveConsumer`
- **Request Body:** JSON `{ "consumerName": "Client A", "meterNumber": "X2521837", "state": "UP" }`
- **Success Response (201 Created):** Created consumer profile.

#### 108 & 109. GET & POST `/api/trader-performance-daily/analysis`
- **Controller:** `TraderPerformanceDailyController.getDailyAnalysis`
- **Query / Body Params:** `date`, `consumerId`, `meterNumber`
- **Success Response (200 OK):** Daily & MTD 96-slot interval reconciliation of scheduled vs drawn power.

---

### 3.17 Uttar Pradesh Regional Market Module (`/api/up-market`)
Mounted in [`backend/src/app.ts:L100`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L100) from [`backend/src/modules/up-market/up-market.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/up-market/up-market.routes.ts).

#### 110. GET `/api/up-market/:market`
- **Controller:** `upMarketController.getMarketData`
- **Path Param:** `market` (`DAM`, `GDAM`, `RTM`)
- **Query Params:** `date` (`YYYY-MM-DD`, required), `endDate` (optional)
- **Success Response (200 OK):** UP-specific 96-time-block MCP, MCV, purchaseBid, and sellBid records.

---

### 3.18 IEX Landing Price Calculator Proxy (`/api/landing-price-calc`)
Mounted in [`backend/src/app.ts:L101`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L101) from [`backend/src/modules/landing-price-calc/landing-price-calc.routes.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.routes.ts).
*Protected by `authMiddleware`.*

#### 111. GET `/api/landing-price-calc/calculate`
- **Controller:** `LandingPriceCalcController.calculate`
- **Query Params:** `voltage`, `state`, `consumerCategory`, `todMonth`, `todSlot`, `iexPrice`
- **Success Response (200 OK):** Landed cost breakdown calculated via official IEX calculation algorithms.

#### 112. GET `/api/landing-price-calc/consumer-category`
- **Controller:** `LandingPriceCalcController.getConsumerCategories`
- **Success Response (200 OK):** List of consumer categories (e.g. Industrial, Commercial).

#### 113. GET `/api/landing-price-calc/voltage`
- **Controller:** `LandingPriceCalcController.getVoltages`
- **Success Response (200 OK):** List of voltage levels (11kV, 33kV, 66kV, 132kV).

#### 114. GET `/api/landing-price-calc/tod-months`
- **Controller:** `LandingPriceCalcController.getTodMonths`
- **Success Response (200 OK):** Distinct TOD applicable months.

#### 115. GET `/api/landing-price-calc/tod-slots`
- **Controller:** `LandingPriceCalcController.getTodSlots`
- **Success Response (200 OK):** Time-of-Day slot definitions (Peak, Off-Peak, Normal).

---

### 3.19 System Health Check Endpoints (`/health`)
Mounted directly in [`backend/src/app.ts:L104-L120`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L104-L120).

#### 116. GET `/health`
- **Auth:** Public
- **Success Response (200 OK):** `{ "success": true, "status": "healthy" }`

#### 117. GET `/health/database`
- **Auth:** Public
- **Success Response (200 OK):** `{ "success": true, "database": "connected" }`
- **Error Response (500 Internal Server Error):** If `SELECT 1` fails on primary and secondary databases.
