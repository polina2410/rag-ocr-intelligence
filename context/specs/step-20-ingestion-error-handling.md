# Implementation Task: Ingestion Endpoint Error Handling & Validation

## What to build
Add explicit, NestJS-idiomatic error handling to `POST /ingest/csv` so that the three failure classes return correct HTTP status codes: missing/rejected file → `400`, CSV parse failure → `422`, DB save failure → `500`. Replace the current behaviour where every failure (missing file, bad CSV, multer rejection) bubbles up as an unhandled exception that returns `500`.

## Current state
- `apps/backend/src/ingestion/ingestion.controller.ts` — `@Post('csv')` handler calls `this.ingestionService.ingestCsv(file.buffer)`. **No null check on `file`** — if the `file` field is absent, `file.buffer` throws `TypeError` → 500.
- `apps/backend/src/ingestion/ingestion.service.ts` — `ingestCsv(fileBuffer)` calls `metadataParser.parseMetadata`, then `rowsParser.parseRows`, then a `dataSource.transaction(...)`. **No `try/catch`** anywhere.
- `apps/backend/src/ingestion/csv-metadata-parser.service.ts` — throws plain `Error` for missing/invalid metadata fields (e.g. `CSV metadata missing required field: "Race"`, `...must be ISO YYYY-MM-DD...`).
- `apps/backend/src/ingestion/csv-rows-parser.service.ts` — throws plain `Error` for bad rows (e.g. `Invalid time format in ...`, `CSV missing expected column: "..."`, split-count mismatch).
- `apps/backend/src/ingestion/csv-upload.config.ts` — multer `fileFilter` calls `cb(new Error('Only CSV files are accepted'), false)` for non-CSV. A multer-raised `Error` currently surfaces as **500**, not 400. `limits.fileSize` is 10 MB; exceeding it triggers multer's `LIMIT_FILE_SIZE` (a `MulterError`), currently also a generic error.
- `apps/backend/src/main.ts` — wires `helmet`, a global `ValidationPipe`, and CORS. **No global exception filter.**
- `apps/backend/src/app.module.ts` — no `APP_FILTER` provider.
- No `*.filter.ts` files exist anywhere in `apps/backend/src`.
- Parser unit tests exist: `csv-metadata-parser.service.spec.ts`, `csv-rows-parser.service.spec.ts`. No controller/service/e2e spec for ingestion.
- NestJS 11, `@nestjs/platform-express`, `multer@^2.1.1` installed.

## Deliverables (definition of done)
1. **Missing file → 400.** `POST /ingest/csv` with a multipart body that has no `file` field returns HTTP `400 Bad Request` with a JSON error message (not a 500, not a `TypeError`).
2. **Non-CSV / multer-rejected file → 400.** Uploading a file the multer `fileFilter` rejects (wrong mimetype/extension) returns `400`. Exceeding the 10 MB size limit returns `400`.
3. **CSV parse failure → 422.** A request whose `file` is present but whose contents fail metadata parsing OR row parsing returns HTTP `422 Unprocessable Entity`. The original parser `Error.message` is surfaced in the response body so the caller knows which field/row failed.
4. **DB save failure → 500.** If the transaction in `ingestCsv` throws (connection lost, constraint violation, etc.), the endpoint returns HTTP `500 Internal Server Error`. Parser errors must NOT be misclassified as 500, and DB errors must NOT be misclassified as 422.
5. The mapping mechanism is implemented with NestJS primitives only: built-in `HttpException` subclasses (`BadRequestException`, `UnprocessableEntityException`, `InternalServerErrorException`) and/or an exception filter. **No raw `res.status(...)` calls.**
6. Parse errors are distinguishable from DB errors by the handler — the implementation does not rely on a `try/catch` so broad that a DB failure is reported as 422. (See Build steps for the recommended ordering.)
7. Automated tests added under `apps/backend/src/ingestion/` covering: missing file → 400, parse failure → 422, DB failure → 500 (DB failure simulated via a mocked transaction/repo that throws). Happy path (201) still passes.
8. `pnpm --filter backend lint`, `pnpm --filter backend build`, and `pnpm --filter backend test` all pass.

## Rules that must hold
- No `any`. Type caught errors as `unknown` and narrow with `error instanceof Error`.
- HTTP concerns stay in the controller / a filter; the service signals failure by throwing typed `HttpException` subclasses, not by returning status codes.
- Use NestJS built-in `HttpException` subclasses or a registered exception filter. No magic number status codes.
- Backward compatible: a valid CSV must still return `201` with `{ raceId, rowsIngested }` exactly as today.
- Parser services (`csv-metadata-parser`, `csv-rows-parser`) keep throwing plain `Error` — do NOT change their throw type. The mapping to 422 happens at the ingestion service boundary, not inside the parsers.
- Do not swallow errors silently. Every mapped error must produce a response body with a human-readable message.
- Error response shape follows NestJS's default `HttpException` JSON shape (`{ statusCode, message, error }`).
- Do not leak DB internals/SQL to the client in 500 responses; log the original error server-side.

## Build steps
1. **Missing-file → 400 (controller).** In `ingestion.controller.ts`, add an explicit null guard before calling the service:
   ```typescript
   if (!file) throw new BadRequestException('CSV file is required (field name: "file")');
   ```
   Import `BadRequestException` from `@nestjs/common`.
2. **Multer rejection → 400 (upload config).** In `csv-upload.config.ts`, replace the plain `Error` in `fileFilter` with `BadRequestException` so NestJS maps it to 400 directly:
   ```typescript
   cb(new BadRequestException('Only CSV files are accepted'), false);
   ```
   Also handle `LIMIT_FILE_SIZE`: add an exception filter or verify multer's `MulterError` with `LIMIT_FILE_SIZE` code is caught and mapped to 400 (see Notes).
3. **Parse failure → 422 (service).** In `ingestion.service.ts`, wrap ONLY the two parser calls in a `try/catch`:
   ```typescript
   let metadata: RaceMetadata;
   let rows: ParsedRaceResult[];
   try {
     metadata = this.metadataParser.parseMetadata(csv);
     rows = this.rowsParser.parseRows(csv, metadata);
   } catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Failed to parse CSV';
     throw new UnprocessableEntityException(message);
   }
   ```
   Keep the `dataSource.transaction(...)` call **outside** this `try` block.
4. **DB failure → 500 (service).** Wrap the transaction call in a separate `try/catch`:
   ```typescript
   try {
     raceId = await this.dataSource.transaction(async (manager) => { ... });
   } catch (error: unknown) {
     // Log full error server-side; return safe message
     throw new InternalServerErrorException('Failed to save race data');
   }
   ```
   Import `InternalServerErrorException` from `@nestjs/common`.
5. **Tests.** Add `apps/backend/src/ingestion/ingestion.service.spec.ts`:
   - Mock `metadataParser.parseMetadata` to throw → expect `UnprocessableEntityException`.
   - Mock `rowsParser.parseRows` to throw → expect `UnprocessableEntityException`.
   - Mock `dataSource.transaction` to reject → expect `InternalServerErrorException`.
   - Valid input (mock parsers + transaction succeed) → returns `{ raceId, rowsIngested }`.

   Add `apps/backend/src/ingestion/ingestion.controller.spec.ts`:
   - `file` is `undefined` → expect `BadRequestException`.
   - `ingestionService.ingestCsv` resolves → returns result with status 201.
6. Run `pnpm --filter backend lint && pnpm --filter backend build && pnpm --filter backend test`; fix any issues.

## Notes for the implementer

**Status code map (authoritative):**
| Condition | Status |
|---|---|
| `file` field absent from multipart body | `400 Bad Request` |
| multer `fileFilter` rejects file type | `400 Bad Request` |
| file exceeds 10 MB (`LIMIT_FILE_SIZE`) | `400 Bad Request` |
| metadata parse error (missing/invalid header field) | `422 Unprocessable Entity` |
| row parse error (bad time, missing column, split mismatch) | `422 Unprocessable Entity` |
| transaction / DB save failure | `500 Internal Server Error` |

**Why split the try/catch by phase:** A single broad `try/catch` around parse + transaction would map DB failures to 422 (wrong). Catch parser calls and the transaction separately so each gets the right status code.

**Multer `LIMIT_FILE_SIZE` handling:** Multer throws a `MulterError` (not a plain `Error`) with `code: 'LIMIT_FILE_SIZE'` when the file exceeds the size limit. NestJS's default exception layer does not map this to a friendly 4xx — it returns 500. To intercept it, add a `MulterExceptionFilter` or handle it in a filter registered on the `IngestionModule`. Example catch clause: `if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') throw new BadRequestException('File exceeds 10 MB limit')`.

**`BadRequestException` in multer fileFilter:** `cb(new BadRequestException(...), false)` works because NestJS's exception layer recognises `HttpException` subclasses thrown from within the interceptor pipeline and maps them to the correct status — no separate filter needed for this case.

**Empty-but-valid CSV:** `parseRows` returns `[]` when there are no data rows (no throw). This yields `201` with `rowsIngested: 0`. Accepted as-is — no 422 for zero rows unless the product owner asks otherwise.

**Do not leak internals:** the 500 message sent to the client must be generic. Log the full `error` object (with stack) at `Logger.error(...)` inside the catch block before rethrowing.

**Out of scope for step 20:**
- Swagger `@ApiResponse` documentation of error codes → step 25.
- Rate limiting / auth on the endpoint.
- Structured error codes or i18n of messages.
- Business-level validation beyond what the parsers already enforce (e.g. duplicate athlete detection).