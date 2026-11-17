# Git workflow (mandatory)

## Rule

**Never push commits directly to `main`.**

All product changes must land through a pull request with green CI.

This applies to humans, Cursor, and Claude Code.

## Required flow

1. `git checkout main && git pull origin main`
2. `git checkout -b feature/<short-name>`
3. Implement + run local gates:
   ```bash
   pnpm check
   ```
   Pre-commit hooks also run lint-staged, typecheck, and unit tests.
4. Commit on the feature branch
5. `git push -u origin HEAD`
6. `gh pr create ...`
7. Wait for CI:
   - Quality (lint, typecheck, test, build)
   - Security (dependency audit, secret scan)
8. Merge only after checks are green
9. Do not use `--no-verify` unless the user explicitly authorizes it

## Forbidden

- `git push origin main` with new feature commits
- Merging with failing checks
- Committing `.env`, `.env.local`, or API keys
- Force-pushing `main`

## Why

Direct-to-main bypasses review, security scanning, and the hackathon-required agent/process discipline.
