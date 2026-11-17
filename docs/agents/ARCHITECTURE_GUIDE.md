# Architecture guide (agent)

Companion to [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Shape

Modular monolith on Next.js App Router.

```text
UI (client state)
  -> POST /api/analyze
      -> Groq extraction (semantics)
      -> normalize/validate entities
      -> generateFeatures() deterministic math
  -> Overview / Explorer / Feature Store / Export
  -> POST /api/assistant (optional, context from client)
```

## Separation rule

| Concern | Owner |
|---|---|
| Parsing uploads | `modules/ingestion` |
| Prompting / extraction | `providers/ai` + `modules/intelligence` |
| Numerical features | `modules/features` |
| HTTP adapters | `app/api/*` |
| Presentation | `components/*` |

## Serverless constraints

- No durable filesystem/DB in MVP
- In-memory `runId` store is best-effort only
- Client keeps the analyze payload (`sessionStorage`)

## Extension points

- New signal categories → schema + prompt enum + normalize mapping
- New features → `generate.ts` formulas + Feature Store columns + tests
- New AI vendor → new provider class via factory
