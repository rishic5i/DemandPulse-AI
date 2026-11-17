# AI provider guide

## Current decision

Primary (free, no credit card): **OpenRouter** with `openrouter/free`

Fallback: **Groq** (`openai/gpt-oss-20b`) when OpenRouter free quota is exhausted

- OpenRouter: OpenAI-compatible `fetch` to `https://openrouter.ai/api/v1`
- Groq: official `groq-sdk`
- Structured outputs: JSON Schema with `strict: true` when supported
- Always re-validate with Zod (`extractedSignalsResponseSchema`)
- Free OpenRouter models only: `openrouter/free` or IDs ending in `:free` (no paid fallbacks)

Research source of truth: [`../TECHNICAL_RESEARCH.md`](../TECHNICAL_RESEARCH.md)

## Env vars

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free

# Fallback
# AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Implementation map

- Interface: `src/providers/ai/ai-provider.interface.ts`
- OpenRouter: `src/providers/ai/openrouter.provider.ts`
- Groq: `src/providers/ai/groq.provider.ts`
- Factory: `src/providers/ai/provider.factory.ts`
- Prompts: `src/modules/intelligence/prompts.ts`
- Normalize: `src/modules/intelligence/normalize.ts`

## Behavior rules

1. Batch notes in small groups (default 3) — larger strict-schema batches can fail
2. On structured-output / Zod failure, split the batch and retry; for a single note, fall back to `json_object` + Zod
3. Retry only retryable failures (429 / JSON validate) with bounded backoff
4. On failure, surface a clear error — never fabricate signals
5. Confidence and potentialImpact are separate metrics
6. Unknown entities become `null` / `UNRESOLVED_ENTITIES`
7. OpenRouter free tier (no credits): ~20 RPM / **50 RPD** — concurrency is 1

## Adding another provider later

1. Implement `AiProvider`
2. Register in `provider.factory.ts`
3. Keep analyze/assistant business logic unchanged
