# Claude Code — DemandPulse AI

Read and follow these files in order:

1. [`AGENTS.md`](./AGENTS.md) — canonical shared rules (always)
2. [`docs/agents/00-INDEX.md`](./docs/agents/00-INDEX.md) — task → document map
3. Open the specific `docs/agents/*.md` file that matches your task

Do not duplicate long standards in this file. Keep Claude Code and Cursor aligned through the shared docs above.

## Quick commands

```bash
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Demo verification

Open the app and click **Run Full Demo**. Confirm Overview → Signal Explorer → Feature Store → Export still works after your change.
