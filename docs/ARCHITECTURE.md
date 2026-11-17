# Architecture

## Overview

DemandPulse AI is a Next.js modular monolith:

```text
Browser UI  ->  /api/analyze  ->  Groq extraction
                              ->  normalize signals
                              ->  deterministic features
            ->  dashboard / explorer / feature store / export
            ->  /api/assistant (optional Q&A over provided context)
```

## Data flow

1. User uploads sales CSV + notes CSV/text (or loads demo files).
2. Client validates/parses with PapaParse + Zod.
3. `POST /api/analyze` sends parsed rows to the server.
4. Groq extracts structured events via JSON Schema.
5. Server validates with Zod, resolves entities against sales catalog, deduplicates.
6. Feature engine computes numerical features in TypeScript.
7. Response returns full analysis payload; UI stores it in memory + `sessionStorage`.

## AI extraction flow

- Prompt policy forbids inventing entities.
- Unknown/invented entities become `null` / `UNRESOLVED_ENTITIES`.
- Supply disruption category marks `isSupplyRisk=true`.
- Confidence and potential impact remain separate metrics.

## Feature-generation flow

Implemented in `src/modules/features/generate.ts`.

- Null = no evidence for that key/metric.
- Zero = observed zero (for example no promotions among existing signals).
- Future-dated signal starts are excluded (no leakage).
- Source lineage preserved via `sourceSignalIds`.

## Security boundaries

- `GROQ_API_KEY` server-only.
- Health endpoint never returns secrets.
- API errors omit stack traces.
- Upload/text size capped in ingestion helpers.

## Deployment assumptions

- Vercel serverless functions.
- In-memory analysis store is best-effort only.
- Clients must retain analyze responses for dashboard/export reliability.
