---
name: safe-feature-pr
description: Create a feature branch, run quality gates, and open a PR for DemandPulse. Use when the user wants to commit, push, ship, or open a pull request.
---

# Safe feature PR

## Hard rules

- Never push feature work to `main`
- Never skip hooks (`--no-verify`) unless user explicitly asks
- Never commit `.env`, `.env.local`, or API keys
- Package manager is **pnpm** only

## Steps

1. `git status` + `git diff` — review what will ship.
2. Branch from updated `main`: `feature/<short-name>`.
3. Commit with a clear why-focused message.
4. Run `pnpm check` (lint + typecheck + test + audit + build).
5. Push branch: `git push -u origin HEAD`.
6. Open PR with `gh pr create` — include Summary + Test plan.
7. Wait for **Quality** + **Security** CI green before merge.

## Test plan minimum

- [ ] `pnpm check` locally
- [ ] Run Full Demo still works
- [ ] No secrets in diff
