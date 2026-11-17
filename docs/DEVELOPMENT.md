# Development

## Prerequisites

- Node.js 22 (`nvm use` / `.nvmrc`)
- pnpm 10+
- OpenRouter API key from https://openrouter.ai/keys (free models, no credit card)
- Optional Groq fallback key from https://console.groq.com/keys

## Setup

```bash
pnpm install
cp .env.example .env.local
# set OPENROUTER_API_KEY in .env.local (or GROQ_API_KEY + AI_PROVIDER=groq)
pnpm dev
```

Open http://localhost:3000

Husky installs via the `prepare` script during `pnpm install`.

## Environment variables

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm security:audit
pnpm build
pnpm check
pnpm start
```

## Pre-commit hooks

Husky runs on every commit:

1. lint-staged → ESLint on staged JS/TS files
2. `pnpm typecheck`
3. `pnpm test`

Do not use `--no-verify` unless explicitly required.

## Git / PR process

See [`docs/agents/GIT_WORKFLOW.md`](agents/GIT_WORKFLOW.md).

Summary: branch → PR → wait for Quality + Security CI → merge. Never push features directly to `main`.

## Testing notes

- Unit tests mock/avoid live AI calls.
- CI does not require `OPENROUTER_API_KEY` or `GROQ_API_KEY`.
- Manual AI verification requires a valid key.
- This is TypeScript: ESLint/audit/gitleaks, not Python ruff.

## Deployment

1. Merge PR to `main` after green CI.
2. Vercel production deploys from `main`.
3. Confirm env vars in Vercel.
4. Verify `/api/health` and the demo flow.

## Agent workflows

- Cursor and Claude Code both follow `AGENTS.md`.
- Claude Code also reads `CLAUDE.md` (pointer only).
- Use pnpm exclusively.
