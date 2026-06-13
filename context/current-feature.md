# Current Feature: Ingestion Endpoint Error Handling & Validation

## Status
In Progress

## Goals

- `POST /ingest/csv` with no `file` field returns `400 Bad Request`
- Multer `fileFilter` rejection (wrong type) and `LIMIT_FILE_SIZE` both return `400`
- CSV parse failure (metadata or rows) returns `422 Unprocessable Entity` with the parser's error message
- DB transaction failure returns `500 Internal Server Error` with a safe generic message (original logged server-side)
- Parser calls and transaction wrapped in separate `try/catch` blocks — no cross-classification of error codes
- Unit tests: missing file → 400, parse failure → 422, DB failure → 500, happy path → 201
- `pnpm --filter backend lint`, `pnpm --filter backend build`, `pnpm --filter backend test` all pass

## Notes

- Spec: `context/specs/step-20-ingestion-error-handling.md`
- Controller: add `if (!file) throw new BadRequestException(...)` guard before calling service
- Upload config: replace `new Error(...)` in `fileFilter` with `new BadRequestException(...)`; handle `MulterError` `LIMIT_FILE_SIZE` via a filter or inline guard
- Service: two separate `try/catch` — one around parser calls (→ `UnprocessableEntityException`), one around `dataSource.transaction` (→ `InternalServerErrorException`)
- Parser services keep throwing plain `Error` — do NOT change them; the service boundary does the mapping
- NestJS `HttpException` subclasses only — no raw `res.status()` calls, no magic number status codes
- OUT OF SCOPE: Swagger `@ApiResponse` decorators (step 25), rate limiting, auth, i18n

## History

<!-- Completed features are tracked in context/features-history.md -->