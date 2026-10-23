# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 05: Configuration, Environment Variables & Spring Profiles

## 1. Executive Summary & Configuration Management
Configuration in the Prolt Energy platform is centralized in [`backend/src/config/index.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts) using `dotenv` to load values from `.env`.

This document catalog lists every environment variable utilized across Node.js runtime code, Python execution scripts, Docker deployment containers, and frontend bundles.

---

## 2. Exhaustive Environment Variables Catalog (27 Variables)

| Variable Name | Data Type | Required? | Default Value | Purpose | Files Utilizing Variable |
|---|---|---|---|---|---|
| `PORT` | Integer | Optional | `5000` (Docker: `8080`) | HTTP server listening port | [`backend/src/config/index.ts:L27`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L27), [`backend/src/server.ts:L14`](file:///Users/yashgupta/IEX-Dashboard/backend/src/server.ts#L14), [`backend/Dockerfile:L74`](file:///Users/yashgupta/IEX-Dashboard/backend/Dockerfile#L74) |
| `NODE_ENV` | String | Optional | `development` | Controls debug logging, stack trace exposure, and cron safety checks | [`backend/src/config/index.ts:L26`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L26), [`backend/src/app.ts:L45`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L45), [`backend/src/middleware/errorHandler.ts:L10`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/errorHandler.ts#L10), [`backend/src/services/cron.service.ts:L27`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L27) |
| `DATABASE_URL` | String (URI) | **Required** | None (Fatal if absent) | Primary PostgreSQL connection string | [`backend/src/config/prisma.ts:L12`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts#L12), [`backend/prisma/schema.prisma:L8`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/schema.prisma#L8), [`backend/scripts/up_market_sync.py:L67`](file:///Users/yashgupta/IEX-Dashboard/backend/scripts/up_market_sync.py#L67), [`backend/scripts/db_backup.sh:L16`](file:///Users/yashgupta/IEX-Dashboard/backend/scripts/db_backup.sh#L16) |
| `BACKUP_DATABASE_URL` | String (URI) | Optional | None | Standby PostgreSQL connection string for automatic client failover | [`backend/src/config/prisma.ts:L32`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts#L32) |
| `REDIS_URL` | String (URI) | Optional | `redis://localhost:6379` | Distributed Redis instance for calculator and dashboard caching | [`backend/src/config/redis.ts:L4`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/redis.ts#L4), [`backend/clear_cache.js:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/clear_cache.js#L5), [`backend/docker-compose.yml:L55`](file:///Users/yashgupta/IEX-Dashboard/backend/docker-compose.yml#L55) |
| `JWT_SECRET` | String | **Required** | None (Throws fatal error at boot if unset) | HMAC-SHA256 secret key for signing user authentication JWT tokens | [`backend/src/config/index.ts:L20-L23`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L20-L23), [`backend/src/generate_swagger.ts:L4`](file:///Users/yashgupta/IEX-Dashboard/backend/src/generate_swagger.ts#L4) |
| `JWT_EXPIRES_IN` | String | Optional | `7d` | Token expiration lifespan | [`backend/src/config/index.ts:L30`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L30) |
| `CORS_ORIGIN` | String | Optional | `*` | Permitted origin domain(s) for CORS, comma-separated | [`backend/src/config/index.ts:L32-L36`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L32-L36), [`backend/src/app.ts:L37`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L37) |
| `RUN_SCRAPER` | Boolean String | Optional | `false` | Master toggle: when `true`, initializes background node-cron scrapers | [`backend/src/config/index.ts:L37`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L37), [`backend/src/services/cron.service.ts:L19`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L19) |
| `WEBHOOK_RECEIVERS` | String | Optional | `""` | Comma-delimited webhook subscriber URLs for notification events | [`backend/src/config/index.ts:L38-L40`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L38-L40) |
| `WEBHOOK_SECRET` | String | Optional | `super_secret_webhook_token_123` | Security token for `/api/scraper/import` webhook header verification | [`backend/src/config/index.ts:L41`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/index.ts#L41), [`backend/src/modules/scraper/scraper.controller.ts:L78`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.controller.ts#L78) |
| `ADMIN_USERNAME` | String | Optional | `admin` | Initial Super Admin username used during database seeding | [`backend/prisma/seed.ts:L105`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L105), [`backend/prisma/seed.js:L93`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.js#L93) |
| `ADMIN_EMAIL` | String | Optional | `admin@iexdashboard.local` | Initial Super Admin email used during database seeding | [`backend/prisma/seed.ts:L106`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L106), [`backend/prisma/seed.js:L94`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.js#L94) |
| `ADMIN_PASSWORD` | String | Optional | `admin` | Initial Super Admin plaintext password (hashed with bcrypt salt 10) | [`backend/prisma/seed.ts:L107`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.ts#L107), [`backend/prisma/seed.js:L95`](file:///Users/yashgupta/IEX-Dashboard/backend/prisma/seed.js#L95) |
| `SMTP_HOST` | String | Optional | `localhost` | Mail server hostname for OTP and missing tariff alert emails | [`backend/src/modules/auth/otp.service.ts:L10`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L10), [`backend/src/services/email-alert.service.ts:L12`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts#L12), [`backend/test_smtp.js:L6`](file:///Users/yashgupta/IEX-Dashboard/backend/test_smtp.js#L6) |
| `SMTP_PORT` | Integer | Optional | `587` | Mail server port | [`backend/src/modules/auth/otp.service.ts:L11`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L11), [`backend/src/services/email-alert.service.ts:L13`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts#L13) |
| `SMTP_USER` | String | Optional | None | Mail server authentication user | [`backend/src/modules/auth/otp.service.ts:L14`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L14), [`backend/src/services/email-alert.service.ts:L16`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts#L16) |
| `SMTP_PASS` | String | Optional | None | Mail server authentication password | [`backend/src/modules/auth/otp.service.ts:L15`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L15), [`backend/src/services/email-alert.service.ts:L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/email-alert.service.ts#L17) |
| `SMTP_FROM` | String | Optional | `no-reply@proltenergy.com` | Outgoing From header address for system notifications | [`backend/src/modules/auth/otp.service.ts:L19`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L19), [`backend/test_smtp.js:L15`](file:///Users/yashgupta/IEX-Dashboard/backend/test_smtp.js#L15) |
| `ACCUWEATHER_API_KEY` | String | Optional | None | Third-party AccuWeather API secret for fetching forecast metrics | [`backend/.env.example:L36`](file:///Users/yashgupta/IEX-Dashboard/backend/.env.example#L36), [`backend/src/services/weather.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/weather.service.ts) |
| `IEX_CALCULATOR_API_URL` | String (URL) | Optional | Official IEX API endpoint | Base URL for fetching comparative TOD landed cost calculations | [`backend/src/modules/landing-price-calc/landing-price-calc.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts) |
| `PUPPETEER_EXECUTABLE_PATH` | String (Path) | Optional | `/usr/bin/chromium` | System path to headless Chromium executable | [`backend/src/modules/scraper/scraper.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.service.ts), [`backend/Dockerfile:L77`](file:///Users/yashgupta/IEX-Dashboard/backend/Dockerfile#L77) |
| `STARROCKS_HOST` | String | Optional | `prolt-prod-starrocks.probussense.com` | Hostname for StarRocks OLAP database | [`backend/src/services/starrocks.service.ts:L9`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L9) |
| `STARROCKS_PORT` | Integer | Optional | `9030` | MySQL protocol port for StarRocks connection | [`backend/src/services/starrocks.service.ts:L10`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L10) |
| `STARROCKS_USER` | String | Optional | `read_only_user` | StarRocks database user | [`backend/src/services/starrocks.service.ts:L11`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L11) |
| `STARROCKS_PASSWORD` | String | Optional | `Probus@123` | StarRocks database password | [`backend/src/services/starrocks.service.ts:L12`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L12) |
| `STARROCKS_DATABASE` | String | Optional | `prolt_hes_db` | StarRocks default database name | [`backend/src/services/starrocks.service.ts:L13`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/starrocks.service.ts#L13) |

---

## 3. Per-Environment Matrix (Dev vs Test vs Prod)

| Setting / Variable | Local Development (`dev`) | Automated Test (`test`) | Production (`prod`) |
|---|---|---|---|
| `NODE_ENV` | `development` | `test` | `production` |
| `PORT` | `5000` | In-memory ephemeral port | `8080` (Container) mapped to `5001` (Host) |
| `DATABASE_URL` | `postgresql://localhost:5432/Prolt_Operations` | In-memory PostgreSQL / Testcontainers | Remote cluster `postgresql://postgres:***@13.206.77.155:5432/Prolt_Operations` |
| `BACKUP_DATABASE_URL` | None | None | Standby cluster connection URI |
| `REDIS_URL` | `redis://localhost:6379` | Mocked Redis / Testcontainers | `redis://iex-redis:6379` |
| `RUN_SCRAPER` | `false` (Avoids unintended web crawling) | `false` | `true` (Runs production 11-job schedule) |
| `CORS_ORIGIN` | `http://localhost:5173, http://localhost:8081` | `*` | `https://dashboard.proltenergy.com` |
| `PUPPETEER_EXECUTABLE_PATH` | Local Chrome (`/Applications/Google Chrome.app/...`) | Mocked | `/usr/bin/chromium` |
| Error Details in JSON | Full stack trace exposed | Full stack trace exposed | Sanitized generic message (`isOperational` check) |

---

## 4. Proposed Mapping to Spring Boot `application.yml` & Profiles

In the target Java Spring Boot architecture, these environment configurations map into a standard multi-profile configuration (`application.yml`, `application-dev.yml`, `application-prod.yml`):

### 4.1 Master `application.yml`
```yaml
server:
  port: ${PORT:8080}
  compression:
    enabled: true
    mime-types: application/json,text/html,text/xml,text/plain,application/javascript,text/css

spring:
  application:
    name: iex-analytics-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  datasource:
    # Multi-host PostgreSQL JDBC failover URL replacing Node.js Proxy failover
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/Prolt_Operations}
    username: ${POSTGRES_USER:postgres}
    password: ${POSTGRES_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: public
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          batch_size: 50
          order_inserts: true
          order_updates: true

  data:
    redis:
      url: ${REDIS_URL:redis://localhost:6379}
      timeout: 2000ms

  mail:
    host: ${SMTP_HOST:localhost}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USER:}
    password: ${SMTP_PASS:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

app:
  jwt:
    secret: ${JWT_SECRET}
    expires-in: ${JWT_EXPIRES_IN:7d}
  cors:
    allowed-origins: ${CORS_ORIGIN:*}
  scheduler:
    run-scrapers: ${RUN_SCRAPER:false}
  webhook:
    secret: ${WEBHOOK_SECRET:super_secret_webhook_token_123}
  starrocks:
    host: ${STARROCKS_HOST:prolt-prod-starrocks.probussense.com}
    port: ${STARROCKS_PORT:9030}
    username: ${STARROCKS_USER:read_only_user}
    password: ${STARROCKS_PASSWORD:Probus@123}
    database: ${STARROCKS_DATABASE:prolt_hes_db}
```

### 4.2 Production Profile `application-prod.yml`
```yaml
spring:
  config:
    activate:
      on-profile: prod

  datasource:
    # Native JDBC failover: Automatically connects to secondary if primary node fails
    url: jdbc:postgresql://${POSTGRES_HOST:13.206.77.155}:${POSTGRES_PORT:5432},${POSTGRES_BACKUP_HOST:13.206.77.155}:${POSTGRES_BACKUP_PORT:5433}/${POSTGRES_DB:Prolt_Operations}?targetServerType=primary

app:
  scheduler:
    run-scrapers: true
```
