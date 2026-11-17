# Agent documentation index

Use this folder when building or extending DemandPulse AI with **Cursor** or **Claude Code**.

## Entry points

| File | Who reads it | Purpose |
|---|---|---|
| [`../../AGENTS.md`](../../AGENTS.md) | Cursor + Claude Code + humans | Canonical always-on project rules |
| [`../../CLAUDE.md`](../../CLAUDE.md) | Claude Code | Pointer into `AGENTS.md` + this index |
| [`../../.cursor/rules/`](../../.cursor/rules/) | Cursor | Scoped rules auto-attached by file globs |

## Read by task

| Task | Open these |
|---|---|
| Understand the product | [`PRODUCT.md`](PRODUCT.md) |
| Locate code quickly | [`FILE_MAP.md`](FILE_MAP.md) |
| Change architecture / modules | [`ARCHITECTURE_GUIDE.md`](ARCHITECTURE_GUIDE.md), [`../ARCHITECTURE.md`](../ARCHITECTURE.md) |
| Touch AI provider / prompts / schemas | [`AI_PROVIDER.md`](AI_PROVIDER.md) |
| Change REST routes | [`API_CONTRACT.md`](API_CONTRACT.md), [`../API.md`](../API.md) |
| Change UI / demo flow | [`UI_GUIDE.md`](UI_GUIDE.md) |
| Add tests / run quality gates | [`TESTING.md`](TESTING.md) |
| Commit / push / PR | [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md) |
| Security / audits / secrets | [`SECURITY.md`](SECURITY.md) |
| Implement a new feature safely | [`BUILD_PLAYBOOK.md`](BUILD_PLAYBOOK.md) |
| Coding conventions | [`CODING_STANDARDS.md`](CODING_STANDARDS.md) |

## Hard invariants (all agents)

1. LLM extracts semantic events only; TypeScript computes numerical features.
2. Never invent SKU / retailer / region / dates.
3. Never silently mock AI when live inference fails.
4. Keep demand features separate from supply-risk features.
5. Secrets stay server-side (`OPENROUTER_API_KEY` / `GROQ_API_KEY`, never `NEXT_PUBLIC_*`).
6. Use `pnpm` only.
7. Never push directly to `main` — PR + green Quality/Security CI required.
