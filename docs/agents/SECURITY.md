# Security checklist

## Stack note

This is a **TypeScript / Next.js** repo. Python tools like `ruff` are not used.
Equivalent gates:

| Concern | Tool |
|---|---|
| Lint / static quality | ESLint (`pnpm lint`) |
| Types | `tsc --noEmit` (`pnpm typecheck`) |
| Tests | Vitest (`pnpm test`) |
| Dependency vulns | `pnpm audit --audit-level=high` |
| Secrets in git history/diff | Gitleaks CI job |
| Local pre-commit | Husky + lint-staged + typecheck + tests |

## Application rules

- `OPENROUTER_API_KEY` / `GROQ_API_KEY` are server-only; never `NEXT_PUBLIC_*`
- Do not log full uploaded customer payloads
- Validate all external + AI inputs with Zod
- Stateless serverless: no durable secret/file storage assumptions
- Demo data only for public AI calls

## Commands

```bash
pnpm security:audit
pnpm check
```

## CI

Pull requests must pass both:

1. **Quality** job
2. **Security** job
