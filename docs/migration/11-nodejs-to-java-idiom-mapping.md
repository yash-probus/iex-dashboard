# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 11: Node.js to Java 21 Idiom Mapping

## 1. Executive Summary & Verification Check
This document establishes the technical translation rules from Node.js/TypeScript idioms present in the **Prolt Energy / IEX Analytics Dashboard** codebase to modern, idiomatic **Java 21 and Spring Boot 3.x**. 

Every pattern analyzed in this document is accompanied by concrete code references from active repository files and an explicit Java 21 replacement pattern using language features such as records, sealed interfaces, pattern matching, virtual threads, `Optional`, and `BigDecimal`.

---

## 2. Core Language & Runtime Idiom Translations

### 2.1 Callbacks, Promises, and Async/Await -> Virtual Threads & Structured Concurrency

#### Node.js Codebase Pattern
Node.js uses non-blocking asynchronous event-loop execution. Throughout this codebase, asynchronous flows appear in three forms:
1. **`async/await` with Express controllers:** All service methods return Promises, wrapped via an `asyncHandler` wrapper ([`backend/src/middleware/asyncHandler.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/asyncHandler.ts)).
2. **`Promise.all` concurrent execution:** For aggregating market prices, weather forecasts, and demand metrics concurrently. For example, in [`backend/src/modules/dataset/dashboard.service.ts:L45-L58`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.service.ts#L45-L58):
   ```typescript
   const [damAvg, gdamAvg, rtmAvg, demandSummary] = await Promise.all([
     this.getDamAverage(date),
     this.getGdamAverage(date),
     this.getRtmAverage(date),
     this.getStateDemandSummary(date)
   ]);
   ```
3. **Node callback-style child process spawns:** In [`backend/src/services/cron.service.ts:L155-L162`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L155-L162):
   ```typescript
   exec("python3 up_market_sync.py --market RTM", (err, stdout, stderr) => {
     if (err) logger.error(`Sync error: ${err.message}`);
     else logger.info(`Sync stdout: ${stdout}`);
   });
   ```

#### Target Java 21 Idiom
In Java 21 with Spring Boot 3, **Virtual Threads (Project Loom)** render reactive programming (`Mono`/`Flux`) and callback pyramids obsolete for IO-bound REST operations. Virtual threads allow writing simple, sequential, blocking code with negligible memory footprint (~few KB per virtual thread vs ~1MB per platform thread).

- **Sequential Execution:** Write straightforward synchronous service calls. Enable virtual threads in `application.yml`:
  ```yaml
  spring:
    threads:
      virtual:
        enabled: true
  ```
- **Concurrent Fan-Out (`Promise.all` equivalent):** Use `CompletableFuture.allOf()` with the virtual thread executor, or Java 21 `StructuredTaskScope`:
  ```java
  // Idiomatic Java 21 Structured Concurrency
  try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
      Supplier<MarketAverageDTO> damTask = scope.fork(() -> marketService.getDamAverage(date));
      Supplier<MarketAverageDTO> gdamTask = scope.fork(() -> marketService.getGdamAverage(date));
      Supplier<MarketAverageDTO> rtmTask = scope.fork(() -> marketService.getRtmAverage(date));
      Supplier<DemandSummaryDTO> demandTask = scope.fork(() -> demandService.getStateDemandSummary(date));

      scope.join().throwIfFailed(); // Joins all tasks and propagates exceptions

      return new DashboardSummaryDTO(
          damTask.get(),
          gdamTask.get(),
          rtmTask.get(),
          demandTask.get()
      );
  }
  ```

---

### 2.2 Dynamic Typing and Loose JSON -> Records, DTOs & Sealed Interfaces

#### Node.js Codebase Pattern
TypeScript in this codebase frequently resorts to loose `any` types, raw dictionary lookups, and arbitrary JSON payloads:
1. **Loose JSON in Database:** The Prisma schema stores dynamic configuration and tariff blocks in `Prisma.JsonValue` columns (e.g. `User.hiddenModules`, `ResourceCenterDocument.metadata`, `SavingsCalculation.breakdown`).
2. **Untyped Controller Payloads:** In [`backend/src/modules/landing-price-calc/landing-price-calc.controller.ts:L12-L28`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.controller.ts#L12-L28), `req.body` is destructured into arbitrary variables without compile-time type verification:
   ```typescript
   const { state, voltage, tariffCategory, consumptionKwh, ...otherParams } = req.body;
   ```
3. **Polymorphic File Upload Items:** In [`backend/src/modules/upload-processing/upload-processing.types.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/upload-processing.types.ts), parsed spreadsheet rows are cast as `any[]` or loose unions.

#### Target Java 21 Idiom
Replace loose JavaScript dictionaries and `any` types with immutable Java 21 **`record`s** for input/output DTOs and **sealed interfaces** for polymorphic data structures.

- **Immutable Request & Response DTOs:**
  ```java
  public record LandingPriceCalculationRequest(
      @NotBlank(message = "State is required") String state,
      @NotNull(message = "Voltage level is required") VoltageLevel voltage,
      @NotBlank(message = "Tariff category is required") String tariffCategory,
      @Positive(message = "Consumption must be greater than zero") BigDecimal consumptionKwh,
      Map<String, Object> additionalAttributes
  ) {}
  ```
- **Polymorphic Market Payloads via Sealed Interfaces:**
  ```java
  public sealed interface MarketRecordDTO 
      permits DamRecordDTO, GdamRecordDTO, RtmRecordDTO, RecRecordDTO {
      int timeBlock();
      LocalTime startTime();
      LocalTime endTime();
      BigDecimal clearingPrice();
  }

  public record DamRecordDTO(
      int timeBlock, LocalTime startTime, LocalTime endTime,
      BigDecimal clearingPrice, BigDecimal purchaseBid, BigDecimal sellBid, BigDecimal mcv
  ) implements MarketRecordDTO {}

  public record GdamRecordDTO(
      int timeBlock, LocalTime startTime, LocalTime endTime,
      BigDecimal clearingPrice, BigDecimal greenPurchaseBid, BigDecimal greenSellBid, BigDecimal mcv
  ) implements MarketRecordDTO {}
  ```
- **Pattern Matching over Polymorphic Records:**
  ```java
  public BigDecimal extractVolumeMetric(MarketRecordDTO record) {
      return switch (record) {
          case DamRecordDTO dam -> dam.mcv();
          case GdamRecordDTO gdam -> gdam.mcv();
          case RtmRecordDTO rtm -> rtm.clearingVolume();
          case RecRecordDTO rec -> rec.volume();
      };
  }
  ```

---

### 2.3 Express Middleware Chains -> Spring Filters, Interceptors & Method Security

#### Node.js Codebase Pattern
Express executes middleware sequentially along a mutable pipeline. In [`backend/src/modules/users/users.routes.ts:L11-L24`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.routes.ts#L11-L24):
```typescript
router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), UsersController.listUsers);
router.post('/upload', uploadLimiter, upload.single('file'), authenticateToken, UploadController.handleUpload);
```

#### Target Java 21 Idiom
In Spring Boot, cross-cutting concerns are factored into distinct architectural components rather than chained function callbacks:
- **Authentication & Authorization:** Enforced via Spring Security's `SecurityFilterChain` and declarative method security:
  ```java
  @GetMapping("/api/users")
  @PreAuthorize("hasRole('SUPER_ADMIN')")
  public ResponseEntity<List<UserResponseDTO>> listUsers() { ... }
  ```
- **Rate Limiting:** Implemented as a reusable `OncePerRequestFilter` using Bucket4j backed by Redis.
- **File Upload Parsing:** Managed declaratively using Spring's `MultipartFile` and `@RequestParam("file")`.
- **Validation:** Managed declaratively using `@Valid` with Jakarta Bean Validation annotations.

---

### 2.4 Request & Response Mutation -> SecurityContextHolder & DTO Returns

#### Node.js Codebase Pattern
Express handlers frequently attach arbitrary objects to `req` and mutate `res.locals`:
- In [`backend/src/middleware/auth.middleware.ts:L28`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/auth.middleware.ts#L28):
  ```typescript
  (req as any).user = decodedToken;
  ```
- In [`backend/src/middleware/upload.middleware.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/upload.middleware.ts): Multer attaches `.file` and `.body` to `req`.

#### Target Java 21 Idiom
Java does not support dynamic object monkey-patching.
- **Current User Context:** Extracted from the `SecurityContextHolder` using Spring Security's `@AuthenticationPrincipal`:
  ```java
  @GetMapping("/me")
  public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
      return ResponseEntity.ok(userService.findById(principal.id()));
  }
  ```
- **Auditing & Correlation IDs:** Stored in SLF4J MDC (`MappedDiagnosticContext`) inside a dedicated servlet filter and cleared in a `finally` block:
  ```java
  @Component
  public class CorrelationIdFilter extends OncePerRequestFilter {
      @Override
      protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
              throws ServletException, IOException {
          String correlationId = Optional.ofNullable(req.getHeader("X-Correlation-ID"))
                                         .orElse(UUID.randomUUID().toString());
          MDC.put("correlationId", correlationId);
          res.setHeader("X-Correlation-ID", correlationId);
          try {
              chain.doFilter(req, res);
          } finally {
              MDC.clear();
          }
      }
  }
  ```

---

### 2.5 Closures & Module-Level State -> Spring Managed Singletons & Redis State

#### Node.js Codebase Pattern
In [`backend/src/modules/auth/otp.service.ts:L6`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/otp.service.ts#L6), OTP codes are held in an in-memory module-level `Map`:
```typescript
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();
```
In [`backend/src/config/redis.ts:L15`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/redis.ts#L15), a single client instance is initialized globally and re-exported.

#### Target Java 21 Idiom
- **Never use static mutable fields** (`static Map<...>`) in Spring service beans. They leak memory and fail in distributed multi-pod environments.
- **Persistent Distributed State:** Store short-lived tokens in Redis with explicit TTL:
  ```java
  @Service
  @RequiredArgsConstructor
  public class OtpService {
      private final StringRedisTemplate redisTemplate;
      private static final Duration OTP_TTL = Duration.ofMinutes(5);

      public void saveOtp(String email, String otp) {
          redisTemplate.opsForValue().set("otp:" + email, otp, OTP_TTL);
      }

      public boolean verifyOtp(String email, String candidateOtp) {
          String key = "otp:" + email;
          String storedOtp = redisTemplate.opsForValue().get(key);
          if (storedOtp != null && storedOtp.equals(candidateOtp)) {
              redisTemplate.delete(key);
              return true;
          }
          return false;
      }
  }
  ```

---

### 2.6 Singleton Modules & Dependency Injection -> Spring ApplicationContext

#### Node.js Codebase Pattern
In Node.js, singletons are achieved implicitly via CommonJS/ES module caching:
- [`backend/src/config/prisma.ts:L45`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/prisma.ts#L45): `export default prisma;`
- Controllers import services directly as static objects: `SavingsCalculatorService.calculate(...)`.

#### Target Java 21 Idiom
In Spring Boot, manage singletons explicitly through inversion of control (IoC) with constructor injection:
```java
@Service
@RequiredArgsConstructor
public class SavingsCalculatorService {
    private final SavingsCalculatorRepository repository;
    private final TariffService tariffService;
    private final OpenAccessChargesService chargesService;
    // Constructor injected automatically via Lombok @RequiredArgsConstructor
}
```

---

### 2.7 Null, Undefined & Falsy Handling -> `java.util.Optional` & Explicit Nullability

#### Node.js Codebase Pattern
JavaScript conflates `null`, `undefined`, `0`, `""`, and `false` as falsy. Code in [`backend/src/modules/landing-price-calc/landing-price-calc.service.ts:L44-L62`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts#L44-L62) relies on coalesce and falsy operators:
```typescript
const tax = entry.taxRate || 0.05;
const additionalSurge = entry.surge ?? 0;
if (!entry.state) {
  throw new AppError("State is required", 400);
}
```
Furthermore, Prisma treats `undefined` as "do not update" and `null` as "set column to NULL in database".

#### Target Java 21 Idiom
Java is strongly typed and differentiates absence of value from default fallbacks:
- **Use `Optional<T>` for Repository Queries:**
  ```java
  public Optional<SavingsCalculatorEntry> findById(UUID id);
  ```
- **Idiomatic Retrieval with Exception:**
  ```java
  SavingsCalculatorEntry entry = repository.findById(id)
      .orElseThrow(() -> new ResourceNotFoundException("Entry not found with id: " + id));
  ```
- **Explicit Fallbacks with `Objects.requireNonNullElse`:**
  ```java
  BigDecimal taxRate = Objects.requireNonNullElse(entry.getTaxRate(), BigDecimal.valueOf(0.05));
  ```
- **Null-Safety Annotations:** Use Jakarta/Spring `@NonNull` and `@Nullable` to enforce null checks at compilation time.

---

### 2.8 Date & Timezone Handling -> `java.time.ZonedDateTime` & `ZoneId`

#### Node.js Codebase Pattern
JavaScript `new Date()` defaults to the host operating system's local timezone. The application attempts to force Indian Standard Time (`Asia/Kolkata`) via environment variables (`TZ=Asia/Kolkata` in Docker) and manual string slicing in [`backend/src/services/cron.service.ts:L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/services/cron.service.ts#L17):
```typescript
const todayStr = new Date().toISOString().split('T')[0]; // Yields UTC date, which may be yesterday in IST!
```
This is a critical bug source around midnight IST (between 12:00 AM and 5:30 AM IST, UTC is still the previous calendar day).

#### Target Java 21 Idiom
Java 21 `java.time` types provide unambiguous, timezone-aware calendar operations:
```java
public class MarketTimeHelper {
    public static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    public static LocalDate getTodayInIst() {
        return LocalDate.now(IST_ZONE);
    }

    public static ZonedDateTime getCurrentIstDateTime() {
        return ZonedDateTime.now(IST_ZONE);
    }

    public static int calculateTimeBlock(LocalTime time) {
        // 96 time blocks per day: each block = 15 minutes
        int minuteOfDay = time.getHour() * 60 + time.getMinute();
        return (minuteOfDay / 15) + 1; // 1-indexed (1 to 96)
    }
}
```
In Jackson serialization, configure standard ISO formatting in `application.yml`:
```yaml
spring:
  jackson:
    time-zone: Asia/Kolkata
    serialization:
      write-dates-as-timestamps: false
```

---

### 2.9 Number Precision & Floating-Point Arithmetic -> `java.math.BigDecimal`

#### Node.js Codebase Pattern
JavaScript uses IEEE-754 64-bit binary floating-point numbers (`number` type) for all numeric values. Throughout tariff calculations and 96-block price clearing:
- [`backend/src/modules/landing-price-calc/landing-price-calc.service.ts:L112`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/landing-price-calc/landing-price-calc.service.ts#L112):
  ```typescript
  const totalLandedCost = baseCost + ctuLossCost + stLossCost + crossSubsidySurcharge;
  ```
Floating-point arithmetic introduces rounding artifacts (e.g. `0.1 + 0.2 = 0.30000000000000004`), which causes penny-discrepancies in multi-crore Rupee power procurement invoices.

#### Target Java 21 Idiom
**Never use `double` or `float` for commercial, tariff, or volume calculations in the Spring Boot application.** Use `java.math.BigDecimal` with explicit scale and rounding modes:
```java
public record LandedCostCalculation(
    BigDecimal basePricePerKwh,
    BigDecimal ctuLossPercentage,
    BigDecimal stateLossPercentage,
    BigDecimal crossSubsidySurcharge
) {
    private static final MathContext MC = new MathContext(8, RoundingMode.HALF_UP);

    public BigDecimal computeTotalLandedCost() {
        BigDecimal effectiveCtuMultiplier = BigDecimal.ONE.add(ctuLossPercentage.divide(BigDecimal.valueOf(100), MC));
        BigDecimal effectiveStateMultiplier = BigDecimal.ONE.add(stateLossPercentage.divide(BigDecimal.valueOf(100), MC));

        return basePricePerKwh
            .multiply(effectiveCtuMultiplier, MC)
            .multiply(effectiveStateMultiplier, MC)
            .add(crossSubsidySurcharge)
            .setScale(4, RoundingMode.HALF_UP);
    }
}
```

---

### 2.10 String Manipulation & Regular Expressions -> `java.util.regex.Pattern`

#### Node.js Codebase Pattern
JavaScript uses inline regex literals with global flags:
- [`backend/src/modules/upload-processing/parsers/base.parser.ts:L34`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/parsers/base.parser.ts#L34):
  ```typescript
  const sanitizedDate = rawDate.replace(/\s+/g, ' ').trim();
  const dateMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  ```

#### Target Java 21 Idiom
Compile regular expressions as `static final Pattern` instances to avoid recompiling regex state machines on every HTTP request:
```java
public final class DateSanitizer {
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern DATE_PATTERN = Pattern.compile("^(\\d{2})[-/](\\d{2})[-/](\\d{4})$");

    public static String cleanWhitespace(String input) {
        if (input == null) return null;
        return WHITESPACE_PATTERN.matcher(input).replaceAll(" ").trim();
    }
}
```

---

### 2.11 Buffer & Binary Stream Handling -> Java NIO & InputStreams

#### Node.js Codebase Pattern
File uploads and document template rendering use Node `Buffer` and streaming libraries:
- [`backend/src/modules/proposal/proposal.service.ts:L32`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/proposal/proposal.service.ts#L32):
  ```typescript
  const templateContent = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip);
  const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  ```

#### Target Java 21 Idiom
In Spring Boot, manage binary content via `InputStream`, `Resource`, and Apache POI:
```java
@Service
public class ProposalService {
    public byte[] generateProposalDocument(ProposalDataDTO data) throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/proposal_template.docx");
        try (InputStream is = resource.getInputStream();
             XWPFDocument document = new XWPFDocument(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Replace template placeholders in Apache POI document
            replaceDocumentVariables(document, data);

            document.write(out);
            return out.toByteArray();
        }
    }
}
```
For large spreadsheet uploads, avoid reading complete files into memory. Stream rows using Apache POI `SXSSF` or the event-driven SAX parser (`XSSFReader`).

---

## 3. Summary of Node.js vs. Java 21 Idioms

| Node.js / TypeScript Idiom | Codebase Example Path | Java 21 / Spring Boot 3 Equivalent | Key Benefit |
|---|---|---|---|
| `async/await` & `asyncHandler` | `middleware/asyncHandler.ts` | Synchronous methods on Virtual Threads | Eliminates callback/reactive overhead |
| `Promise.all([p1, p2])` | `modules/dataset/dashboard.service.ts:L45` | `StructuredTaskScope` / `CompletableFuture.allOf` | Thread-safe concurrent aggregation |
| `req.body` destructuring | `modules/landing-price-calc/landing-price-calc.controller.ts` | Java 21 `record` with `@Valid` | Compile-time type safety & validation |
| `req.user = decoded` | `middleware/auth.middleware.ts:L28` | `@AuthenticationPrincipal` from `SecurityContext` | Type-safe context without object mutation |
| `otpStore = new Map()` | `modules/auth/otp.service.ts:L6` | `StringRedisTemplate` with 5m TTL | Clustered multi-pod high availability |
| `export default prisma` | `config/prisma.ts:L45` | Spring `@Service` / `@Repository` IoC | Testable dependency injection |
| `val ?? defaultVal` / `!val` | `modules/landing-price-calc/landing-price-calc.service.ts` | `Optional<T>` / `Objects.requireNonNullElse` | Eliminates NPEs and truthiness bugs |
| `new Date().toISOString()` | `services/cron.service.ts:L17` | `ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))` | Prevents UTC midnight cutoff bugs |
| `number` (IEEE-754 float) | `modules/savings-calculator/savings-calculator.service.ts` | `java.math.BigDecimal` (Scale 4, HALF_UP) | Eliminates rounding errors in tariffs |
| Inline `/\s+/g` | `parsers/base.parser.ts:L34` | `static final Pattern` | High performance compiled regex |
| `Buffer.from(...)` | `modules/proposal/proposal.service.ts` | `byte[]`, `InputStream`, `ByteArrayOutputStream` | Standard JVM garbage collection & safety |
