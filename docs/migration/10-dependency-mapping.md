# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 10: Dependency Mapping & Technology Translation

## 1. Executive Summary & Verification Check
This document provides an exhaustive mapping of every dependency and devDependency declared in the **Prolt Energy / IEX Analytics Dashboard** (`backend/package.json` and root `package.json`) to its corresponding Java 21 / Spring Boot 3 enterprise ecosystem library.

### Dependency Count Verification
- **`backend/package.json` Production Dependencies:** **33**
- **`backend/package.json` Development Dependencies:** **27**
- **Total `backend/package.json` Dependencies:** **60**
- **Root `package.json` Dependencies:** **2** (`glob`, `pdf-parse`)
- **Total Cataloged Dependencies:** **62**
- **Completeness Status:** Confirmed. Every single dependency declared in the repository is represented in the tables below.

---

## 2. Production Dependencies Mapping (33 Libraries)

| Dependency Name | Installed Version | Purpose in Codebase | Where Used (Files / Modules) | Recommended Java / Spring Equivalent | Effort | Technical Translation Notes |
|---|---|---|---|---|---|---|
| `@prisma/client` | `^5.22.0` | ORM client for PostgreSQL multi-schema (`public`, `forecasting`) | All models, controllers, and services across [`backend/src/modules`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules) | **Spring Data JPA (Hibernate 6)** (`spring-boot-starter-data-jpa`) | Medium | Multi-schema support configured via `@Table(name = "...", schema = "...")`. Complex PostgreSQL `DISTINCT ON` queries require `@Query(nativeQuery = true)`. |
| `axios` | `^1.18.1` | HTTP client for outbound REST API requests | [`backend/src/services/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts), [`backend/src/services/weather.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts), [`backend/src/utils/webhook-dispatcher.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/webhook-dispatcher.ts) | **Spring Boot 3 `RestClient`** or `WebClient` | Low | Synchronous HTTP calls can utilize Spring 6 `RestClient`; asynchronous reactive streaming can utilize `WebClient`. |
| `axios-retry` | `^4.5.0` | Exponential backoff retry interceptor for HTTP calls | [`backend/src/services/weather.service.ts:L11-L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts#L11-L17), [`backend/src/services/scraper.service.ts:L21-L27`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts#L21-L27) | **Resilience4j Retry** (`resilience4j-spring-boot3`) | Low | Declarative `@Retry(name = "weatherApi")` with configurable exponential backoff and HTTP status predicates (e.g. 429). |
| `bcryptjs` | `^3.0.3` | Password hashing with salt factor 10 | [`backend/src/modules/users/users.service.ts:L29`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.service.ts#L29), [`backend/prisma/seed.ts:L118`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L118) | **Spring Security `BCryptPasswordEncoder`** | Low | Drop-in binary compatible password verification (`BCryptPasswordEncoder(10)` matches existing hashes). |
| `cheerio` | `^1.2.0` | Server-side HTML DOM parser | [`backend/src/services/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/scraper.service.ts) | **Jsoup** (`org.jsoup:jsoup`) | Low | Jsoup provides an identical CSS-selector syntax (`doc.select("span.value")`) for parsing government portal HTML tables. |
| `compression` | `^1.8.1` | Gzip/deflate HTTP response compression | [`backend/src/app.ts:L32`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L32) | Native Spring Boot configuration: `server.compression.enabled: true` | Low | Zero-code configuration in `application.yml` with `server.compression.mime-types: application/json,...`. |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing handling | [`backend/src/app.ts:L37-L42`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L37-L42) | Spring Security `CorsConfigurationSource` | Low | Standard `CorsFilter` bean defining allowed origins, credentials, and exposed headers. |
| `csv-parser` | `^3.2.1` | Streaming CSV parser | [`backend/prisma/seed.ts:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L5) | **Apache Commons CSV** (`org.apache.commons:commons-csv`) | Low | `CSVParser.parse(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())` provides robust streaming parsing. |
| `docxtemplater` | `^3.69.3` | Microsoft Word (`.docx`) template engine | [`backend/src/modules/proposal/proposal.service.ts:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L5) | **Apache POI XWPF** (`org.apache.poi:poi-ooxml`) or `docx4j` | Medium | Replaces Node docxtemplater and external Python script with Java-native Word document generation. |
| `docxtemplater-image-module-free` | `^1.1.1` | Image insertion module for Word templates | [`backend/src/modules/proposal/proposal.service.ts:L7`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L7) | Apache POI `XWPFRun.addPicture()` | Low | Native Apache POI functionality embedding corporate logos and chart PNGs into table cells. |
| `dotenv` | `^16.4.5` | Loads `.env` file into runtime process environment | [`backend/src/config/index.ts:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L5) | Spring Boot native `application.yml` / `dotenv-java` | Low | Spring Boot natively binds environment variables and system properties to `@ConfigurationProperties`. |
| `exceljs` | `^4.4.0` | Excel spreadsheet generator & stream writer | [`backend/src/modules/savings-calculator/savings-calculator.export.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.export.ts), [`backend/src/modules/trader-performance/trader-performance.export.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.export.ts) | **Apache POI SXSSF** (`SXSSFWorkbook`) | Low | Streaming workbook implementation preventing heap out-of-memory errors on massive 96-time-block sheets. |
| `express` | `^4.21.2` | Core HTTP routing framework | [`backend/src/app.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts), [`backend/src/server.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/server.ts) | **Spring Boot Starter Web** (`spring-boot-starter-web`) | Medium | Migrates Express routers and controllers to `@RestController`, `@GetMapping`, `@PostMapping`. |
| `express-list-endpoints` | `^7.1.1` | Programmatic route inspection utility | Dev scripts and Swagger bootstrap | `RequestMappingHandlerMapping` / SpringDoc | Low | Spring natively provides `RequestMappingHandlerMapping` exposing all registered endpoints at runtime. |
| `express-rate-limit` | `^8.5.2` | In-memory IP rate limiter | [`backend/src/modules/auth/auth.routes.ts:L11`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.routes.ts#L11), [`backend/src/modules/upload/upload.routes.ts:L16`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.routes.ts#L16) | **Bucket4j** (`com.bucket4j:bucket4j-redis`) | Low | Redis-backed token bucket filter providing cluster-wide rate limiting across horizontal pod replicas. |
| `helmet` | `^8.2.0` | HTTP security headers (CSP, HSTS) | [`backend/src/app.ts:L19-L29`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L19-L29) | Spring Security `HeadersConfigurer` | Low | Configured declaratively in `SecurityFilterChain` via `http.headers(...)`. |
| `ioredis` | `^5.4.1` | Redis client and caching | [`backend/src/config/redis.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/redis.ts) | **Spring Data Redis (Lettuce)** (`spring-boot-starter-data-redis`) | Low | High-performance non-blocking Redis client with declarative `@Cacheable` and `RedisTemplate`. |
| `jsonwebtoken` | `^9.0.3` | JWT issuance, signing, and verification | [`backend/src/utils/jwt.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/jwt.ts) | **JJWT** (`io.jsonwebtoken:jjwt-api`, `jjwt-impl`) or Spring Security Resource Server | Low | Generates and verifies HMAC-SHA256 Bearer tokens with custom claims matching `JwtPayload`. |
| `mongodb` | `^7.6.0` | Native MongoDB driver | Declared in `backend/package.json:L43`, **unused in active codebase** | None (Prune dependency) or `spring-boot-starter-data-mongodb` | Low | Codebase does not actively connect to MongoDB (PostgreSQL is used exclusively). Recommended to omit. |
| `mongoose` | `^9.10.1` | MongoDB ODM | Declared in `backend/package.json:L44`, **unused in active codebase** | None (Prune dependency) | Low | Codebase does not actively connect to MongoDB. Recommended to omit during migration. |
| `morgan` | `^1.10.0` | HTTP access request logging | [`backend/src/app.ts:L46`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L46) | **CommonsRequestLoggingFilter** or Logbook (`org.zalando:logbook-spring-boot-starter`) | Low | Logs incoming HTTP requests, headers, and execution durations into SLF4J. |
| `multer` | `^2.2.0` | Multipart form-data file upload processing | [`backend/src/config/multer.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/multer.ts), [`backend/src/middleware/upload.middleware.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/upload.middleware.ts) | **Spring `MultipartFile`** (`StandardServletMultipartResolver`) | Low | Native `@RequestParam("file") MultipartFile file` with configurable max file size in `application.yml`. |
| `mysql2` | `^3.23.3` | MySQL protocol driver for StarRocks OLAP queries | [`backend/src/services/starrocks.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts) | **MySQL Connector/J** (`com.mysql:mysql-connector-j`) | Low | Standard JDBC driver connecting to StarRocks on port 9030 via a secondary Spring `DataSource`. |
| `node-cron` | `^4.5.0` | Cron background job scheduler | [`backend/src/services/cron.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts) | **Spring `@Scheduled` + ShedLock** (`net.javacrumbs.shedlock:shedlock-spring`) | Low | Replaces in-process cron with thread-pooled Spring scheduler protected by Redis distributed locks. |
| `nodemailer` | `^9.0.3` | SMTP email transport | [`backend/src/modules/auth/otp.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts), [`backend/src/services/email-alert.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts) | **Spring Boot Starter Mail** (`JavaMailSender`) | Low | Dispatches HTML emails with embedded logo attachments and TLS authentication. |
| `otp-generator` | `^4.0.1` | Generates 6-digit numeric OTPs | [`backend/src/modules/auth/otp.service.ts:L1`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L1) | `java.security.SecureRandom` | Low | Simple native Java helper: `String.format("%06d", new SecureRandom().nextInt(1000000))`. |
| `pg` | `^8.23.0` | PostgreSQL driver | [`backend/src/config/prisma.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts) | **PostgreSQL JDBC Driver** (`org.postgresql:postgresql`) | Low | Standard high-performance PostgreSQL driver managed by HikariCP connection pool. |
| `pizzip` | `^3.2.0` | In-memory ZIP archive reader/writer | [`backend/src/modules/proposal/proposal.service.ts:L4`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L4) | `java.util.zip.ZipInputStream` / Apache POI | Low | Replaced directly by Apache POI which manages OpenXML ZIP structures natively. |
| `puppeteer` | `^25.4.0` | Headless Chromium scraper for official IEX snapshots | [`backend/src/modules/scraper/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts) | **Microsoft Playwright for Java** (`com.microsoft.playwright:playwright`) | **High** | **No direct pure-Java equivalent.** Playwright for Java controls Chromium via Node/C++ bindings. See Section 4. |
| `swagger-autogen` | `^2.23.7` | Static OpenAPI JSON generator | [`backend/swagger-autogen.js`](file:///Users/yashgupta/IEX-Dashboard/backend/swagger-autogen.js) | **SpringDoc OpenAPI** (`springdoc-openapi-starter-webmvc-ui`) | Low | Generates OpenAPI 3.0 specification automatically from Spring `@RestController` annotations. |
| `swagger-jsdoc` | `^6.3.0` | JSDoc annotation processor for OpenAPI | [`backend/src/swagger.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/swagger.ts) | SpringDoc OpenAPI Annotations (`@Operation`, `@ApiResponse`) | Low | Declarative OpenAPI annotations directly on Java controller records and DTOs. |
| `swagger-ui-express` | `^5.0.1` | Express middleware hosting Swagger UI | [`backend/src/swagger.ts:L4`](file:///Users/yashgupta/IEX-Dashboard/backend/src/swagger.ts#L4) | SpringDoc Swagger UI (`/swagger-ui.html`) | Low | Automatic embedded Swagger UI web interface included in `springdoc-openapi-starter-webmvc-ui`. |
| `xlsx` | `^0.18.5` | SheetJS Excel spreadsheet parser | [`backend/src/modules/upload-processing/parsers`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/parsers), [`backend/src/modules/database/holiday.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/database/holiday.service.ts) | **Apache POI (`XSSFWorkbook` / `HSSFWorkbook`)** | Low | Robust parser for `.xlsx` and legacy `.xls` files extracting cell numbers, dates, and text strings. |

---

## 3. Development Dependencies Mapping (27 Libraries)

| Dependency Name | Installed Version | Purpose in Codebase | Recommended Java / Spring Equivalent | Effort | Technical Translation Notes |
|---|---|---|---|---|---|
| `@types/bcryptjs` | `^2.4.6` | TypeScript type definitions | None | N/A | Java is statically typed; separate type packages are not required. |
| `@types/compression` | `^1.8.1` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/cors` | `^2.8.19` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/express` | `^5.0.6` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/express-rate-limit` | `^5.1.3` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/ioredis` | `^4.28.10` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/jest` | `^30.0.0` | TypeScript type definitions for Jest | **JUnit 5 (`org.junit.jupiter:junit-jupiter-api`)** | N/A | Java unit testing standard. |
| `@types/jsonwebtoken` | `^9.0.10` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/morgan` | `^1.9.10` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/multer` | `^2.1.0` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/node` | `^26.0.0` | Node.js core library type definitions | **Java 21 JDK (`java.base`)** | N/A | Standard Java runtime classes (`java.lang`, `java.util`, `java.io`, `java.net`). |
| `@types/node-cron` | `^3.0.11` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/nodemailer` | `^8.0.1` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/otp-generator` | `^4.0.2` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/pizzip` | `^3.0.5` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/swagger-jsdoc` | `^6.0.4` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@types/swagger-ui-express` | `^4.1.8` | TypeScript type definitions | None | N/A | Statically typed in Spring Boot. |
| `@typescript-eslint/eslint-plugin` | `^8.65.0` | ESLint TypeScript rule plugin | **SpotBugs** (`com.github.spotbugs:spotbugs-maven-plugin`) / Checkstyle | Low | Static bytecode and source code analyzer for Java best practices. |
| `@typescript-eslint/parser` | `^8.65.0` | TypeScript AST parser | Checkstyle / SonarQube Maven plugin | Low | Static code analysis. |
| `eslint` | `^10.8.0` | Static code linter | **SonarQube / Checkstyle** | Low | Enforces coding conventions and detects vulnerabilities during Maven build. |
| `jest` | `^30.4.2` | JavaScript test runner framework | **JUnit 5 (`junit-jupiter-engine`)** | Low | Native test runner executing unit and integration tests. |
| `jest-mock-extended` | `^4.0.1` | Mocking utility for TypeScript interfaces | **Mockito (`org.mockito:mockito-core`, `mockito-junit-jupiter`)** | Low | Industry-standard Java mocking library for service and repository unit tests. |
| `nodemon` | `^3.1.14` | Hot-reloading development server | **Spring Boot DevTools (`spring-boot-devtools`)** | Low | Automatic class reload and server restart upon compilation in IDE. |
| `prisma` | `^5.22.0` | Prisma CLI for migrations and schema introspection | **Flyway Maven Plugin (`org.flywaydb:flyway-maven-plugin`)** | Low | Executes versioned SQL migrations during build or application startup. |
| `ts-jest` | `^29.4.12` | TypeScript preprocessor for Jest | **Maven Surefire Plugin (`maven-surefire-plugin`)** | Low | Executes JUnit test suites during `mvn test`. |
| `ts-node` | `^10.9.2` | Direct TypeScript execution engine | Standard JVM / `mvn spring-boot:run` | N/A | Java bytecode runs directly on JVM. |
| `typescript` | `^6.0.3` | TypeScript language compiler | **Maven Compiler Plugin (`maven-compiler-plugin`)** with `javac` 21 | N/A | Standard Java compiler targeting Java 21 bytecode. |

---

## 4. Root Dependencies Mapping (2 Libraries)

| Dependency Name | Installed Version | Purpose in Codebase | Recommended Java / Spring Equivalent | Effort | Technical Translation Notes |
|---|---|---|---|---|---|
| `glob` | `^13.0.6` | File system pattern matching | `java.nio.file.PathMatcher` | Low | Java standard library `FileSystems.getDefault().getPathMatcher("glob:...")`. |
| `pdf-parse` | `^2.4.5` | PDF text extraction | **Apache PDFBox** (`org.apache.pdfbox:pdfbox`) | Low | Extracts text blocks, tables, and clearing records from trader execution reports. |

---

## 5. Flagged Libraries with No Clean Java Equivalent & Migration Strategy

### 5.1 Puppeteer (`puppeteer ^25.4.0`)
- **Problem:** Puppeteer is a Google-developed Node.js library controlling Chromium via the Chrome DevTools Protocol (CDP). Java does not have an identical pure-JVM headless browser engine (historic options like HtmlUnit fail modern Angular/React SPAs due to incomplete JavaScript DOM engines).
- **Recommended Options:**
  - **Option A (Recommended): Microsoft Playwright for Java (`com.microsoft.playwright:playwright`).**
    - Playwright is maintained by Microsoft, fully supports Java 21, and provides first-class headless Chromium, Firefox, and WebKit automation with superior async waiting, auto-wait locators, and network interception.
    - Matches Puppeteer functionality line-by-line.
  - **Option B: Selenium WebDriver for Java (`org.seleniumhq.selenium:selenium-java`).**
    - Standard enterprise testing tool; requires managing `chromedriver` binaries or containerized Selenium grid.
  - **Option C: Dedicated Scraping Microservice (Sidecar Container).**
    - Maintain a lightweight Python/FastAPI or Node.js scraping container that exposes an internal REST API (`POST /internal/scrape/rtm`) returning JSON data to the Spring Boot service.

### 5.2 Python Execution Scripts (`child_process.execFileSync` calling `python-docx`)
- **Problem:** The Node.js application invokes Python scripts (`generate_commercial_proposal.py`, `generate_technical_proposal.py`, `up_market_sync.py`) via shell subprocesses. Relying on external Python runtimes complicates Java production container deployments.
- **Recommended Options:**
  - **Option A (Recommended): Re-implement Word Generation Natively in Java with Apache POI.**
    - Apache POI XWPF is the enterprise standard for `.docx` manipulation. All Aptos typography, table cell replacements, and currency formatting can be written cleanly in pure Java classes (`ProposalDocumentGenerator.java`), eliminating Python dependencies completely.
  - **Option B: RestClient to Direct IEX Service.**
    - Re-implement `up_market_sync.py` directly in Spring Boot using `RestClient`, storing records via Spring Data JPA.
