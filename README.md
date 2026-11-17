# DemandPulse AI

Turn hidden business signals into intelligent demand features.

C5i Hackathon MVP — Consumer Goods Demand Signal Feature Service.

## What it does

1. Ingest historical sales CSV + unstructured business notes
2. Extract demand/supply events with Groq
3. Validate entities (no guessing)
4. Calculate deterministic forecasting features in TypeScript
5. Explore evidence, export CSV/JSON, and query via REST API

## Quick start

```bash
pnpm install
cp .env.example .env.local
# add GROQ_API_KEY
pnpm dev
```

Demo path: **Try Demo → Analyze Signals → Signal Explorer → Feature Store → Export**.

## Stack

Next.js App Router · TypeScript · pnpm · Tailwind · Zod · PapaParse · Recharts · Vitest · Groq (`openai/gpt-oss-20b`)

## API

- `GET /api/health`
- `POST /api/analyze`
- `GET /api/features?runId=...`
- `POST /api/assistant`

See [docs/API.md](docs/API.md).

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Cursor / Claude Code

Both tools follow the same canonical instructions in [`AGENTS.md`](./AGENTS.md).

- Cursor: `.cursor/rules` references `AGENTS.md`
- Claude Code: [`CLAUDE.md`](./CLAUDE.md) points to `AGENTS.md`

No tool-specific runtime dependency is required to build or run the app.

## Environment

```env
AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Known limitations

- Stateless deployment: durable server storage is not included; UI keeps analysis in `sessionStorage`
- Free-tier Groq rate limits apply (see `docs/TECHNICAL_RESEARCH.md`)
- Demo CSVs are synthetic and labeled as such
- Forecast evaluation module intentionally deferred

## Docs

- [Technical research](docs/TECHNICAL_RESEARCH.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Development](docs/DEVELOPMENT.md)
