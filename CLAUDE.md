# Claude Code — DemandPulse AI

Read and follow these files in order:

1. [`AGENTS.md`](./AGENTS.md) — canonical shared rules (always)
2. [`docs/agents/00-INDEX.md`](./docs/agents/00-INDEX.md) — task → document map
3. [`docs/agents/GIT_WORKFLOW.md`](./docs/agents/GIT_WORKFLOW.md) before any commit/push
4. Open the specific `docs/agents/*.md` file that matches your task

Do not duplicate long standards in this file. Keep Claude Code and Cursor aligned through the shared docs above.

## Mandatory delivery rule

Never push feature commits directly to `main`. Always:

1. create `feature/...`
2. open a PR
3. wait for Quality + Security checks
4. merge only when green

## Quick commands

```bash
pnpm install
pnpm check
pnpm dev
```

## Demo verification

Open the app and click **Run Full Demo**. Confirm Overview → Signal Explorer → Feature Store → Export still works after your change.

## Project skills (`.claude/skills/`)

| Skill | When to use |
|---|---|
| `verify-full-demo` | Smoke-test the judge demo path after a change |
| `safe-feature-pr` | Branch, gates, and open a PR (never push to `main`) |
| `ai-semantics-only` | Touching prompts, providers, normalize, or feature math |
