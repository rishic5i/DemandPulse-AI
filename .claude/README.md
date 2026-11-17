# Claude Code configuration

Claude Code should start at the repo-root [`CLAUDE.md`](../CLAUDE.md).

That file points to:

- [`AGENTS.md`](../AGENTS.md) — canonical shared rules
- [`docs/agents/`](../docs/agents/) — detailed build/product/API/UI references

Keep `.claude/settings.json` minimal. Do not hardcode paid-model requirements for application runtime.

## Skills

Project skills live in [`.claude/skills/`](./skills/):

- `verify-full-demo` — smoke-test Run Full Demo path
- `safe-feature-pr` — feature branch + `pnpm check` + PR
- `ai-semantics-only` — LLM vs TypeScript invariants when changing AI/features
