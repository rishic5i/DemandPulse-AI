# Coding standards

## TypeScript

- `strict` mode
- Avoid `any` unless unavoidable and justified at the call site
- Prefer explicit domain types in `src/types/domain.ts`
- Validate boundaries with Zod in `src/schemas`

## Naming

- Files: kebab-case (`groq.provider.ts`)
- React components: PascalCase exports
- API error codes: `SCREAMING_SNAKE_CASE`

## Module boundaries

- UI components render and gather input only
- Feature math lives in `src/modules/features`
- AI I/O lives in `src/providers/ai`
- Do not call Groq from client components

## Dependencies

- Package manager: **pnpm only**
- Do not add libraries unless they unblock MVP value
- Prefer stdlib + existing stack (Zod, PapaParse, Recharts, groq-sdk)

## Error handling

- User-facing errors must be actionable
- API responses: `{ requestId, error: { code, message, details } }`
- Never return stack traces or secrets
