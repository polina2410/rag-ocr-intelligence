# Current Feature: Multer CSV Upload Configuration

## Status
In Progress

## Goals

- New `apps/backend/src/ingestion/csv-upload.config.ts` exporting `CSV_MULTER_OPTIONS: MulterOptions` (memory storage, CSV-only file filter, 10 MB size limit)
- New `apps/backend/src/ingestion/ingestion.controller.ts` — empty `@Controller('ingest')` class, no route methods
- `IngestionController` added to `controllers` array in `IngestionModule`
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass

## Notes

- Spec: `context/specs/step-18-multer-csv-upload.md`
- `multer@^2.1.1` and `@types/multer@^2.1.0` already installed
- File filter: accept `mimetype === 'text/csv'` OR `originalname.endsWith('.csv')`; reject with descriptive `Error`
- Memory storage — step 19 reads `file.buffer.toString('utf-8')` to pass to parsers
- `_req` prefix on unused fileFilter param to satisfy lint
- OUT OF SCOPE: routes, `@UseInterceptors`, `FileInterceptor` — those belong to step 19

## History

<!-- Completed features are tracked in context/features-history.md -->