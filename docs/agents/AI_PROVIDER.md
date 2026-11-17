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

1. Batch notes to respect free-tier rate limits
2. Retry only retryable failures (e.g. 429) with bounded backoff
3. On failure, surface a clear error — never fabricate signals
4. Confidence and potentialImpact are separate metrics
5. Unknown entities become `null` / `UNRESOLVED_ENTITIES`

## Adding another provider later

1. Implement `AiProvider`
2. Register in `provider.factory.ts`
3. Keep analyze/assistant business logic unchanged
