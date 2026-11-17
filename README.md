# DemandPulse AI

Turn hidden business signals into intelligent demand features.

C5i Hackathon MVP — Consumer Goods Demand Signal Feature Service.

## What it does

1. Ingest historical sales CSV + unstructured business notes
2. Extract demand/supply events with OpenRouter (free) or Groq
3. Validate entities (no guessing)
4. Calculate deterministic forecasting features in TypeScript
5. Explore evidence, export CSV/JSON, and query via REST API

## Quick start

```bash
pnpm install
cp .env.example .env.local
# add OPENROUTER_API_KEY (or GROQ_API_KEY + AI_PROVIDER=groq)
pnpm dev
```

**Live demo:** https://demandpulse-ai.vercel.app

Demo path: **Home → Run Full Demo → Overview charts → Signal Explorer → Feature Store → Export**.

## Stack

Next.js App Router · TypeScript · pnpm · Tailwind · Zod · PapaParse · Recharts · Vitest · OpenRouter (`openrouter/free`) / Groq fallback

## API

- `GET /api/health`
- `POST /api/analyze`
- `GET /api/features?runId=...`
- `POST /api/assistant`

See [docs/API.md](docs/API.md).

## Testing & quality gates

```bash
pnpm check          # lint + typecheck + test + audit + build
pnpm security:audit
```

Pre-commit (Husky): lint-staged → typecheck → unit tests.

CI on every PR:

- **Quality** — lint, typecheck, test, build
- **Security** — dependency audit, Gitleaks, secret-pattern guard

Never push feature work directly to `main`. See [`docs/agents/GIT_WORKFLOW.md`](docs/agents/GIT_WORKFLOW.md).

## Cursor / Claude Code (hackathon agent setup)

Both tools share one instruction system — no divergent rulebooks.

| Entrypoint | Tool | Role |
|---|---|---|
| [`AGENTS.md`](./AGENTS.md) | Cursor + Claude Code | Canonical always-on rules |
| [`CLAUDE.md`](./CLAUDE.md) | Claude Code | Pointer into shared docs |
| [`.cursor/rules/`](./.cursor/rules/) | Cursor | Scoped rules by file area |
| [`docs/agents/00-INDEX.md`](./docs/agents/00-INDEX.md) | Both | Task → reference map |

Detailed agent references:

- [Product](docs/agents/PRODUCT.md)
- [File map](docs/agents/FILE_MAP.md)
- [Build playbook](docs/agents/BUILD_PLAYBOOK.md)
- [Coding standards](docs/agents/CODING_STANDARDS.md)
- [AI provider](docs/agents/AI_PROVIDER.md)
- [API contract](docs/agents/API_CONTRACT.md)
- [UI guide](docs/agents/UI_GUIDE.md)
- [Testing](docs/agents/TESTING.md)
- [Architecture guide](docs/agents/ARCHITECTURE_GUIDE.md)

No Cursor subscription or Claude API key is required to build/run the application itself.

## Environment

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Known limitations

- Stateless deployment: durable server storage is not included; UI keeps analysis in `sessionStorage`
- Free-tier OpenRouter limits (~50 RPD without credits) and Groq limits apply (see `docs/TECHNICAL_RESEARCH.md`)
- Demo CSVs are synthetic and labeled as such
- Forecast evaluation module intentionally deferred

## Docs

- [Technical research](docs/TECHNICAL_RESEARCH.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Development](docs/DEVELOPMENT.md)
- [Agent index](docs/agents/00-INDEX.md)
