<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may never be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DemandPulse AI — Agent Instructions

This file is the **canonical** engineering instruction set for Cursor, Claude Code, and human contributors.

## Product

DemandPulse AI converts unstructured consumer-goods business notes into validated demand/supply signals and deterministic numerical features that forecasting systems can consume.

Tagline: Turn hidden business signals into intelligent demand features.

## Stack

- Next.js App Router + TypeScript
- pnpm
- Tailwind CSS + lightweight UI primitives
- Zod validation
- PapaParse CSV parsing
- Recharts
- Vitest
- Groq (`groq-sdk`) for AI inference
- Deploy target: Vercel

## Architecture

Modular monolith:

- `src/app` — UI routes + REST API routes
- `src/modules/ingestion` — CSV/text parsing
- `src/modules/intelligence` — prompts + signal normalization
- `src/modules/features` — deterministic feature engineering
- `src/providers/ai` — AI provider abstraction (Groq)
- `src/schemas` — Zod schemas
- `src/components` — UI only; no business formulas

Rules:

1. LLM extracts semantic events only.
2. TypeScript calculates numerical features.
3. Never invent SKU/retailer/region/dates.
4. Never silently mock AI when live inference fails.
5. Keep demand features separate from supply-risk features.
6. Assume serverless: no durable server filesystem/memory.

## Coding conventions

- Strict TypeScript; avoid `any`.
- Validate external + AI inputs with Zod.
- Prefer small focused modules.
- Keep prompts in `src/modules/intelligence/prompts.ts`.
- Name files with kebab-case; React components PascalCase exports.
- Do not add dependencies unless required for MVP value.

## API conventions

- `/api/health` — config status, no secrets
- `/api/analyze` — extract signals + generate features
- `/api/features?runId=` — best-effort in-memory lookup
- `/api/assistant` — Q&A over provided analysis context

All responses include `requestId`. Errors use `{ error: { code, message, details } }`.

## AI provider rules

- Provider selected by `AI_PROVIDER` (default `groq`).
- Keys server-side only. Never `NEXT_PUBLIC_GROQ_*`.
- Default model: `openai/gpt-oss-20b`.
- Use JSON Schema structured outputs + Zod validation.
- Handle 429/quota with clear errors.
- Batch notes to respect rate limits.

## Testing

- Unit tests in `tests/unit`.
- Mock AI in automated tests; never require live keys in CI.
- Before commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Security

- Do not commit `.env.local` or secrets.
- Do not log full uploaded customer data unnecessarily.
- Limit upload/payload sizes.
- Use synthetic/public demo data only.

## Git / delivery

- Branch from `main` using `feature/...`.
- Small descriptive commits.
- CI via GitHub Actions (lint/typecheck/test/build).
- Do not force-push `main`.
- Do not merge without authorization.

## Docs updates

When behavior changes, update:

- `README.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/TECHNICAL_RESEARCH.md` (provider/model decisions)

## Preserve existing work

- Inspect git status before large edits.
- Do not overwrite unrelated changes.
- Prefer extending modules over rewriting.
