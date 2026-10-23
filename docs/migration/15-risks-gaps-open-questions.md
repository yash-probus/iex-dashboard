# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 15: Risks, Codebase Gaps & Consolidated Open Questions

## 1. Executive Summary & Verification Check
This document serves as the master risk register, technical debt catalog, and architectural decision log for migrating the **Prolt Energy / IEX Analytics Dashboard** to **Java 21 / Spring Boot 3.x**.

It provides an exhaustive analysis of behavioral discrepancies between Node.js and Java 21, documents all identified dead code, security backdoors, and technical debt from active source files, categorizes each finding by severity (High, Medium, Low) with a recommended architectural resolution, and consolidates **all Open Questions from Documents 01 through 14 into a single, authoritative list requiring stakeholder resolution**.

---

## 2. Node.js vs. Java Behavioral Discrepancies

| # | Discrepancy Category | Node.js / JavaScript Reality | Java 21 / Spring Boot 3 Reality | Severity | Recommended Resolution |
|---|---|---|---|---|---|
| **1** | **Number Precision & Floating Point** | JavaScript `number` is an IEEE-754 64-bit float. Calculations in [`landing-price-calc.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts) produce penny-level rounding artifacts (e.g. `7.1000000000000005`). | Java `BigDecimal` provides arbitrary-precision arithmetic with explicit rounding (`RoundingMode.HALF_UP`). | **High** | Mandate `BigDecimal` (Scale 4 for unit rates, Scale 2 for currency totals) across all tariff, clearing price, and landed cost services. Configure a `0.0001` tolerance threshold during parity verification. |
| **2** | **JSON Property Suppression (null vs. undefined)** | Prisma and JavaScript omit `undefined` object properties from JSON serialization while including explicit `null`s. | Jackson serializes Java `null` properties as `"field": null` by default unless configured. | **Medium** | Configure Jackson globally with `@JsonInclude(JsonInclude.Include.NON_NULL)` in `JacksonConfig.java` to maintain exact JSON payload compatibility with the existing React frontend. |
| **3** | **Date & Midnight Timezone Offsets** | `new Date().toISOString()` in [`cron.service.ts:L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L17) generates UTC strings (`YYYY-MM-DD`). Between 12:00 AM and 5:30 AM IST, UTC date evaluates to the **previous calendar day**, causing off-by-one date bugs in night jobs. | `java.time.LocalDate.now(ZoneId.of("Asia/Kolkata"))` explicitly locks calendar calculations to Indian Standard Time. | **High** | Replace all `Date` and `moment`/string slicing with Java 21 `ZonedDateTime` and `LocalDate` locked to `ZoneId.of("Asia/Kolkata")`. Configure Jackson `write-dates-as-timestamps: false`. |
| **4** | **Unordered SQL Query Results** | Node.js Prisma queries without an explicit `orderBy` clause return rows in arbitrary database storage order. | Spring Data JPA queries similarly depend on PostgreSQL physical page order unless sorted. | **Medium** | Audit all repository queries returning lists (e.g. 96-time-block matrices) and mandate explicit sorting: `ORDER BY timeBlock ASC` or `ORDER BY date DESC`. |
| **5** | **Null / Truthiness Semantics** | In JavaScript, `""`, `0`, `false`, `null`, and `undefined` are all falsy. Logic like `if (!entry.contractDemandKva)` in [`savings-calculator.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts) triggers if demand is explicitly set to `0`. | Java requires strict boolean expressions (`if (entry.contractDemandKva() == null || entry.contractDemandKva().compareTo(BigDecimal.ZERO) == 0)`). | **Medium** | Avoid implicit boolean coercion. Write explicit null checks and comparison methods in domain service layers. |
| **6** | **Case Sensitivity & DB Identifiers** | Prisma generates quoted mixed-case identifiers in PostgreSQL (`"User"`, `"SavingsCalculationEntry"`). Direct raw queries in [`starrocks.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts) use uppercase MySQL names. | Hibernate 6 defaults to snake_case naming strategy (`PhysicalNamingStrategyStandardImpl` vs `CamelCaseToUnderscoresNamingStrategy`). | **High** | Explicitly configure Hibernate physical naming strategy in `application.yml` to preserve existing table names without breaking foreign keys: `spring.jpa.hibernate.naming.physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl`. |
| **7** | **Concurrency & Thread Pooling** | Node.js event loop executes all application code single-threaded; asynchronous I/O runs concurrently without thread synchronization issues. | Java Virtual Threads run requests concurrently across multiple platform carrier threads. Shared in-memory state can suffer race conditions. | **High** | Eliminate all mutable module-level state (`static Map`). Utilize stateless service singletons and delegate all distributed state to Redis. |

---

## 3. Dead Code, Security Backdoors & Technical Debt Catalog

### 3.1 Critical Security Backdoor in OTP Authentication
- **Location:** [`backend/src/modules/auth/otp.service.ts:L19-L27, L87-L90`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L19-L27)
- **Code:**
  ```typescript
  if (email === 'super.admin@probus.io') {
    // Fixed hardcoded OTP bypass
    return '749261';
  }
  ```
- **Severity:** **HIGH (Critical Security Vulnerability)**
- **Technical Debt Description:** Anyone possessing knowledge of this email address can authenticate as `SUPER_ADMIN` with complete administrative control over the entire platform, bypassing multi-factor email verification entirely.
- **Recommended Resolution:** Remove the hardcoded backdoor completely from production code. If an automated testing bypass is required, restrict it strictly to an isolated `@Profile("test")` mock bean that is physically excluded from production build artifacts.

---

### 3.2 Unused & Dead Dependencies
- **Location:** [`backend/package.json:L43-L44`](file:///Users/yashgupta/IEX-Dashboard/backend/package.json#L43-L44)
- **Packages:** `mongodb ^7.6.0`, `mongoose ^9.10.1`.
- **Severity:** **Low (Technical Debt / Image Bloat)**
- **Technical Debt Description:** A global code search across the entire repository confirms there are **zero references** to `mongodb` or `mongoose`. PostgreSQL is the sole relational database, and StarRocks is accessed via MySQL protocol.
- **Recommended Resolution:** Do not import `spring-boot-starter-data-mongodb`. Prune MongoDB entirely from the target Maven `pom.xml`.

---

### 3.3 SSL Certificate Validation Disabled in Government Ingestion
- **Location:** [`backend/src/services/scraper.service.ts:L11`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts#L11)
- **Code:**
  ```typescript
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  ```
- **Severity:** **HIGH (Security Vulnerability)**
- **Technical Debt Description:** The scraper disables TLS certificate validation when communicating with National Power Portal (`npp.gov.in`) and Vidyut Pravah, exposing outbound ingestion traffic to Man-in-the-Middle (MitM) attacks and data spoofing.
- **Recommended Resolution:** Install the requisite Indian government intermediate CA root certificates into the Java truststore (`cacerts`) inside the Docker container, enabling secure TLS certificate validation without `rejectUnauthorized: false`.

---

### 3.4 Missing Tenant / User Isolation on Calculation Entities
- **Location:** [`backend/prisma/schema.prisma:L45-L75`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/schema.prisma#L45-L75)
- **Severity:** **HIGH (Authorization Flaw / Multi-Tenancy Leak)**
- **Technical Debt Description:** Models `SavingsCalculationEntry`, `SavingsCalculatorEntryHistory`, and `TraderPerformanceRecord` have **no `user_id`, `created_by`, or `tenant_id` foreign keys**. Any authenticated user who knows or guesses a UUID can fetch, modify, or delete calculations created by another client.
- **Recommended Resolution:** Add an `owner_user_id UUID` foreign key to calculation entities in Flyway migration `V1__Initial_Schema.sql`. Enforce row-level ownership checks via Spring Security:
  `@PreAuthorize("@securityService.isOwner(authentication, #id) or hasRole('SUPER_ADMIN')")`.

---

### 3.5 Cron Overlap & Memory Starvation
- **Location:** [`backend/src/services/cron.service.ts:L110-L145`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L110-L145)
- **Severity:** **Medium (Operational Reliability Risk)**
- **Technical Debt Description:** In-process node-cron jobs lack overlap locks. If the 30-minute headless Puppeteer scrape hangs or takes 35 minutes, a second Chromium process spawns simultaneously, causing memory contention and eventual container out-of-memory (OOM) termination.
- **Recommended Resolution:** Use **ShedLock** with Redis distributed locks:
  `@SchedulerLock(name = "rtmScrapeLock", lockAtMostFor = "25m", lockAtLeastFor = "5m")`.

---

### 3.6 Redundant Dual-Mounted Route Aliases
- **Location:** [`backend/src/app.ts:L78-L79, L83-L84`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L78-L79)
- **Routes:**
  - `/api/forecast` AND `/forecast`
  - `/api/proposals` AND `/api/proposal`
- **Severity:** **Low (API Consistency / Tech Debt)**
- **Technical Debt Description:** Duplicate route registrations exist because legacy frontend components called non-prefixed or singular paths.
- **Recommended Resolution:** Standardize on pluralized, `/api/`-prefixed paths (`/api/forecast`, `/api/proposals`). For backwards compatibility during transition, define Spring `@RequestMapping({"/api/proposals", "/api/proposal"})` aliases, marking the singular variant as `@Deprecated`.

---

### 3.7 Missing Source File for Unit Test Mock
- **Location:** [`backend/src/modules/savings-calculator/__tests__/savings-calculator.service.test.ts:L2`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/__tests__/savings-calculator.service.test.ts#L2)
- **Severity:** **Medium (Broken Test Suite)**
- **Technical Debt Description:** The only existing unit test imports `../../../config/__mocks__/prisma`, but the `.ts` source file is missing from git, causing `npm test` to fail on clean checkouts.
- **Recommended Resolution:** Superseded by the Spring Boot test baseline defined in Document 12 using Mockito and Testcontainers.

---

## 4. Consolidated Master List of Open Questions (Documents 01 - 14)

All unresolved design questions, ambiguities, and architectural trade-offs identified across the migration analysis are consolidated below for stakeholder decision:

| # | Originating Document | Area / Subsystem | Question for Architecture Stakeholders | Recommended Resolution & Trade-Off |
|---|---|---|---|---|
| **Q1** | [Doc 06](file:///Users/yashgupta/IEX-Dashboard/docs/migration/06-security.md) & [Doc 15](file:///Users/yashgupta/IEX-Dashboard/docs/migration/15-risks-gaps-open-questions.md) | Security | **Should the hardcoded OTP backdoor (`super.admin@probus.io` / `749261`) be permanently deleted or preserved under an automated test profile?** | **Delete permanently from production.** If required for QA automation, encapsulate within a separate `@Profile("test")` authentication provider disabled in staging and production. |
| **Q2** | [Doc 06](file:///Users/yashgupta/IEX-Dashboard/docs/migration/06-security.md) & [Doc 03](file:///Users/yashgupta/IEX-Dashboard/docs/migration/03-data-model.md) | Multi-Tenancy | **Should the Spring Boot database schema introduce `owner_user_id` foreign keys to isolate calculation records per client?** | **Yes.** Add `owner_user_id` to `SavingsCalculationEntry` and `TraderPerformanceRecord`. Enforce ownership checks via Spring Security. |
| **Q3** | [Doc 08](file:///Users/yashgupta/IEX-Dashboard/docs/migration/08-external-integrations.md) & [Doc 10](file:///Users/yashgupta/IEX-Dashboard/docs/migration/10-dependency-mapping.md) | Web Scraping Architecture | **Should headless browser scraping (Puppeteer) be migrated to Microsoft Playwright for Java inside the Spring container, or separated into a dedicated scraping sidecar container?** | **Option A (Playwright for Java)** is recommended to maintain single-container deployment simplicity. If memory isolation is prioritized, use Option C (Python/Node scraping sidecar). |
| **Q4** | [Doc 01](file:///Users/yashgupta/IEX-Dashboard/docs/migration/01-architecture-overview.md) & [Doc 08](file:///Users/yashgupta/IEX-Dashboard/docs/migration/08-external-integrations.md) | Weather Telemetry | **Should the production system continue querying the free Open-Meteo REST API, or activate the configured AccuWeather API?** | **Standardize on Open-Meteo.** The codebase actively parses Open-Meteo response schemas; remove unused AccuWeather configurations. |
| **Q5** | [Doc 02](file:///Users/yashgupta/IEX-Dashboard/docs/migration/02-api-contract.md) & [Doc 14](file:///Users/yashgupta/IEX-Dashboard/docs/migration/14-target-architecture-and-migration-plan.md) | API Governance | **Should legacy route aliases (`/forecast` without `/api` prefix, `/api/proposal` singular) be permanently deprecated and removed?** | **Support both during migration** via Spring `@RequestMapping({"/api/proposals", "/api/proposal"})`, then sunset the legacy aliases once the React frontend is updated. |
| **Q6** | [Doc 06](file:///Users/yashgupta/IEX-Dashboard/docs/migration/06-security.md) | Session Management | **Should the Spring Boot platform introduce Refresh Tokens (`/api/auth/refresh`) or continue relying exclusively on 7-day access tokens?** | **Introduce short-lived JWTs (15 min) + Refresh Tokens (7 days)** stored in Redis. The current 7-day unrevokable token is a security risk if compromised. |
| **Q7** | [Doc 08](file:///Users/yashgupta/IEX-Dashboard/docs/migration/08-external-integrations.md) | StarRocks OLAP | **Is the StarRocks OLAP cluster deployed in the same VPC with persistent MySQL connectivity, or should queries fail over to PostgreSQL if unreachable?** | **Implement graceful degradation.** If StarRocks on port 9030 times out, log a warning and return cached Redis aggregates or fallback to PostgreSQL queries. |
| **Q8** | [Doc 04](file:///Users/yashgupta/IEX-Dashboard/docs/migration/04-business-logic.md) | Business Calculations | **When 96-time-block market clearing data is missing for a target date, should calculation endpoints throw 404 or interpolate from the previous day's clearing prices?** | **Throw 404 / 422 with a structured RFC 7807 ProblemDetail** explaining missing data. Implicit interpolation masks data ingestion failures from traders. |
| **Q9** | [Doc 14](file:///Users/yashgupta/IEX-Dashboard/docs/migration/14-target-architecture-and-migration-plan.md) | Document Generation | **Should commercial and technical Word proposals be converted to pure Java Apache POI, or should external Python scripts be retained?** | **Convert to pure Java Apache POI.** This eliminates Python runtime dependencies, reducing Docker container image size from 1.85 GB to ~320 MB. |
| **Q10** | [Doc 13](file:///Users/yashgupta/IEX-Dashboard/docs/migration/13-build-deploy-cicd.md) | DevOps & CI/CD | **Should the production deployment transition from manual `deploy.sh` SSH pulls to an automated GitHub Actions CI/CD pipeline?** | **Adopt GitHub Actions CI/CD.** Automated builds, Testcontainers verification, and automated container registry pushes eliminate human error during deployments. |
