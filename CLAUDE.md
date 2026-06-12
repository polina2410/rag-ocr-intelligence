# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ocr-intelligence** — pnpm monorepo with a React/Vite frontend and NestJS backend.

- **Frontend** (`apps/frontend/`): React 19, Vite, TypeScript, React Router DOM, TanStack Query, Axios, Framer Motion, Recharts
- **Backend** (`apps/backend/`): NestJS, TypeORM, PostgreSQL, Qdrant (vector DB), OpenAI SDK, Multer (file uploads), CSV parsing
- **Shared types** (`packages/types/`): `@ocr/types` — shared DTOs consumed by both apps
- **Infrastructure**: Docker Compose — PostgreSQL on port 5433, Qdrant on port 6333

## Commands

```bash
# Infrastructure (run first)
docker compose up -d

# Frontend
pnpm --filter frontend dev        # Start Vite dev server
pnpm --filter frontend build      # Production build
pnpm --filter frontend lint       # Run ESLint

# Backend
pnpm --filter backend start:dev   # Start NestJS with watch
pnpm --filter backend build       # Production build
pnpm --filter backend lint        # Run ESLint
pnpm --filter backend test        # Run Jest tests
pnpm --filter backend test:e2e    # Run e2e tests
pnpm --filter backend test:cov    # Run Jest with coverage
```

## Code Style

- Always use TypeScript — no `any` types, use `unknown` or proper generics
- Prefer named exports over default exports (backend); React components may use default exports
- Use `const` arrow functions for React components
- No magic numbers — extract named constants

### Frontend

- Styles via plain CSS or CSS Modules (`.module.css`) — no inline styles
- No prop drilling beyond 2 levels — use context or TanStack Query state
- HTTP calls only via Axios instances in a dedicated `api/` layer
- One component per file

### Backend

- Follow NestJS module structure: `module / controller / service / dto / entity`
- Validate all incoming data with DTOs and class-validator decorators
- Use TypeORM entities for PostgreSQL; use Qdrant client directly for vector operations
- OpenAI calls belong in a dedicated service — never inline in controllers

## Architecture

```
apps/frontend/src/
  components/     # Reusable React components
  pages/          # Route-level page components
  hooks/          # Custom React hooks
  api/            # Axios API call functions
  types/          # TypeScript types/interfaces

apps/backend/src/
  <feature>/
    <feature>.module.ts
    <feature>.controller.ts
    <feature>.service.ts
    dto/
    entities/

packages/types/src/
  *.dto.ts        # Shared DTOs — import via @ocr/types
  index.ts
```

## Testing

- Backend tests live in `apps/backend/src/` (`.spec.ts`) and `apps/backend/test/` (e2e)
- Uses Jest + `@nestjs/testing`
- Always test happy path + at least one error case
- Run `pnpm --filter backend test` before marking backend work complete

## Git

- Branch names: `kebab-case` derived from feature name
- Never force-push main
- Commit messages: imperative mood, under 72 chars
- Never commit `.env` or secrets
- Always confirm with the user before destructive git commands