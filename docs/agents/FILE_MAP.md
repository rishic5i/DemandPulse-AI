# File map

## App & API

| Path | Responsibility |
|---|---|
| `src/app/page.tsx` | Client shell wiring views + pipeline |
| `src/app/layout.tsx` | Root layout / metadata |
| `src/app/api/health/route.ts` | Health + AI config status |
| `src/app/api/analyze/route.ts` | Extract signals + generate features |
| `src/app/api/features/route.ts` | Best-effort feature lookup by `runId` |
| `src/app/api/assistant/route.ts` | Dataset-grounded Q&A |

## Domain modules

| Path | Responsibility |
|---|---|
| `src/modules/ingestion/csv.ts` | CSV / paste parsing + validation |
| `src/modules/intelligence/prompts.ts` | AI prompts only |
| `src/modules/intelligence/normalize.ts` | Entity resolve, dedupe, supply flag |
| `src/modules/features/generate.ts` | Deterministic feature formulas |

## AI provider

| Path | Responsibility |
|---|---|
| `src/providers/ai/ai-provider.interface.ts` | Provider contract |
| `src/providers/ai/groq.provider.ts` | Groq SDK + structured outputs |
| `src/providers/ai/provider.factory.ts` | `AI_PROVIDER` factory |
| `src/providers/ai/ai.types.ts` | Shared AI types / errors |

## UI

| Path | Responsibility |
|---|---|
| `src/components/upload/ingest-panel.tsx` | Upload + Run Full Demo |
| `src/components/dashboard/overview.tsx` | Metrics + charts |
| `src/components/dashboard/workflow-next.tsx` | Post-analysis navigation |
| `src/components/signals/signal-explorer.tsx` | Filterable evidence table |
| `src/components/features/feature-store.tsx` | Feature table + export |
| `src/components/copilot/copilot-panel.tsx` | Assistant UI |
| `src/hooks/use-analysis.ts` | Client pipeline state |

## Agent / docs entrypoints

| Path | Responsibility |
|---|---|
| `AGENTS.md` | Canonical shared agent rules |
| `CLAUDE.md` | Claude Code pointer |
| `.cursor/rules/*.mdc` | Cursor scoped rules |
| `.husky/pre-commit` | Local quality gates |
| `.github/workflows/ci.yml` | Quality + Security CI |
| `docs/agents/*` | Deep references for agents |
| `docs/agents/GIT_WORKFLOW.md` | Mandatory PR workflow |
| `docs/agents/SECURITY.md` | Security / audit guidance |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/API.md` | HTTP contract examples |
| `docs/TECHNICAL_RESEARCH.md` | Groq/hosting decisions |
