<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DemandPulse AI — Canonical Agent Instructions

Shared by **Cursor**, **Claude Code**, and human contributors. Detailed references live under `docs/agents/` — open them by task instead of copying rules here.

## Mission

Build and preserve DemandPulse AI: convert unstructured consumer-goods notes into validated demand/supply signals and deterministic forecasting features.

## Stack

Next.js App Router · TypeScript · pnpm · Tailwind · Zod · PapaParse · Recharts · Vitest · OpenRouter (`openrouter/free`) / Groq fallback · Vercel

## Reference map (open when needed)

| Need | Open |
|---|---|
| Agent docs index | `docs/agents/00-INDEX.md` |
| Product / demo path | `docs/agents/PRODUCT.md` |
| File locations | `docs/agents/FILE_MAP.md` |
| Implement a change | `docs/agents/BUILD_PLAYBOOK.md` |
| Git / PR workflow | `docs/agents/GIT_WORKFLOW.md` |
| Security gates | `docs/agents/SECURITY.md` |
| Coding rules | `docs/agents/CODING_STANDARDS.md` |
| AI provider / prompts | `docs/agents/AI_PROVIDER.md` |
| REST contracts | `docs/agents/API_CONTRACT.md` |
| UI / demo UX | `docs/agents/UI_GUIDE.md` |
| Tests / gates | `docs/agents/TESTING.md` |
| Architecture | `docs/agents/ARCHITECTURE_GUIDE.md` + `docs/ARCHITECTURE.md` |
| Research decisions | `docs/TECHNICAL_RESEARCH.md` |

## Hard invariants

1. LLM extracts semantic events only; TypeScript calculates numerical features.
2. Never invent SKU, retailer, region, dates, or quantities.
3. Never silently mock AI when live inference fails.
4. Keep demand features separate from supply-risk features.
5. Secrets stay server-side (`OPENROUTER_API_KEY` / `GROQ_API_KEY` only — never `NEXT_PUBLIC_*`).
6. Assume serverless: no durable server memory/filesystem.
7. Package manager is **pnpm** only.
8. **Never push directly to `main`.** Use `feature/...` + PR + green CI (Quality + Security).
9. Never skip git hooks (`--no-verify`) unless the user explicitly requests it.

## Working loop

1. Branch from updated `main` into `feature/<name>`
2. `git status` + read relevant `docs/agents/*` files
3. Prefer extending existing modules over rewrites
4. Keep prompts in `src/modules/intelligence/prompts.ts`
5. Keep feature math in `src/modules/features/generate.ts`
6. Before finish: `pnpm check` (lint + typecheck + test + audit + build)
7. Push branch, open PR, wait for CI green, then merge
8. Manual smoke: **Run Full Demo** → Explorer → Feature Store → Export

## Quality & security gates

Local pre-commit (Husky):

- lint-staged (ESLint on staged JS/TS)
- `pnpm typecheck`
- `pnpm test`

CI on every PR:

- Quality: lint, typecheck, test, build
- Security: `pnpm audit --audit-level=high`, Gitleaks, secret-pattern guard

Note: this is a TypeScript repo. Use ESLint/audit/gitleaks — not Python `ruff`.

## Cursor vs Claude Code

- **Cursor**: follows this file + `.cursor/rules/*.mdc` (scoped by globs)
- **Claude Code**: starts at `CLAUDE.md`, which points here and to `docs/agents/`
- Do not maintain divergent instruction sets; change the canonical docs once
