# Prolt Energy - IEX Analytics & Power Portfolio Management Platform
# Document 09: Error Handling, Request Validation & Logging Architecture

## 1. Executive Summary & Verification Check
This document analyzes the error-handling pipeline, request payload validation mechanisms, and application logging implementations across the **Prolt Energy / IEX Analytics Dashboard**.

### Batch 2 Error, Validation & Logging Checklist Verification
- **Error Pipeline Behavior:** Global handler [`backend/src/middleware/errorHandler.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/errorHandler.ts) and custom [`backend/src/utils/AppError.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/AppError.ts).
- **Exhaustive Error Catalog:** Every `new AppError` throw across all controllers and services cataloged with status code, message, and line reference.
- **Validation Schemas:** Custom manual validation functions in `auth.validation.ts`, `upload.validation.ts`, `users.validation.ts`, and `resource-center.validator.ts`.
- **Logging Implementation:** Custom console logger in [`backend/src/logger/index.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/logger/index.ts), Morgan HTTP logging, and `ApiLog` database logging.
- **Target Java Mapping:** `@RestControllerAdvice`, RFC 7807 `ProblemDetail`, Jakarta Bean Validation (`jakarta.validation.*`), SLF4J, and Logback with MDC.

---

## 2. Global Error Handling Architecture

### 2.1 The Custom `AppError` Class
Defined in [`backend/src/utils/AppError.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/AppError.ts):
```typescript
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Flags trusted operational errors vs unhandled bugs

    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 2.2 Global Error Handler Middleware
Implemented in [`backend/src/middleware/errorHandler.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/errorHandler.ts):
```typescript
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development Environment: Leaks full error details, object keys, and call stack
  if (config.env === 'development') {
    logger.error(`${err.statusCode} - ${err.message}`, { stack: err.stack });
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production Environment: Differentiates operational errors from unhandled crashes
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming or unknown infrastructure error: Sanitized generic message
  logger.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: 'Something went very wrong!',
  });
};
```

### 2.3 Async Handler Wrapper
Implemented in [`backend/src/middleware/asyncHandler.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/asyncHandler.ts):
```typescript
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
```
Guarantees unhandled promise rejections inside asynchronous route controllers are piped to `next(err)` without terminating the Node.js event loop.

---

## 3. Exhaustive Error Catalog (Status Codes & Messages)

| HTTP Status | File Path & Line | Error Condition | Exact Error Message |
|---|---|---|---|
| **400 Bad Request** | [`backend/src/config/multer.ts:L45`](file:///Users/yashgupta/IEX-Dashboard/backend/src/config/multer.ts#L45) | File extension is not `.csv`, `.xlsx`, or `.xls` | `"Unsupported file extension: ${ext}. Only .csv, .xlsx, .xls are allowed."` |
| **400 Bad Request** | [`backend/src/middleware/upload.middleware.ts:L24`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/upload.middleware.ts#L24) | Uploaded file exceeds 50MB | `"File size exceeds the 50MB limit."` |
| **400 Bad Request** | [`backend/src/middleware/upload.middleware.ts:L31`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/upload.middleware.ts#L31) | `file` missing from multipart body | `"No file provided for upload."` |
| **400 Bad Request** | [`backend/src/modules/auth/auth.validation.ts:L9`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.validation.ts#L9) | Username missing or empty string | `"Username is required"` |
| **400 Bad Request** | [`backend/src/modules/auth/auth.validation.ts:L13`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.validation.ts#L13) | Password missing or empty string | `"Password is required"` |
| **400 Bad Request** | [`backend/src/modules/upload/upload.validation.ts:L9`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.validation.ts#L9) | Market missing in upload | `"Market type is required."` |
| **400 Bad Request** | [`backend/src/modules/upload/upload.validation.ts:L17`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.validation.ts#L17) | Market is not DAM, GDAM, RTM, REC | `"Invalid market type. Allowed: DAM, GDAM, RTM, REC"` |
| **400 Bad Request** | [`backend/src/modules/upload-processing/upload-processing.service.ts:L31`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/upload-processing.service.ts#L31) | Parser rejects spreadsheet structure | `parserResult.error || "Parsing failed"` |
| **400 Bad Request** | [`backend/src/modules/upload-processing/upload-processing.service.ts:L42`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload-processing/upload-processing.service.ts#L42) | Row transformation validation fails | `"Data transformation failed: ${transformationResult.warnings[0]}"` |
| **400 Bad Request** | [`backend/src/modules/persistence/persistence.service.ts:L21`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L21) | DAM/GDAM record count != 96 | `"Persistence rejected: Expected exactly 96 records, got ${records.length}"` |
| **400 Bad Request** | [`backend/src/modules/dataset/dashboard.service.ts:L120`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dashboard.service.ts#L120) | Analytics query missing date bounds | `"Date range parameters are required"` |
| **400 Bad Request** | [`backend/src/modules/scraper/scraper.controller.ts:L14`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.controller.ts#L14) | Manual scraper market invalid | `"Invalid market specified. Must be DAM, GDAM, RTM, or REC."` |
| **400 Bad Request** | [`backend/src/modules/users/users.validation.ts:L8, L11, L14`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.validation.ts#L8) | Missing user fields | `"Username is required"`, `"Email is required"`, `"Valid role is required (ADMIN or CLIENT)"` |
| **400 Bad Request** | [`backend/src/modules/resource-center/validators/resource-center.validator.ts:L143-L232`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/validators/resource-center.validator.ts#L143) | Field validation fails in Resource Center | `"Validation error: ${field} is required"`, `"Validation error: ${field} cannot be negative"` |
| **401 Unauthorized** | [`backend/src/utils/jwt.ts:L35`](file:///Users/yashgupta/IEX-Dashboard/backend/src/utils/jwt.ts#L35) | JWT signature invalid or expired | `"Invalid or expired token. Please log in again."` |
| **401 Unauthorized** | [`backend/src/middleware/auth.middleware.ts:L30`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/auth.middleware.ts#L30) | Authorization header absent | `"Unauthorized"` |
| **401 Unauthorized** | [`backend/src/modules/auth/auth.service.ts:L17, L23`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.service.ts#L17) | Password mismatch or unknown user | `"Invalid credentials"` |
| **401 Unauthorized** | [`backend/src/modules/auth/auth.service.ts:L67`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.service.ts#L67) | OTP expired or mismatch | `"Invalid or expired OTP"` |
| **403 Forbidden** | [`backend/src/middleware/admin.middleware.ts:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/admin.middleware.ts#L5) | Role is not ADMIN | `"Forbidden: Admin access required"` |
| **403 Forbidden** | [`backend/src/middleware/super-admin.middleware.ts:L5`](file:///Users/yashgupta/IEX-Dashboard/backend/src/middleware/super-admin.middleware.ts#L5) | Role is not SUPER_ADMIN | `"Forbidden: Super Admin access required"` |
| **404 Not Found** | [`backend/src/app.ts:L124`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L124) | Unmatched URL route | `"Can't find ${req.originalUrl} on this server!"` |
| **404 Not Found** | [`backend/src/modules/auth/auth.service.ts:L58, L75`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.service.ts#L58) | User email does not exist | `"User with this email not found"`, `"User not found"` |
| **404 Not Found** | [`backend/src/modules/dataset/dataset.controller.ts:L29`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/dataset/dataset.controller.ts#L29) | Dataset ID does not exist | `"Dataset not found"` |
| **404 Not Found** | [`backend/src/modules/persistence/persistence.service.ts:L49`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L49) | `action=replace` but no active dataset | `"Cannot replace: No ACTIVE dataset found for this market and date."` |
| **404 Not Found** | [`backend/src/modules/resource-center/services/resource-center.service.ts:L185`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/services/resource-center.service.ts#L185) | Record ID does not exist | `"Record not found"` |
| **409 Conflict** | [`backend/src/modules/persistence/persistence.service.ts:L42`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L42) | Active dataset exists without replace flag | `"Dataset already exists. Use ?action=replace to overwrite."` |
| **409 Conflict** | [`backend/src/modules/persistence/persistence.service.ts:L282`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L282) | Dataset is already deleted | `"Dataset is already deleted"` |
| **409 Conflict** | [`backend/src/modules/persistence/persistence.service.ts:L287`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L287) | Deleting a replaced dataset | `"Cannot delete a REPLACED historical dataset"` |
| **409 Conflict** | [`backend/src/modules/users/users.service.ts:L25`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.service.ts#L25) | Username or email already registered | `"Username or email already exists"` |
| **409 Conflict** | [`backend/src/modules/resource-center/services/resource-center.service.ts:L170`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/services/resource-center.service.ts#L170) | Unique constraint violation in resource | `"Record already exists (Duplicate Conflict)"` |
| **500 Internal Error** | [`backend/src/modules/persistence/persistence.service.ts:L34`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L34) | Corrupt data: multiple active datasets | `"Operational Error: Multiple ACTIVE datasets exist. Please contact support."` |
| **500 Internal Error** | [`backend/src/modules/persistence/persistence.service.ts:L226`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/persistence/persistence.service.ts#L226) | Database failed to insert all 96 rows | `"Critical Integrity Error: Expected 96 records, but inserted ${insertedCount}."` |
| **500 Internal Error** | [`backend/src/modules/scraper/scraper.controller.ts:L32`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/scraper/scraper.controller.ts#L32) | Puppeteer returned 0 rows | `"Scraper returned 0 records"` |

---

## 4. Request Validation Architecture

The codebase relies on **custom manual validation functions** rather than third-party schema validators (Zod/Joi).

### 4.1 Login DTO Validation ([`backend/src/modules/auth/auth.validation.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/auth/auth.validation.ts))
- Validates `username` (string, non-empty, trimmed).
- Validates `password` (string, non-empty, trimmed).

### 4.2 Upload Request Validation ([`backend/src/modules/upload/upload.validation.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/upload/upload.validation.ts))
- Normalizes and checks `market` against `['DAM', 'GDAM', 'RTM', 'REC']`.
- Trims `date` string.

### 4.3 User Management Validation ([`backend/src/modules/users/users.validation.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/users/users.validation.ts))
- `validateCreateUser`: Validates `username`, `email`, and `role` (`'ADMIN'` or `'CLIENT'`).
- `validateUpdateUser`: Optional field checking preventing empty string updates.

### 4.4 Resource Center Master Data Validator ([`backend/src/modules/resource-center/validators/resource-center.validator.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/resource-center/validators/resource-center.validator.ts))
- Parses textual months (`january`, `jan` -> `1`).
- Validates numeric percentage bounds (`0` to `100` for loss percentages).
- Enforces `stateOrUt` enum (`'state'` or `'ut'`).
- Validates ISO-8601 date strings (`YYYY-MM-DD` or `YYYYMMDD`).

---

## 5. Logging Implementation & Telemetry

### 5.1 Centralized Application Logger ([`backend/src/logger/index.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/logger/index.ts))
```typescript
class Logger {
  info(message: string, meta?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  }
  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  }
  error(message: string, meta?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  }
  success(message: string, meta?: any) {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, meta || '');
  }
}
export const logger = new Logger();
```
- **Log Levels:** `INFO`, `WARN`, `ERROR`, `SUCCESS`.
- **Output Destination:** `stdout` / `stderr`.
- **Correlation IDs:** **None**. Requests do not have a trace ID or correlation ID tracking execution across services.
- **Sensitive Data Masking:** **None**. In development mode, `otp.service.ts` prints plaintext OTPs to console; controllers log `req.body.username` without redaction.

### 5.2 HTTP Request Logging (Morgan)
- Initialized in [`backend/src/app.ts:L45-L47`](file:///Users/yashgupta/IEX-Dashboard/backend/src/app.ts#L45-L47):
  ```typescript
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  ```
- Formats HTTP method, path, response status, and duration in milliseconds.

### 5.3 Database Telemetry Logging (`ApiLogService`)
- Defined in [`backend/src/modules/api-log/api-log.service.ts`](file:///Users/yashgupta/IEX-Dashboard/backend/src/modules/api-log/api-log.service.ts).
- Persists third-party API integration events to the `ApiLog` table in PostgreSQL:
  - `apiName`: e.g. `'NPP Demand API'`, `'IEX DAM Scraper'`, `'IEX RTM Scraper'`
  - `endpoint`: Target URL
  - `status`: `'SUCCESS'` | `'ERROR'`
  - `message`: Response summary or error string
  - `timestamp`: Current UTC timestamp

---

## 6. Proposed Mapping to Java / Spring Boot 3

### 6.1 Centralized Exception Handling (`@RestControllerAdvice`)
Replace `errorHandler.ts` and `AppError` with a Spring Boot 3 `ResponseEntityExceptionHandler` leveraging RFC 7807 `ProblemDetail`:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ProblemDetail handleAppException(AppException ex) {
        log.warn("Operational business exception [status: {}]: {}", ex.getHttpStatus(), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getHttpStatus(), ex.getMessage());
        problem.setProperty("success", false);
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setProperty("success", false);
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unhandled infrastructure exception 💥", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Something went very wrong!"
        );
        problem.setProperty("success", false);
        return problem;
    }
}
```

### 6.2 Jakarta Bean Validation
Replace manual `validation.ts` scripts with standard declarative annotations:
```java
public record CreateUserRequest(
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password,

    @NotNull(message = "Valid role is required")
    Role role
) {}
```

### 6.3 SLF4J, Logback & Mapped Diagnostic Context (MDC)
Implement structured logging with correlation IDs:
```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
```

Logback format in `logback-spring.xml`:
```xml
<pattern>%d{yyyy-MM-dd'T'HH:mm:ss.SSSXXX} [%thread] %-5level [traceId=%X{correlationId}] %logger{36} - %msg%n</pattern>
```

---

## 7. Open Questions & Error-Handling Observations

1. **Inconsistent Error JSON Structure:** In development mode, `errorHandler.ts` returns `{ success: false, status: 'fail', message: '...', error: {...}, stack: '...' }`, whereas in production it returns `{ success: false, message: '...' }`. The Spring Boot migration should standardize on RFC 7807 `ProblemDetail` with an extra `"success": false` attribute across all environments.
2. **Missing Correlation IDs:** Diagnosing failed batch scrapers or transaction rollbacks is currently difficult because log lines have no shared ID linking the HTTP request to subsequent Prisma queries. MDC-based trace ID injection must be added in Spring Boot.
3. **Absence of Sensitive Data Masking:** Neither passwords, authorization headers, nor OTP codes are masked in current log statements. A Logback masking converter (e.g. `RegexReplacementConverter` masking `password`, `token`, `otp`) must be introduced in Java.
