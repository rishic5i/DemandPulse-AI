# Testing guide

## Commands

```bash
pnpm test
pnpm test:watch
pnpm lint
pnpm typecheck
pnpm security:audit
pnpm build
pnpm check
```

## Local hooks

Husky pre-commit runs:

1. lint-staged (ESLint on staged JS/TS)
2. typecheck
3. unit tests

## Required coverage areas

- CSV parsing / malformed rows
- Signal schema validation
- Unknown entity handling
- Duplicate detection
- Feature aggregation determinism
- Missing vs zero values
- No future leakage in features

## Rules

- Mock AI in unit/integration tests
- CI must not require `OPENROUTER_API_KEY` or `GROQ_API_KEY`
- Before claiming done: `pnpm check` and green PR CI (Quality + Security)
- TypeScript project: ESLint/audit/gitleaks — not Python ruff

## Manual E2E checklist

1. `/api/health` → `ai.configured=true`
2. Run Full Demo
3. Signals appear with evidence
4. Feature Store exports CSV/JSON
5. Copilot answers from current dataset only
