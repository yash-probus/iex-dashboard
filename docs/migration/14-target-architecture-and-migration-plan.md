# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 14: Target Architecture & Comprehensive Migration Plan

## 1. Executive Summary & Verification Check
This document defines the target enterprise software architecture for the **Prolt Energy / IEX Analytics Dashboard** migrated to **Java 21 / Spring Boot 3.x**. 

It includes the complete package hierarchy, an exhaustive mapping table covering every source file in the repository, library recommendations linked to Document 10, explicit guidance on where to apply (and avoid) Java 21 features, and a phased, test-driven migration roadmap with dependencies, effort estimates, and definitions of done.

---

## 2. Target Spring Boot 3 Package Structure & Layering

The application follows an enterprise **Domain-Driven Layered Architecture** with strict package boundaries:

```
com.prolt.iex
├── config                       # Spring beans, security filter chain, Redis, CORS, Jackson
│   ├── SecurityConfig.java
│   ├── RedisConfig.java
│   ├── OpenApiConfig.java
│   └── WebMvcConfig.java
├── common                       # Cross-cutting concerns, base classes, utilities
│   ├── exception                # GlobalExceptionHandler (@RestControllerAdvice), ProblemDetail
│   ├── validation               # Custom Jakarta Bean Validation validators
│   ├── security                 # JwtAuthFilter, UserPrincipal, JwtService
│   ├── logging                  # MDC logging filter, ApiLogAspect
│   └── util                     # MarketTimeHelper, MathConstants, DateSanitizer
├── domain                       # Core entities, value objects, domain enums
│   ├── market                   # DamRecord, GdamRecord, RtmRecord, RecRecord
│   ├── tariff                   # StateTariff, StateCharges, CtuCharges, IstsCharges
│   ├── savings                  # SavingsCalculationEntry, CalculationHistory
│   ├── forecast                 # DemandForecast, MarketSelectionForecast
│   ├── telemetry                # StateDemandData, NppRawDemandData, WeatherHourly
│   └── user                     # User, Role, ModuleAccess
├── repository                   # Spring Data JPA Repositories (PostgreSQL & StarRocks)
│   ├── UserRepository.java
│   ├── DamRecordRepository.java
│   ├── SavingsCalculatorRepository.java
│   └── StarRocksOlapRepository.java
├── service                      # Business logic, calculations, orchestration
│   ├── auth                     # AuthService, OtpService
│   ├── market                   # MarketDataService, TransformationService
│   ├── tariff                   # LandingPriceCalculationService, SavingsService
│   ├── proposal                 # ProposalDocumentGenerator (Apache POI)
│   ├── ingestion                # ScraperService (Playwright), WeatherSyncService
│   └── scheduled                # CronJobScheduler (ShedLock + @Scheduled)
└── web                          # Web Layer: REST Controllers, Request/Response DTOs
    ├── dto                      # Immutable Java 21 records for API contracts
    └── controller               # @RestController classes with OpenAPI annotations
```

---

## 3. Complete Source File to Java Class Mapping Table

Every source file under `backend/src/`, `backend/scripts/`, `backend/prisma/`, and deployment roots is cataloged in the mapping table below:

| # | Current Node.js / TypeScript / Python File | Target Java Class / Resource | Target Package / Directory | Technical Responsibility & Architecture Notes |
|---|---|---|---|---|
| **Entry & Core Config** |
| 1 | `backend/src/server.ts` | `IexApplication.java` | `com.prolt.iex` | Main Spring Boot entry point (`@SpringBootApplication`), graceful shutdown hooks. |
| 2 | `backend/src/app.ts` | `SecurityConfig.java` & `WebMvcConfig.java` | `com.prolt.iex.config` | Filter chains, compression, CORS config, controller endpoint registrations. |
| 3 | `backend/src/config/index.ts` | `AppProperties.java` | `com.prolt.iex.config` | `@ConfigurationProperties(prefix = "app")` binding all 27 environment variables. |
| 4 | `backend/src/config/prisma.ts` | `JpaConfig.java` | `com.prolt.iex.config` | HikariCP DataSource configuration with secondary replica failover. |
| 5 | `backend/src/config/redis.ts` | `RedisConfig.java` | `com.prolt.iex.config` | Lettuce connection factory, `RedisTemplate<String, Object>`, `@EnableCaching`. |
| 6 | `backend/src/config/multer.ts` | `MultipartConfig.java` | `com.prolt.iex.config` | `StandardServletMultipartResolver` with 50MB request size thresholds. |
| 7 | `backend/src/cron/index.ts` | `SchedulerConfig.java` | `com.prolt.iex.config` | `@EnableScheduling`, `@EnableSchedulerLock(defaultLockAtMostFor = "10m")`. |
| 8 | `backend/src/logger/index.ts` | `logback-spring.xml` | `src/main/resources` | SLF4J / Logback configuration with JSON format and MDC correlation IDs. |
| 9 | `backend/src/swagger.ts` | `OpenApiConfig.java` | `com.prolt.iex.config` | SpringDoc OpenAPI 3 configuration with JWT Bearer security scheme. |
| 10 | `backend/src/generate_swagger.ts` | *Replaced by SpringDoc* | `src/main/resources` | Dynamically generates OpenAPI documentation from Java annotations during build. |
| 11 | `backend/src/get_meters.ts` | `MeterDiscoveryService.java` | `com.prolt.iex.service` | Utility service discovering active client sub-meters. |
| 12 | `backend/src/reset_admin.ts` | `AdminBootstrapRunner.java` | `com.prolt.iex.config` | `CommandLineRunner` checking for default superadmin presence on startup. |
| **Middleware & Cross-Cutting** |
| 13 | `backend/src/middleware/asyncHandler.ts` | *Eliminated in Java* | N/A | Virtual threads eliminate the need for Express promise wrapper functions. |
| 14 | `backend/src/middleware/auth.middleware.ts` | `JwtAuthenticationFilter.java` | `com.prolt.iex.common.security` | `OncePerRequestFilter` parsing Bearer token and populating `SecurityContextHolder`. |
| 15 | `backend/src/middleware/admin.middleware.ts` | `@PreAuthorize("hasRole('ADMIN')")` | `com.prolt.iex.web.controller` | Declarative Spring Security method annotation. |
| 16 | `backend/src/middleware/super-admin.middleware.ts`| `@PreAuthorize("hasRole('SUPER_ADMIN')")`| `com.prolt.iex.web.controller` | Declarative Spring Security method annotation. |
| 17 | `backend/src/middleware/errorHandler.ts` | `GlobalExceptionHandler.java` | `com.prolt.iex.common.exception` | `@RestControllerAdvice` emitting RFC 7807 `ProblemDetail` structures. |
| 18 | `backend/src/middleware/upload.middleware.ts` | `FileUploadValidator.java` | `com.prolt.iex.common.validation`| Validates MIME types, extensions (`.xlsx`, `.csv`), and payload size limits. |
| 19 | `backend/src/utils/AppError.ts` | `AppException.java` | `com.prolt.iex.common.exception` | Base runtime business exception containing HTTP status and error codes. |
| 20 | `backend/src/utils/jwt.ts` | `JwtService.java` | `com.prolt.iex.common.security` | JJWT token signer and parser with claims validation. |
| 21 | `backend/src/utils/password.ts` | `PasswordEncoder` Bean | `com.prolt.iex.config` | Standard Spring `BCryptPasswordEncoder(10)`. |
| 22 | `backend/src/utils/prisma-decimal.ts` | *Replaced by BigDecimal*| N/A | Java `BigDecimal` replaces Prisma custom Decimal wrapper natively. |
| 23 | `backend/src/utils/webhook-dispatcher.ts`| `WebhookDispatcher.java` | `com.prolt.iex.service` | Outbound Spring `RestClient` with HMAC-SHA256 signature generator. |
| **Authentication Module** |
| 24 | `backend/src/modules/auth/auth.controller.ts` | `AuthController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/auth/login`, `/api/auth/otp/generate`, `/api/auth/otp/verify`. |
| 25 | `backend/src/modules/auth/auth.service.ts` | `AuthService.java` | `com.prolt.iex.service.auth` | Validates credentials, checks user status, generates JWT tokens. |
| 26 | `backend/src/modules/auth/auth.routes.ts` | `SecurityConfig.java` | `com.prolt.iex.config` | Route authorization mapping in `SecurityFilterChain`. |
| 27 | `backend/src/modules/auth/auth.types.ts` | `AuthDTOs.java` (Records) | `com.prolt.iex.web.dto` | Java 21 records: `LoginRequest`, `LoginResponse`, `OtpRequest`, `VerifyOtpRequest`. |
| 28 | `backend/src/modules/auth/auth.validation.ts` | Jakarta Constraints | `com.prolt.iex.web.dto` | Declarative `@NotBlank`, `@Email` annotations on request records. |
| 29 | `backend/src/modules/auth/otp.service.ts` | `OtpService.java` | `com.prolt.iex.service.auth` | Generates 6-digit numeric OTPs, stores in Redis with 5m TTL; handles backdoor. |
| **Users Module** |
| 30 | `backend/src/modules/users/users.controller.ts` | `UserController.java` | `com.prolt.iex.web.controller` | CRUD operations for `/api/users`. |
| 31 | `backend/src/modules/users/users.service.ts` | `UserService.java` | `com.prolt.iex.service.user` | User provisioning, password hashing, role updates, soft deletes. |
| 32 | `backend/src/modules/users/users.routes.ts` | `UserController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/users")` with `@PreAuthorize`. |
| 33 | `backend/src/modules/users/users.validation.ts` | Jakarta Constraints | `com.prolt.iex.web.dto` | `@Valid` constraints on `CreateUserRequest` and `UpdateUserRequest`. |
| **Dataset & Dashboard Module** |
| 34 | `backend/src/modules/dataset/dataset.controller.ts`| `DatasetController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/dataset/*`, timeseries queries, market data lookups. |
| 35 | `backend/src/modules/dataset/dataset.service.ts` | `DatasetService.java` | `com.prolt.iex.service.market` | Retrieves 96-time-block datasets, handles date aggregation and volume stats. |
| 36 | `backend/src/modules/dataset/dataset.routes.ts` | `DatasetController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/dataset")`. |
| 37 | `backend/src/modules/dataset/dashboard.controller.ts`| `DashboardController.java`| `com.prolt.iex.web.controller` | Endpoints for `/api/dashboard/*`, summary widgets, regional heatmaps. |
| 38 | `backend/src/modules/dataset/dashboard.service.ts`| `DashboardService.java` | `com.prolt.iex.service.market` | Aggregates DAM/GDAM/RTM averages and demand summaries via virtual threads. |
| 39 | `backend/src/modules/dataset/dashboard.routes.ts`| `DashboardController.java`| `com.prolt.iex.web.controller` | `@RequestMapping("/api/dashboard")`. |
| 40 | `backend/src/modules/dataset/npp-adjustment.service.ts`| `NppAdjustmentService.java`| `com.prolt.iex.service.ingestion`| Linear interpolation and alignment algorithm for 96-block NPP demand metrics. |
| **Calculators & Tariff Modules** |
| 41 | `backend/src/modules/landing-price-calc/landing-price-calc.controller.ts` | `LandingPriceController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/landing-price-calc/*`. |
| 42 | `backend/src/modules/landing-price-calc/landing-price-calc.service.ts` | `LandingPriceService.java` | `com.prolt.iex.service.tariff` | Landed cost algorithm factoring CTU/ST loss, cross-subsidy, and banking charges. |
| 43 | `backend/src/modules/landing-price-calc/landing-price-calc.routes.ts` | `LandingPriceController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/landing-price-calc")`. |
| 44 | `backend/src/modules/savings-calculator/savings-calculator.controller.ts` | `SavingsCalculatorController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/savings-calculator/*`. |
| 45 | `backend/src/modules/savings-calculator/savings-calculator.service.ts` | `SavingsCalculatorService.java` | `com.prolt.iex.service.tariff` | Discom tariff comparison vs. IEX procurement across HV categories. |
| 46 | `backend/src/modules/savings-calculator/savings-calculator.export.ts` | `SavingsExcelExporter.java` | `com.prolt.iex.service.tariff` | Apache POI SXSSF spreadsheet generator streaming 96-block savings sheets. |
| 47 | `backend/src/modules/savings-calculator/savings-calculator.routes.ts` | `SavingsCalculatorController.java`| `com.prolt.iex.web.controller` | `@RequestMapping("/api/savings-calculator")`. |
| 48 | `backend/src/modules/savings-calculator-new/savings-calculator-new.controller.ts` | `SavingsCalculatorV2Controller.java`| `com.prolt.iex.web.controller` | Endpoints for `/api/savings-calculator-new/*` (v2 refactored logic). |
| 49 | `backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts` | `SavingsCalculatorV2Service.java`| `com.prolt.iex.service.tariff` | Updated tariff engine supporting green energy open access and banking rules. |
| 50 | `backend/src/modules/savings-calculator-new/savings-calculator-new.export.ts` | `SavingsExcelExporterV2.java` | `com.prolt.iex.service.tariff` | Updated Excel generation matching v2 schema breakdown. |
| 51 | `backend/src/modules/savings-calculator-new/savings-calculator-new.routes.ts` | `SavingsCalculatorV2Controller.java`| `com.prolt.iex.web.controller`| `@RequestMapping("/api/savings-calculator-new")`. |
| **Trader Performance Modules** |
| 52 | `backend/src/modules/trader-performance/trader-performance.controller.ts` | `TraderPerformanceController.java`| `com.prolt.iex.web.controller` | Endpoints for `/api/trader-performance/*`. |
| 53 | `backend/src/modules/trader-performance/trader-performance.service.ts` | `TraderPerformanceService.java` | `com.prolt.iex.service.market` | Analyzes executed bid volume, cleared volume, and slippage metrics. |
| 54 | `backend/src/modules/trader-performance/trader-performance.export.ts` | `TraderPerformanceExporter.java`| `com.prolt.iex.service.market` | Generates summary Excel audits of trader executions. |
| 55 | `backend/src/modules/trader-performance/trader-performance.routes.ts` | `TraderPerformanceController.java`| `com.prolt.iex.web.controller` | `@RequestMapping("/api/trader-performance")`. |
| 56 | `backend/src/modules/trader-performance-daily/trader-performance-daily.controller.ts`| `TraderDailyController.java`| `com.prolt.iex.web.controller` | Daily aggregated trader metrics. |
| 57 | `backend/src/modules/trader-performance-daily/trader-performance-daily.service.ts`| `TraderDailyService.java` | `com.prolt.iex.service.market` | Computes rolling daily win/loss ratios and market clearing efficiency. |
| 58 | `backend/src/modules/trader-performance-daily/trader-performance-daily.routes.ts`| `TraderDailyController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/trader-performance-daily")`. |
| **Proposal Generation Module** |
| 59 | `backend/src/modules/proposal/proposal.controller.ts` | `ProposalController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/proposals/*` and `/api/proposal/*`. |
| 60 | `backend/src/modules/proposal/proposal.service.ts` | `ProposalService.java` | `com.prolt.iex.service.proposal`| Orchestrates document generation, table formatting, and financial calculations. |
| 61 | `backend/src/modules/proposal/chartGenerator.service.ts`| `ChartGeneratorService.java` | `com.prolt.iex.service.proposal`| Renders high-resolution chart PNGs (JFreeChart) embedded into Word tables. |
| 62 | `backend/src/modules/proposal/proposal.routes.ts` | `ProposalController.java` | `com.prolt.iex.web.controller` | Dual-mount routes for proposal endpoints. |
| 63 | `backend/src/modules/proposal/dashboard.css` | *Embedded Template Asset* | `src/main/resources/templates` | CSS styles for HTML proposal preview rendering. |
| **Scraper, Ingestion & Webhook Module** |
| 64 | `backend/src/modules/scraper/scraper.controller.ts` | `ScraperController.java` | `com.prolt.iex.web.controller` | Manual trigger and webhook endpoints for `/api/scraper/*`. |
| 65 | `backend/src/modules/scraper/scraper.service.ts` | `ScraperService.java` | `com.prolt.iex.service.ingestion`| Headless browser automation via Playwright for Java. |
| 66 | `backend/src/modules/scraper/scraper.routes.ts` | `ScraperController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/scraper")` with webhook secret filter. |
| **Market Operations & UP Market** |
| 67 | `backend/src/modules/market-operations/market-operations.controller.ts` | `MarketOpsController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/market-operations/*`. |
| 68 | `backend/src/modules/market-operations/market-operations.service.ts` | `MarketOpsService.java` | `com.prolt.iex.service.market` | Operational workflow management for trade scheduling. |
| 69 | `backend/src/modules/market-operations/market-operations.routes.ts` | `MarketOpsController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/market-operations")`. |
| 70 | `backend/src/modules/up-market/up-market.controller.ts` | `UpMarketController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/up-market/*` (Uttar Pradesh telemetry). |
| 71 | `backend/src/modules/up-market/up-market.service.ts` | `UpMarketService.java` | `com.prolt.iex.service.market` | Regional bid area clearing comparisons and telemetry feeds. |
| 72 | `backend/src/modules/up-market/up-market.routes.ts` | `UpMarketController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/up-market")`. |
| **Upload & Processing Module** |
| 73 | `backend/src/modules/upload/upload.controller.ts` | `UploadController.java` | `com.prolt.iex.web.controller` | Multipart file upload endpoint `/api/upload`. |
| 74 | `backend/src/modules/upload/upload.routes.ts` | `UploadController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/upload")` with rate limit. |
| 75 | `backend/src/modules/upload/upload.types.ts` | `UploadDTOs.java` (Records) | `com.prolt.iex.web.dto` | File metadata records, parsing status enums. |
| 76 | `backend/src/modules/upload/upload.validation.ts` | `FileUploadValidator.java` | `com.prolt.iex.common.validation`| Validates file format and headers. |
| 77 | `backend/src/modules/upload-processing/upload-processing.service.ts`| `UploadProcessingService.java`| `com.prolt.iex.service.ingestion`| Selects appropriate parser, coordinates transactional persistence. |
| 78 | `backend/src/modules/upload-processing/upload-processing.types.ts` | `ParserTypes.java` | `com.prolt.iex.service.ingestion`| Interfaces for parsed spreadsheet rows. |
| 79 | `backend/src/modules/upload-processing/parsers/base.parser.ts` | `AbstractSpreadsheetParser.java` | `com.prolt.iex.service.ingestion`| Base Apache POI streaming parser with date formatting utilities. |
| 80 | `backend/src/modules/upload-processing/parsers/dam.parser.ts` | `DamSpreadsheetParser.java` | `com.prolt.iex.service.ingestion`| Specific 96-block parser for DAM Excel formats. |
| 81 | `backend/src/modules/upload-processing/parsers/gdam.parser.ts` | `GdamSpreadsheetParser.java` | `com.prolt.iex.service.ingestion`| Specific parser for GDAM Excel sheets. |
| 82 | `backend/src/modules/upload-processing/parsers/rtm.parser.ts` | `RtmSpreadsheetParser.java` | `com.prolt.iex.service.ingestion`| Specific parser for RTM Excel sheets. |
| 83 | `backend/src/modules/upload-processing/parsers/rec.parser.ts` | `RecSpreadsheetParser.java` | `com.prolt.iex.service.ingestion`| Specific parser for Renewable Energy Certificate (REC) trade sheets. |
| 84 | `backend/src/modules/upload-processing/parsers/parser.factory.ts` | `SpreadsheetParserFactory.java`| `com.prolt.iex.service.ingestion`| Factory returning correct parser based on market type. |
| **Data Transformation Module** |
| 85 | `backend/src/modules/transformation/transformation.service.ts` | `TransformationService.java` | `com.prolt.iex.service.market` | Transforms raw parsed rows into normalized database entities. |
| 86 | `backend/src/modules/transformation/transformation.types.ts` | `TransformationDTOs.java` | `com.prolt.iex.service.market` | Sealed interfaces for transformation records. |
| 87 | `backend/src/modules/transformation/transformers/base.transformer.ts` | `AbstractTransformer.java` | `com.prolt.iex.service.market` | Base normalization rules and currency conversions. |
| 88 | `backend/src/modules/transformation/transformers/dam.transformer.ts` | `DamTransformer.java` | `com.prolt.iex.service.market` | DAM normalization logic. |
| 89 | `backend/src/modules/transformation/transformers/gdam.transformer.ts` | `GdamTransformer.java` | `com.prolt.iex.service.market` | GDAM normalization logic. |
| 90 | `backend/src/modules/transformation/transformers/rtm.transformer.ts` | `RtmTransformer.java` | `com.prolt.iex.service.market` | RTM normalization logic. |
| 91 | `backend/src/modules/transformation/transformers/rec.transformer.ts` | `RecTransformer.java` | `com.prolt.iex.service.market` | REC normalization logic. |
| 92 | `backend/src/modules/transformation/transformers/transformer.factory.ts`| `TransformerFactory.java`| `com.prolt.iex.service.market` | Factory bean resolving appropriate transformer. |
| **Resource Center Module** |
| 93 | `backend/src/modules/resource-center/controllers/resource-center.controller.ts`| `ResourceCenterController.java`| `com.prolt.iex.web.controller`| Document management endpoints `/api/resource-center/*`. |
| 94 | `backend/src/modules/resource-center/services/resource-center.service.ts`| `ResourceCenterService.java`| `com.prolt.iex.service.document`| Uploads, categorizes, and serves regulatory documents. |
| 95 | `backend/src/modules/resource-center/routes/resource-center.routes.ts`| `ResourceCenterController.java`| `com.prolt.iex.web.controller`| `@RequestMapping("/api/resource-center")`. |
| 96 | `backend/src/modules/resource-center/validators/resource-center.validator.ts`| Jakarta Constraints | `com.prolt.iex.web.dto` | Validates category enums and metadata tags. |
| 97 | `backend/src/modules/resource-center/types/resource-center.types.ts`| `ResourceCenterDTOs.java` | `com.prolt.iex.web.dto` | DTO records for regulatory documents. |
| 98 | `backend/src/modules/resource-center/constants/resource-center.constants.ts`| `ResourceCategory.java` (Enum)| `com.prolt.iex.domain.document`| Enums for document categories (CERC, SERC, CTU, Grid Code). |
| 99 | `backend/src/modules/resource-center/index.ts` | *Spring Component Scan* | N/A | Handled natively by Spring Boot component scanning. |
| **Forecast Module** |
| 100 | `backend/src/modules/forecast/forecast.controller.ts` | `ForecastController.java` | `com.prolt.iex.web.controller` | Endpoints for `/api/forecast/*` and `/forecast/*`. |
| 101 | `backend/src/modules/forecast/forecast.service.ts` | `ForecastService.java` | `com.prolt.iex.service.forecast`| Evaluates machine learning procurement recommendations. |
| 102 | `backend/src/modules/forecast/forecast.routes.ts` | `ForecastController.java` | `com.prolt.iex.web.controller` | Dual-mount router configuration. |
| **Database & Auditing Services** |
| 103 | `backend/src/modules/database/database.controller.ts` | `DatabaseAdminController.java`| `com.prolt.iex.web.controller`| Schema introspection and maintenance endpoints. |
| 104 | `backend/src/modules/database/database.service.ts` | `DatabaseAdminService.java` | `com.prolt.iex.service.admin` | Table row counts and database health metrics. |
| 105 | `backend/src/modules/database/database.routes.ts` | `DatabaseAdminController.java`| `com.prolt.iex.web.controller`| `@RequestMapping("/api/database")`. |
| 106 | `backend/src/modules/database/holiday.service.ts` | `HolidayService.java` | `com.prolt.iex.service.market` | National and banking holiday calendar lookups. |
| 107 | `backend/src/modules/api-log/api-log.controller.ts` | `ApiLogController.java` | `com.prolt.iex.web.controller` | Endpoints for viewing system execution logs. |
| 108 | `backend/src/modules/api-log/api-log.service.ts` | `ApiLogService.java` | `com.prolt.iex.service.admin` | Queries the `ApiLog` audit entity. |
| 109 | `backend/src/modules/api-log/api-log.routes.ts` | `ApiLogController.java` | `com.prolt.iex.web.controller` | `@RequestMapping("/api/api-log")`. |
| 110 | `backend/src/modules/persistence/persistence.service.ts`| `PersistenceService.java` | `com.prolt.iex.service.market` | Transactional persistence coordinator (`@Transactional`). |
| 111 | `backend/src/modules/persistence/persistence.types.ts` | `PersistenceDTOs.java` | `com.prolt.iex.service.market` | Persistence result records. |
| **Core External Services & Schedulers** |
| 112 | `backend/src/services/cron.service.ts` | `CronJobScheduler.java` | `com.prolt.iex.service.scheduled`| Spring `@Scheduled` methods with ShedLock distributed locking. |
| 113 | `backend/src/services/scraper.service.ts` | `VidyutPravahScraper.java` & `NppScraper.java`| `com.prolt.iex.service.ingestion`| Outbound HTTP clients fetching government demand met telemetry. |
| 114 | `backend/src/services/iex-scraper.service.ts` | `IexPortalScraper.java` | `com.prolt.iex.service.ingestion`| Headless browser automation fetching DAM/GDAM/RTM HTML snapshots. |
| 115 | `backend/src/services/starrocks.service.ts` | `StarRocksService.java` | `com.prolt.iex.service.telemetry`| Secondary `JdbcTemplate` querying StarRocks OLAP on port 9030. |
| 116 | `backend/src/services/weather.service.ts` | `WeatherService.java` | `com.prolt.iex.service.weather` | Spring `RestClient` querying Open-Meteo API with Resilience4j retry. |
| 117 | `backend/src/services/email-alert.service.ts` | `EmailAlertService.java` | `com.prolt.iex.service.notification`| Dispatches alert emails via Spring `JavaMailSender`. |
| 118 | `backend/src/services/audit-log.service.ts` | `AuditLogService.java` | `com.prolt.iex.service.admin` | Async audit logging service (`@Async`). |
| **Scripts, Seeders & Utilities** |
| 119 | `backend/src/scripts/seed-ctu.ts` | `CtuDataSeeder.java` | `com.prolt.iex.service.scheduled`| Monthly automated task or CLI seeder populating CTU charges. |
| 120 | `backend/src/scripts/seed_tariff.ts` | `V1__Seed_Tariff_Data.sql` | `src/main/resources/db/migration`| Converted into versioned Flyway database migration. |
| 121 | `backend/src/scripts/seed_tariff_new.ts` | `V2__Seed_Updated_Tariffs.sql` | `src/main/resources/db/migration`| Versioned Flyway migration populating updated tariffs. |
| 122 | `backend/src/scripts/seedCityStateData.ts`| `V3__Seed_City_State_Data.sql`| `src/main/resources/db/migration`| Flyway migration populating monitored cities and coordinates. |
| 123 | `backend/src/scripts/seedRtmSnapshot.ts` | `RtmSnapshotSeeder.java` | `com.prolt.iex.service.ingestion`| Scheduled or on-demand RTM seeding runner. |
| 124 | `backend/src/scripts/seed-weather.ts` | `WeatherHistoricalSeeder.java`| `com.prolt.iex.service.weather` | One-off historical weather ingestion utility. |
| 125 | `backend/src/scripts/scrapeHistoricalRTM.ts`| `RtmHistoryScraper.java` | `com.prolt.iex.service.ingestion`| Batch historical scraping runner. |
| 126 | `backend/src/scripts/scrapeAllNow.ts` | `ManualScrapeRunner.java` | `com.prolt.iex.service.ingestion`| CLI or admin-triggered scrape of all active markets. |
| 127 | `backend/src/scripts/scrapeLandedCosts.ts`| `LandedCostScraper.java` | `com.prolt.iex.service.tariff` | Ingests official IEX landed cost calculator tables. |
| 128 | `backend/src/scripts/triggerHourlyForecastSync.ts`| `HourlyForecastRunner.java`| `com.prolt.iex.service.weather` | Triggers immediate weather sync cycle. |
| 129 | `backend/src/scripts/check-excel.ts` | `ExcelVerificationTool.java` | `com.prolt.iex.util` | Developer utility verifying Excel cell formats. |
| 130 | `backend/scripts/generate_commercial_proposal.py`| `ProposalGenerator.java` | `com.prolt.iex.service.proposal`| Re-implemented natively in Java via Apache POI XWPF. |
| 131 | `backend/scripts/generate_technical_proposal.py` | `ProposalGenerator.java` | `com.prolt.iex.service.proposal`| Re-implemented natively in Java via Apache POI XWPF. |
| 132 | `backend/scripts/parse_trade_report.py` | `TradeReportPdfParser.java` | `com.prolt.iex.service.market` | Re-implemented in Java via Apache PDFBox. |
| 133 | `backend/scripts/up_market_sync.py` | `UpMarketSyncService.java` | `com.prolt.iex.service.market` | Re-implemented via Spring `RestClient` to IEX SOAP web service. |
| 134 | `backend/scripts/predict_market_selection.py`| `ForecastMlClient.java` | `com.prolt.iex.service.forecast`| Invokes LightGBM model via ONNX Runtime for Java (`ai.onnxruntime`). |
| 135 | `backend/scripts/db_backup.sh` | Shell Script / AWS RDS Backup | `infra/scripts` | Retained as operational shell script or replaced by cloud-native RDS snapshots. |
| 136 | `backend/prisma/schema.prisma` | JPA Entities & Flyway Migrations | `com.prolt.iex.domain.*` & `db/migration`| Converted into 58 JPA entity classes and Flyway baseline SQL script. |
| 137 | `backend/prisma/seed.ts` | `V4__Seed_Initial_Admin_Data.sql`| `src/main/resources/db/migration`| Flyway migration creating default admin user, roles, and reference tables. |
| 138 | `deploy.sh` | GitHub Actions Workflow | `.github/workflows/deploy.yml` | Replaced by automated CI/CD pipeline building Docker containers. |

---

## 4. Java 21 Feature Adoption Matrix

| Java 21 Feature | Where to Apply (Recommended Usage) | Where NOT to Apply (Antipatterns & Restrictions) |
|---|---|---|
| **Virtual Threads (Project Loom)** | • Controller request handling (`spring.threads.virtual.enabled: true`).<br>• Outbound HTTP client calls to Open-Meteo, NPP, and Vidyut Pravah.<br>• Scheduled background tasks via `Executors.newVirtualThreadPerTaskExecutor()`. | • **Do NOT use inside synchronized blocks** (can cause thread pinning on carrier threads; use `ReentrantLock` instead).<br>• **Do NOT use for CPU-bound tasks** (e.g. massive PDF rasterization). |
| **Records (`record`)** | • All HTTP Request and Response DTOs.<br>• Configuration property classes.<br>• Internal calculation parameter containers (e.g. `LandedCostParameters`).<br>• Read-only projection queries from Spring Data JPA. | • **Do NOT use for JPA entities** (JPA entities require mutable state, no-arg constructors, and proxying which records forbid). |
| **Sealed Interfaces (`sealed / permits`)** | • Polymorphic market records: `sealed interface MarketRecord permits DamRecord, GdamRecord, RtmRecord`.<br>• Spreadsheet row parsing results: `sealed interface ParsedRow permits ValidRow, InvalidRow`. | • Do NOT use for generic service interfaces or open extension points where third-party implementations may be needed. |
| **Pattern Matching for `switch`** | • Market type dispatching in transformers and parsers.<br>• Error mapping in global exception handlers.<br>• Landed cost formula dispatching based on voltage level. | • Do NOT use complex nested guard conditions (`when ...`) that obscure business readability. Keep clauses simple. |
| **Sequenced Collections (`SequencedCollection`)** | • 96-time-block time series (accessing `getFirst()` for block 1 and `getLast()` for block 96).<br>• Chronological tariff history lookups. | • Do NOT use where order is undefined (e.g. unordered `HashSet`). |
| **String Templates (Preview / Text Blocks)** | • Multi-line SQL native queries in `@Query(nativeQuery = true)`.<br>• Raw JSON test payloads in integration test fixtures. | • Do NOT use string concatenation for user input in SQL (always use bind variables `:param` to prevent SQL injection). |

---

## 5. Phased Migration Order & Dependency Plan

```
  +-------------------------------------------------------------------------+
  | Phase 1: Core Foundation & Flyway Baseline (Weeks 1-2)                   |
  | - Spring Boot 3 & Java 21 setup, Flyway schema (58 tables), JPA entities|
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | Phase 2: Security & Identity Subsystem (Weeks 3-4)                      |
  | - Spring Security 6, JWT Filter, Redis OTP Service, RBAC Guards         |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | Phase 3: Market Telemetry & Ingestion Pipelines (Weeks 5-6)             |
  | - Playwright scraper, NPP/Vidyut Pravah REST, StarRocks OLAP, Redis     |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | Phase 4: Tariff Engine & Calculation Services (Weeks 7-8)               |
  | - 96-block landed cost, savings calculator v1/v2, BigDecimal arithmetic |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | Phase 5: Document Generation & Proposal Subsystem (Weeks 9-10)          |
  | - Native Java Apache POI Word generation, JFreeChart PNGs, PDFBox       |
  +-------------------------------------------------------------------------+
                                       |
                                       v
  +-------------------------------------------------------------------------+
  | Phase 6: Full Parity Verification & Zero-Downtime Cutover (Weeks 11-12) |
  | - Dual-run HTTP diffing, Testcontainers, Actuator, Blue-Green Deployment|
  +-------------------------------------------------------------------------+
```

### Phase Details & Definitions of Done

#### Phase 1: Core Foundation, Database Schema & JPA Domain Model
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** None.
- **Scope:**
  - Initialize Maven project with Spring Boot 3.3.x and Java 21.
  - Convert `backend/prisma/schema.prisma` into Flyway baseline SQL scripts (`V1__Initial_Schema.sql`).
  - Create all 58 JPA entity classes with Hibernate mapping annotations.
  - Setup secondary `DataSource` for StarRocks OLAP.
- **Definition of Done (DoD):**
  - Application boots successfully against a clean PostgreSQL 17 database.
  - Flyway migrations execute with zero syntax errors.
  - Spring Data JPA repositories pass basic CRUD unit tests using Testcontainers.

#### Phase 2: Security, Authentication & User Management
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** Phase 1 complete.
- **Scope:**
  - Implement `SecurityFilterChain`, `JwtAuthenticationFilter`, and `BCryptPasswordEncoder`.
  - Implement Redis-backed `OtpService` (with configurable backdoor profile).
  - Implement `UserController` and `AuthController`.
  - Add Bucket4j rate limiting filter.
- **Definition of Done (DoD):**
  - Pass Parity Test Scenarios: `AUTH-01`, `AUTH-02`, `AUTH-03`, `USER-01` from [Document 12](file:///Users/yashgupta/IEX-Dashboard/docs/migration/12-test-baseline.md).
  - JWT tokens issued by Spring Boot authenticate successfully against existing React frontend.

#### Phase 3: Market Telemetry, Scrapers & Background Schedulers
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** Phases 1 & 2 complete.
- **Scope:**
  - Implement `Playwright` headless browser scraper for DAM, GDAM, RTM.
  - Implement NPP, Vidyut Pravah, and Open-Meteo REST clients via Spring `RestClient`.
  - Configure Spring `@Scheduled` jobs with ShedLock on Redis.
  - Implement `/api/dataset/*` and `/api/dashboard/*` controllers.
- **Definition of Done (DoD):**
  - Pass Parity Test Scenarios: `DATA-01`, `SCRAPE-01`.
  - Headless scraper successfully extracts 96 blocks from IEX website in test container.
  - ShedLock prevents duplicate job execution across multi-instance deployment.

#### Phase 4: Tariff Engines & Business Calculations
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** Phases 1, 2 & 3 complete.
- **Scope:**
  - Implement `LandingPriceService` and `SavingsCalculatorService` using `BigDecimal`.
  - Implement Apache POI SXSSF streaming spreadsheet export.
  - Implement `/api/landing-price-calc/*` and `/api/savings-calculator/*` endpoints.
- **Definition of Done (DoD):**
  - Pass Parity Test Scenario: `CALC-01`.
  - Dual-run diffing test achieves 100% calculation parity with legacy Node.js results within `0.0001` Rupee tolerance.

#### Phase 5: Proposal Generation & Document Subsystems
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** Phase 4 complete.
- **Scope:**
  - Re-implement commercial and technical Word proposals in pure Java using Apache POI XWPF.
  - Re-implement chart image rendering via JFreeChart.
  - Replace Python PDF extraction with Apache PDFBox.
  - Eliminate external Python runtime dependencies entirely.
- **Definition of Done (DoD):**
  - Generated `.docx` proposals match the formatting, typography, and image placement of the original templates pixel-for-pixel.
  - Backend Dockerfile builds without Python or pip packages.

#### Phase 6: Parity Verification, Observability & Cutover
- **Effort:** 2 Weeks (80 Engineer-Hours).
- **Dependencies:** All prior phases complete.
- **Scope:**
  - Execute automated contract testing against `openapi.yaml`.
  - Run continuous dual-run HTTP diffing proxy for 7 calendar days on production traffic mirror.
  - Setup Micrometer Prometheus metrics and Actuator health probes.
  - Execute Blue-Green cutover on AWS EC2.
- **Definition of Done (DoD):**
  - Zero contract violations against OpenAPI 3.0 specification.
  - Zero critical diff errors during 7-day shadow traffic evaluation.
  - Production DNS successfully cut over to Spring Boot container with zero reported user downtime.
