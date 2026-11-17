# AI provider guide

## Current decision

- Provider: **Groq**
- SDK: `groq-sdk`
- Model: `openai/gpt-oss-20b`
- Structured outputs: JSON Schema with `strict: true`
- Always re-validate with Zod (`extractedSignalsResponseSchema`)

Research source of truth: [`../TECHNICAL_RESEARCH.md`](../TECHNICAL_RESEARCH.md)

## Env vars

```env
AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Implementation map

- Interface: `src/providers/ai/ai-provider.interface.ts`
- Groq: `src/providers/ai/groq.provider.ts`
- Factory: `src/providers/ai/provider.factory.ts`
- Prompts: `src/modules/intelligence/prompts.ts`
- Normalize: `src/modules/intelligence/normalize.ts`

## Behavior rules

1. Batch notes in small groups (default 3) — larger strict-schema batches can fail on `openai/gpt-oss-20b`
2. On `json_validate_failed`, split the batch and retry; for a single note, fall back to `json_object` + Zod
3. Retry only retryable failures (429 / JSON validate) with bounded backoff
4. On failure, surface a clear error — never fabricate signals
5. Confidence and potentialImpact are separate metrics
6. Unknown entities become `null` / `UNRESOLVED_ENTITIES`

## Adding another provider later

1. Implement `AiProvider`
2. Register in `provider.factory.ts`
3. Keep analyze/assistant business logic unchanged
