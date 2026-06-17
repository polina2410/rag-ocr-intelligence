# OCR Race Intelligence — Build Plan

A full-stack developer portfolio project built with React + TypeScript, NestJS, and a RAG pipeline over obstacle course race data.

**Stack:** Turborepo · React 19 · TypeScript · NestJS · TypeORM · Postgres · Qdrant · OpenAI · Bull · Framer Motion · Recharts · TanStack Query

---

## Phase 1 — Scaffold

1. ✅ Initialize Turborepo monorepo structure with `apps/frontend`, `apps/backend`, `packages/types`
2. ✅ Configure `packages/types` — shared folder structure, `tsconfig.json`, `package.json`
3. ✅ Add first shared DTOs: `RaceDto` and `AthleteDto` in `packages/types`
4. ✅ Set up shared ESLint config in root, extend in all packages
5. ✅ Set up shared Prettier config in root, extend in all packages
6. ✅ Configure `turbo.json` with `build`, `dev`, `lint` pipelines
7. ✅ Set up `docker-compose.yml` with Postgres and Qdrant services
8. ✅ Configure backend `.env` and `@nestjs/config` module

---

## Phase 2 — Data Layer

9. ✅ Create `Race` TypeORM entity
10. ✅ Create `Athlete` TypeORM entity
11. ✅ Create `RaceResult` TypeORM entity
12. ✅ Create `ObstacleSplit` TypeORM entity
13. ✅ Create database connection module with TypeORM and config
14. ✅ Build CSV metadata parser — reads `#` comment headers into a `RaceMetadata` object
15. ✅ Build CSV rows parser — maps data rows to `RaceResult` and `ObstacleSplit` objects
16. ✅ Write unit tests for CSV metadata parser
17. ✅ Write unit tests for CSV rows parser
18. ✅ Set up Multer file upload middleware for CSV ingestion
19. ✅ Build `POST /ingest/csv` endpoint — validates file, calls parsers, saves to DB
20. ✅ Build error handling and validation for ingestion endpoint
21. ✅ Build `GET /races` endpoint — returns paginated list of races
22. ✅ Build `GET /races/:id` endpoint — returns race with results and splits
23. ✅ Build `GET /athletes` endpoint — returns paginated list of athletes
24. ✅ Build `GET /athletes/:id` endpoint — returns athlete with all race results
25. ✅ Add Swagger decorators to all endpoints and DTOs

---

## Phase 3 — RAG Pipeline

26. ✅ Set up Qdrant collection with correct vector size and distance metric
27. ✅ Build `VectorStoreService` — upsert vectors with metadata to Qdrant
28. ✅ Build `VectorStoreService` — query Qdrant for top-k similar vectors
29. ✅ Build text serializer — converts `RaceResult` row to natural language chunk
30. ✅ Build `EmbedService` — calls OpenAI embeddings API for a single chunk
31. ✅ Build `EmbedService` — batch embed all results for a race after ingestion
32. ✅ Build `RetrieveService` — embeds user query and fetches top-k chunks with metadata
33. ✅ Build prompt builder — assembles system prompt with retrieved context chunks
34. ✅ Build `GenerateService` — calls LLM API and streams response tokens
35. ✅ Build SSE stream handler in NestJS — pipes LLM stream to HTTP response
36. ✅ Build `POST /ask` endpoint — wires retrieve, prompt builder, and SSE stream
37. ✅ Set up Bull queue module with Redis connection (BullMQ)
38. ✅ Build Bull job processor — runs embedding pipeline for a race in the background
39. ✅ Wire CSV ingestion endpoint to trigger Bull job after successful DB save

---

## Phase 4 — Frontend UI

40. ✅ Set up React Router with lazy routes for `/races`, `/races/:id`, `/ask`
41. ✅ Set up Suspense boundaries with fallbacks per route
42. ✅ Set up TanStack Query client with global config and devtools
43. ✅ Build `ErrorBoundary` component
44. ✅ Build `RootLayout` — navbar, cursor provider wrapper, page slot
45. ✅ Build `Navbar` component — links, active state, responsive
46. ✅ Build `PageWrapper` component — max-width, consistent padding
47. ✅ Build `Badge` component — category label with color variants
48. ✅ Build `SkeletonCard` component
49. ✅ Build `SkeletonTable` component
50. ✅ Build `SkeletonChart` component
51. ✅ Build `RaceCard` component — name, date, location, distance, obstacle count
52. ✅ Build `RaceCardStats` component — lazy-loaded on hover, finisher count, avg time, DNF rate
53. ✅ Build `/races` page — grid of `RaceCard` components with `SkeletonCard` fallback
54. ✅ Build `RaceHeader` component — race name, date, location, distance
55. ✅ Build `ObstacleSplitChart` — Recharts bar chart, average time per obstacle
56. ✅ Build `PenaltyRateChart` — Recharts bar chart, fail percentage per obstacle
57. ✅ Build `CategoryFilter` — dropdown to filter leaderboard by category
58. ✅ Build `AthleteLeaderboard` — sortable table with overall and category place
59. ✅ Build `/races/:id` dashboard page — composes all dashboard components
60. ✅ Build `useSSE` hook — connects to SSE endpoint, streams tokens into state
61. ✅ Build `ChatInput` component — text input and submit button
62. ✅ Build `ChatMessage` component — message bubble, renders streaming tokens
63. ✅ Build `SourceCitations` component — expandable panel with retrieved chunks
64. ✅ Build `ChatHistory` component — scrollable list of messages
65. ✅ Build `/ask` page — composes chat components, wires `useSSE` hook
66. ✅ Build `DropZone` component — drag and drop CSV, file type validation
67. ✅ Build `/upload` page — composes DropZone, upload progress, error feedback, redirects to `/races/:id` on success
68. ✅ Build `DELETE /races/:id` endpoint — deletes race, cascades to RaceResult, ObstacleSplit, removes vectors from Qdrant
69. ✅ Add delete button to RaceCard — confirmation dialog, calls `DELETE /races/:id`, removes card from list on success

---

## Phase 5 — Polish + Cursor Engine

70. ✅ Build `CursorProvider` context — tracks mouse position, exposes `hint` and `mode`
71. ✅ Build `useCursor` hook — consumes `CursorProvider`, returns position and state
72. ✅ Build `CursorDot` component — follows mouse, changes shape on mode change
73. ✅ Build `data-cursor-hint` tooltip system — reads attribute, shows hint near cursor
74. ✅ Build magnifier mode — `<canvas>` redraws zoomed DOM region around cursor
75. Build Framer Motion parallax hero section on `/races` page
76. Write README — project overview and architecture diagram, local setup instructions with Docker, example RAG queries and demo screenshots
77. Verify `.env.example` file, unit test for the text serializer (step 29), error handling step for OpenAI failures in the embedding pipeline, rate limiting on POST /ask — someone could spam OpenAI requests
78. Verify `api.ts` or axios client setup, environment variable for the API base URL (VITE_API_URL)
79. Add empty state components if there are no such
80. Add EmbeddingStatus indicator on the race dashboard — user has no way to know if embedding is still running in the background 
81. Add font-size globals and Fluid typography
82. mobile and tablet responsiveness
83. Verify a11y across the project
84. Create a 404 page