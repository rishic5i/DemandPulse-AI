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

Next.js App Router · TypeScript · pnpm · Tailwind · Zod · PapaParse · Recharts · Vitest · Groq (`openai/gpt-oss-20b`) · Vercel

## Reference map (open when needed)

| Need | Open |
|---|---|
| Agent docs index | `docs/agents/00-INDEX.md` |
| Product / demo path | `docs/agents/PRODUCT.md` |
| File locations | `docs/agents/FILE_MAP.md` |
| Implement a change | `docs/agents/BUILD_PLAYBOOK.md` |
| Coding rules | `docs/agents/CODING_STANDARDS.md` |
| Groq / prompts | `docs/agents/AI_PROVIDER.md` |
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
5. Secrets stay server-side (`GROQ_API_KEY` only — never `NEXT_PUBLIC_*`).
6. Assume serverless: no durable server memory/filesystem.
7. Package manager is **pnpm** only.

## Working loop

1. `git status` + read relevant `docs/agents/*` files
2. Prefer extending existing modules over rewrites
3. Keep prompts in `src/modules/intelligence/prompts.ts`
4. Keep feature math in `src/modules/features/generate.ts`
5. Before finish: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
6. Manual smoke: **Run Full Demo** → Explorer → Feature Store → Export

## Cursor vs Claude Code

- **Cursor**: follows this file + `.cursor/rules/*.mdc` (scoped by globs)
- **Claude Code**: starts at `CLAUDE.md`, which points here and to `docs/agents/`
- Do not maintain divergent instruction sets; change the canonical docs once
