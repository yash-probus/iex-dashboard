# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 13: Build, Deployment & CI/CD Pipelines

## 1. Executive Summary & Verification Check
This document analyzes the build scripts, containerization specifications, orchestration manifests, deployment mechanisms, and observability architecture of the existing **Prolt Energy / IEX Analytics Dashboard**, and details the corresponding **Java 21 / Spring Boot 3 enterprise build, CI/CD, and runtime deployment strategy**.

---

## 2. Current Node.js Build & Deployment Architecture

### 2.1 Package Scripts Inventory ([`backend/package.json:L6-L19`](file:///Users/yashgupta/IEX-Dashboard/backend/package.json#L6-L19))
| Script Name | Command | Purpose & Execution Behavior |
|---|---|---|
| `swagger` | `ts-node src/generate_swagger.ts` | Runs `swagger-autogen` to produce `src/swagger_output.json`. |
| `dev` | `npm run swagger && nodemon --watch src --ext ts,json --exec ts-node src/server.ts` | Development server with hot reloading watching TypeScript source files. |
| `build` | `npm run swagger && tsc && cp src/swagger_output.json dist/swagger_output.json` | Production build: generates swagger, compiles TypeScript via `tsc`, copies swagger JSON into `dist/`. |
| `start` | `node dist/server.js` | Runs compiled JavaScript server in production. |
| `lint` | `echo "Linting not yet configured"` | Dummy command; code linting is unconfigured in CI. |
| `seed:npp` | `ts-node scripts/seed2YearsNppDemand.ts` | Ingestion script seeding 2 years of NPP demand historical data. |
| `seed:lmv` | `ts-node scripts/seed-lmv-1-10.ts` | Populates Low & Medium Voltage tariff tables. |
| `seed:weather` | `ts-node scripts/seed2YearsWeather.ts` | Seeds historical weather telemetry into database. |
| `seed:state-demand` | `ts-node scripts/seedHistoricalStateDemand.ts` | Seeds historical Vidyut Pravah demand met records. |
| `seed:rtm` | `ts-node src/scripts/seedRtmSnapshot.ts` | Fetches single RTM snapshot into dataset. |
| `scrape:rtm-history` | `ts-node src/scripts/scrapeHistoricalRTM.ts` | Batch scrape of past RTM market days. |
| `test` | `jest` | Executes unit tests via Jest (currently only 1 test file). |

---

### 2.2 Dockerfile Analysis ([`backend/Dockerfile`](file:///Users/yashgupta/IEX-Dashboard/backend/Dockerfile))
The backend Dockerfile uses a 2-stage multi-stage build on `node:20-slim`:
- **Stage 1 (Builder, lines 1-29):**
  - Installs `openssl` for Prisma schema engine.
  - Copies package manifests and `prisma/schema.prisma`.
  - Runs `npm ci`, `npx prisma generate`, and `npm run build`.
- **Stage 2 (Production Runner, lines 31-81):**
  - Installs substantial host-level binary dependencies: `openssl`, `ca-certificates`, `chromium` (for Puppeteer), `postgresql-client`, and the Python 3 runtime stack: `python3`, `python3-pip`, `python3-numpy`, `python3-pandas`, `python3-scipy`, `python3-sklearn`.
  - Installs Python packages via pip: `lightgbm`, `python-docx`, `SQLAlchemy`, `psycopg2-binary`, `python-dotenv`, `pdfplumber`, `requests`, `python-dateutil`.
  - Copies compiled JavaScript from Stage 1 (`dist/`), Prisma binaries (`node_modules/.prisma`), templates (`assets/`), and Python scripts (`scripts/`).
  - Sets runtime environment: `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`, `TZ=Asia/Kolkata`, `PORT=5000`.
  - Starts server via `CMD ["node", "dist/server.js"]`.
- **Critique & Vulnerabilities:** The current container image is excessively large (~1.8 GB) due to bundling Node.js runtime, Chromium headless browser, and complete Python machine learning stacks inside a single container image.

---

### 2.3 Container Orchestration & Compose Setup
Two Docker Compose files govern backend infrastructure:
1. **[`backend/docker-compose.yml`](file:///Users/yashgupta/IEX-Dashboard/backend/docker-compose.yml):**
   - **`iex-postgres`:** PostgreSQL 16/17 with healthcheck `pg_isready -U postgres -d Prolt_Operations` every 5 seconds.
   - **`iex-redis`:** Redis 7-alpine on port 6379 with persistent volume `redis_data`.
   - **`iex-backend`:** Builds `Dockerfile`, maps port `5001:8080` (or `5000:5000`), depends on healthy PostgreSQL and started Redis.
   - **Healthcheck:** Evaluates HTTP `GET http://localhost:8080/health` via an inline Node one-liner every 15s.
2. **[`backend/docker-compose.remote.yml`](file:///Users/yashgupta/IEX-Dashboard/backend/docker-compose.remote.yml):**
   - Simplified production deployment variant embedding hardcoded DB password `iex_sec_k9P2mX_2026`.

---

### 2.4 CI/CD Pipelines & Server Deployment Reality
- **CI/CD Pipeline Status:** There are **no automated GitHub Actions, GitLab CI, or CircleCI pipelines** in the repository.
- **Production Server Deployment Target:**
  - Deployment Host: AWS EC2 Ubuntu instance at IP `13.203.106.159` ([`docs/deployment.md:L7`](file:///Users/yashgupta/IEX-Dashboard/docs/deployment.md#L7)).
  - Production Path: `/mnt/storage/iex-dashboard-new`
  - Dev/Staging Path: `/home/ubuntu/iex-dashboard`
- **Deployment Script ([`deploy.sh`](file:///Users/yashgupta/IEX-Dashboard/deploy.sh)):**
  - Triggered manually via SSH: `./deploy.sh prod` or `./deploy.sh dev`.
  - Pulls code via `git pull --ff-only origin main`.
  - Rebuilds backend: `cd backend && docker compose up -d --build iex-backend`.
  - Rebuilds frontend: `cd ../frontend && docker compose up -d --build iex-frontend`.

---

### 2.5 Current Observability, Health & Telemetry
- **Health Endpoints ([`backend/src/app.ts:L51-L68`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L51-L68)):**
  - `GET /health`: Returns `{ status: "ok", timestamp: ISOString, uptime: seconds }`.
  - `GET /health/database`: Executes `prisma.$queryRaw\`SELECT 1\`` and returns `{ status: "ok", database: "connected" }` or 503.
- **Metrics & Tracing:**
  - **Metrics:** Completely absent. No Prometheus, StatsD, or Micrometer metrics exposed.
  - **Distributed Tracing:** Absent. No OpenTelemetry or trace correlation IDs.
  - **Audit Logging:** Handled solely by manual inserts into the `ApiLog` table in PostgreSQL.

---

## 3. Target Java 21 / Spring Boot 3 Build & DevOps Architecture

### 3.1 Multi-Stage Java 21 Dockerfile
The target Spring Boot container separates the build environment from the minimal runtime image, utilizing Eclipse Temurin 21 and distroless/alpine JRE with non-root security:

```dockerfile
# ==========================================
# Stage 1: Build & Package (Maven + Java 21)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

# Install tools needed for native builds
RUN apk add --no-cache curl

# Cache Maven dependencies layer
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Extract Spring Boot layered jar for efficient Docker layer caching
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ==========================================
# Stage 2: Minimal Production JRE Runner
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Create unprivileged system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install Playwright / Chromium dependencies ONLY if headless scraping is retained in same image
RUN apk add --no-cache tzdata chromium

ENV TZ=Asia/Kolkata
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

# Copy Spring Boot layers from builder
COPY --from=builder /workspace/target/extracted/dependencies/ ./
COPY --from=builder /workspace/target/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/target/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/target/extracted/application/ ./

USER appuser

EXPOSE 8080

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-jar", "org.springframework.boot.loader.launch.JarLauncher"]
```

---

### 3.2 Automated GitHub Actions CI/CD Pipeline
Replace manual SSH script deployments with an enterprise GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: CI/CD Pipeline - Spring Boot Backend

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run Maven Tests with Testcontainers
        run: ./mvnw clean verify -B

      - name: Publish Test Results
        uses: scacap/action-surefire-report@v1
        if: always()

  docker-build-and-push:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-to-ec2:
    needs: docker-build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 13.203.106.159
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /mnt/storage/iex-dashboard-new
            docker compose pull iex-backend
            docker compose up -d iex-backend
            docker system prune -f
```

---

### 3.3 Spring Boot Observability Architecture

#### 1. Spring Boot Actuator Endpoints
Replace manual `/health` routes with production-ready Spring Actuator endpoints:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```
- **Liveness Probe:** `/actuator/health/liveness` (verifies JVM thread health).
- **Readiness Probe:** `/actuator/health/readiness` (verifies PostgreSQL connection pool and Redis reachability).

#### 2. Prometheus Metrics via Micrometer
Add `micrometer-registry-prometheus` to export standard JVM and business metrics at `/actuator/prometheus`:
- `jvm.memory.used`, `jvm.threads.virtual.count` (tracks Virtual Threads).
- `hikaricp.connections.active`, `hikaricp.connections.pending` (PostgreSQL connection pool).
- Custom business counters:
  - `iex.scrapes.total{market="DAM", status="SUCCESS"}`
  - `iex.tariffs.calculated.total{state="UP"}`

#### 3. Distributed Tracing via OpenTelemetry / Micrometer Tracing
Add Micrometer Tracing with W3C Baggage propagation:
- Injects `traceId` and `spanId` automatically into every SLF4J log line via MDC:
  `2026-10-22 07:15:00 [traceId=4bf92f3577b34da6a3ce929d0e0e4736 spanId=00f067aa0ba902b7] INFO c.p.i.s.ScraperService - Starting DAM scrape`
- Enables correlation of API calls with background scheduler tasks in Grafana/Loki or CloudWatch.

---

## 4. Resource Allocation & Hardware Sizing

| Metric | Current Node.js Architecture | Target Spring Boot 3 Architecture | Sizing Rationale |
|---|---|---|---|
| **CPU Allocation** | 2 vCPUs (shared single event loop thread + Python child processes) | 2 to 4 vCPUs | Virtual threads efficiently utilize multiple cores without thread-pool starvation. |
| **RAM Allocation** | ~2.5 GB (Node process ~400MB + Chromium ~800MB + Python ML ~1.2GB) | 1.5 GB to 2.0 GB | Java 21 Generational ZGC (`-XX:+UseZGC -XX:+ZGenerational`) keeps heap max ~1GB with sub-millisecond GC pauses. |
| **Container Size** | ~1.85 GB (Heavy Debian image with Python & Chromium) | ~320 MB (Eclipse Temurin JRE Alpine) | Removing redundant Python runtimes drastically reduces container image transfer times. |
| **Internal Port** | `5000` / `8080` | `8080` (Standard Spring Boot port) | Aligned with standard Spring Boot container conventions. |
