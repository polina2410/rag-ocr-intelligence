# Implementation Task: Multer CSV Upload Configuration

## What to build
A reusable Multer options object for CSV file ingestion (memory storage, CSV-only file filter, size limit), plus an empty `IngestionController` shell registered in `IngestionModule`. No routes are added in this step — this is the foundation for the `POST /ingest/csv` endpoint (step 19).

## Current state
- `apps/backend/src/ingestion/ingestion.module.ts` — provides and exports `CsvMetadataParserService` and `CsvRowsParserService`. No `controllers` array yet.
- `apps/backend/src/ingestion/` — no controller file exists.
- `multer@^2.1.1` and `@types/multer@^2.1.0` installed in `apps/backend`.
- `@nestjs/platform-express@^11.0.1` installed (provides `FileInterceptor`, used in step 19).
- `@nestjs/common@^11.0.1` installed.
- No Multer configuration file exists anywhere in the backend.

## Deliverables (definition of done)
1. New file `apps/backend/src/ingestion/csv-upload.config.ts` exporting a named constant:
   ```typescript
   export const CSV_MULTER_OPTIONS: MulterOptions = { ... }
   ```
   with: memory storage, CSV-only file filter, 10 MB file size limit.
2. New file `apps/backend/src/ingestion/ingestion.controller.ts` — empty `@Controller('ingest')` class, no route methods.
3. `IngestionController` added to the `controllers` array in `IngestionModule` (and NOT added to `providers` or `exports`).
4. `pnpm --filter backend build` passes with zero errors.
5. `pnpm --filter backend lint` passes with zero new errors.

## Rules that must hold
- No `any`. `MulterOptions` is imported from the `multer` package; `memoryStorage` is imported from `multer`.
- `CSV_MULTER_OPTIONS` is a named `const` export — not a class, not a default export.
- The file filter rejects non-CSV files by calling `cb(new Error('Only CSV files are accepted'), false)` — do not silently swallow them.
- The file filter accepts a file if `file.mimetype === 'text/csv'` OR `file.originalname.toLowerCase().endsWith('.csv')` (handles clients that send CSV as `text/plain`).
- `IngestionController` has no `@UseInterceptors`, no `@Post`, no methods — those belong to step 19.
- No `any` on the `fileFilter` callback parameters — use the `Request` type from `express` and `Express.Multer.File`.

## Build steps
1. Create `apps/backend/src/ingestion/csv-upload.config.ts`:
   ```typescript
   import { memoryStorage } from 'multer'
   import type { MulterOptions } from 'multer'

   const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

   export const CSV_MULTER_OPTIONS: MulterOptions = {
     storage: memoryStorage(),
     limits: { fileSize: MAX_FILE_SIZE_BYTES },
     fileFilter: (_req, file, cb) => {
       const isCsv =
         file.mimetype === 'text/csv' ||
         file.originalname.toLowerCase().endsWith('.csv')
       if (isCsv) {
         cb(null, true)
       } else {
         cb(new Error('Only CSV files are accepted'), false)
       }
     },
   }
   ```
2. Create `apps/backend/src/ingestion/ingestion.controller.ts`:
   ```typescript
   import { Controller } from '@nestjs/common'

   @Controller('ingest')
   export class IngestionController {}
   ```
3. Update `apps/backend/src/ingestion/ingestion.module.ts` — add `controllers: [IngestionController]`.
4. Run `pnpm --filter backend lint` and `pnpm --filter backend build`; fix any issues.

## Notes for the implementer
**`MulterOptions` import path:** In multer 2.x, `MulterOptions` is a named type export from `'multer'`. Use `import type { MulterOptions } from 'multer'`. The `memoryStorage` function is a named runtime export: `import { memoryStorage } from 'multer'`.

**Why memory storage (not disk):** The step-19 handler receives `file.buffer` (a `Buffer`) and converts it to a string via `buffer.toString('utf-8')` before passing to `CsvMetadataParserService` and `CsvRowsParserService`. Disk storage would add file cleanup complexity.

**Why not configure Multer globally:** `MulterModule.register()` in NestJS applies one config globally. Using `FileInterceptor('file', CSV_MULTER_OPTIONS)` per-route (step 19) is more explicit and keeps the CSV-specific config scoped to the ingestion endpoint.

**MIME type caveat:** Safari and some CLI tools (e.g. `curl` without explicit `Content-Type`) send `.csv` files as `text/plain`. The extension fallback `.endsWith('.csv')` handles this without widening the filter to all `text/plain` files.

**`_req` parameter:** The `fileFilter` `req` parameter is unused — prefix with `_` to satisfy the `no-unused-vars` lint rule. Type it as `Request` from `'express'` or use `_req: unknown` if Express types are not in scope (they are, via `@nestjs/platform-express`).