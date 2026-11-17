# Technical Research

Verification date: 2026-11-17

## AI provider decision

Selected: **GroqCloud** with official `groq-sdk`.

Rejected alternatives for this MVP: Gemini (explicitly disallowed by build brief), OpenAI paid-first flows, local models (too heavy for 8 GB hackathon machines).

## Selected model

**`openai/gpt-oss-20b`**

Reasons:

- Listed as a production Groq model.
- Supports Structured Outputs with `strict: true` JSON Schema mode.
- Suitable for extraction tasks with bounded free-tier limits.
- Faster/cheaper than `openai/gpt-oss-120b` for hackathon volume.

Sources:

- https://console.groq.com/docs/models
- https://console.groq.com/docs/model/openai/gpt-oss-20b
- https://console.groq.com/docs/structured-outputs
- https://console.groq.com/docs/rate-limits

## Free-tier limitations (high-level Groq table)

For `openai/gpt-oss-20b` (organization-level; confirm on account Limits page):

- 30 RPM
- 1,000 RPD
- 8,000 TPM
- 200,000 TPD

MVP mitigations:

- Batch notes (8/note batch)
- Bounded retries on HTTP 429
- Cache analysis client-side (`sessionStorage`)
- Clear UI errors when key/quota missing — no silent mocks

## Hosting decision

Selected: **Vercel** (Hobby) for Next.js App Router convenience and preview deployments.

Constraint noted: Hobby is for non-commercial personal use under Vercel fair-use guidelines. Hackathon demos without payments/ads are commonly treated as acceptable, but commercial production use requires Pro/Enterprise. Documented for judges/operators.

Sources:

- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/legal/terms

## Important constraints

- No Docker/K8s/Redis/vector DB
- No Python/FastAPI/Streamlit application backend
- Stateless serverless: durable storage not included in MVP
- Synthetic demo data only

## Package baseline

- Next.js 16 App Router
- React 19
- Zod 4
- Vitest 5
- groq-sdk 1.x
