---
name: ai-semantics-only
description: Guardrails when changing AI providers, prompts, extraction, or features in DemandPulse. Use when editing prompts, Groq/OpenRouter providers, sanitize/normalize, or feature math.
---

# AI extracts semantics — TypeScript does math

## Invariants (do not break)

1. LLM extracts semantic events only (category, direction, evidence, confidence, impact).
2. Numerical features live only in `src/modules/features/generate.ts`.
3. Never invent SKU / retailer / region / product / dates — catalog match or null.
4. Never silently mock AI when live inference fails.
5. Keep demand features separate from supply-risk (`isSupplyRisk`).
6. Secrets stay server-side (`OPENROUTER_API_KEY` / `GROQ_API_KEY` — never `NEXT_PUBLIC_*`).

## Where to edit

| Change | File |
|---|---|
| Prompt text | `src/modules/intelligence/prompts.ts` |
| Schema / Zod | `src/schemas/` |
| Cleanup after model | `src/modules/intelligence/sanitize-extraction.ts` |
| Catalog validation | `src/modules/intelligence/normalize.ts` |
| Feature formulas | `src/modules/features/generate.ts` |
| Provider / failover | `src/providers/ai/` |

## Before finish

- Add/adjust unit tests under `tests/unit/`
- Run `pnpm test` and `pnpm typecheck`
- Manual: Run Full Demo — errors must surface, not fake success
