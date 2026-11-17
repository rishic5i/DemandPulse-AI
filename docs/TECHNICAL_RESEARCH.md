# Technical Research

Verification date: 2026-11-17 (updated for OpenRouter free tier)

## AI provider decision

Primary: **OpenRouter** free models (`openrouter/free` or `*:free`) via OpenAI-compatible HTTP API.

Fallback: **GroqCloud** with official `groq-sdk` and `openai/gpt-oss-20b`.

Rejected alternatives for this MVP: Gemini (explicitly disallowed by build brief), OpenAI paid-first flows, local Ollama (works locally but not on Vercel Hobby without a remote host).

## Selected models

**OpenRouter:** `openrouter/free`

- Router selects available free models that support requested features (including structured outputs when present)
- $0 token cost; no credit card required
- Guardrail: never configure paid model fallbacks (avoids 402 charges on empty balance)

**Groq fallback:** `openai/gpt-oss-20b`

- Supports Structured Outputs with `strict: true` JSON Schema mode
- Suitable for extraction tasks with bounded free-tier limits

Sources:

- https://openrouter.ai/openrouter/free
- https://openrouter.ai/docs/guides/routing/model-variants/free
- https://openrouter.ai/docs/api_reference/limits
- https://console.groq.com/docs/models
- https://console.groq.com/docs/structured-outputs

## Free-tier limitations

### OpenRouter (`:free` / `openrouter/free`, no credits purchased)

| Limit | Value |
|---|---|
| RPM | 20 |
| RPD | 50 |

Purchasing ≥ ~$10 credits lifetime raises free RPD to 1000 (optional; not required).

Full Demo (~27 notes, batch size 3) ≈ 9–15 requests → roughly 3–5 full demos/day on the no-card tier.

### Groq (`openai/gpt-oss-20b`, organization-level; confirm on account Limits page)

- 30 RPM
- 1,000 RPD
- 8,000 TPM
- 200,000 TPD

MVP mitigations:

- Batch notes (3/note batch)
- OpenRouter concurrency 1; Groq concurrency 2
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
- groq-sdk 1.x (Groq path); OpenRouter uses native `fetch`
