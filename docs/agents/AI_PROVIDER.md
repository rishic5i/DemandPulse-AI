# AI provider guide

## Current decision

Primary (fast Full Demo): **Groq** `openai/gpt-oss-20b`

Optional failover: **OpenRouter** `openrouter/free` when Groq is rate-limited

- Groq: official `groq-sdk` + strict JSON Schema
- OpenRouter: OpenAI-compatible `fetch` (free models only: `openrouter/free` / `*:free`)
- Always re-validate with Zod (`extractedSignalsResponseSchema`)
- Demo CSVs are compact (~10 notes) so free-tier TPM stays comfortable

Research source of truth: [`../TECHNICAL_RESEARCH.md`](../TECHNICAL_RESEARCH.md)

## Env vars

```env
AI_PROVIDER=groq
AI_FAILOVER=true
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
```

## Implementation map

- Interface: `src/providers/ai/ai-provider.interface.ts`
- OpenRouter: `src/providers/ai/openrouter.provider.ts`
- Groq: `src/providers/ai/groq.provider.ts`
- Factory: `src/providers/ai/provider.factory.ts`
- Prompts: `src/modules/intelligence/prompts.ts`
- Normalize: `src/modules/intelligence/normalize.ts`

## Behavior rules

1. Groq batches notes (default 5) with concurrency 2 — sized for the compact demo
2. OpenRouter free path prefers `json_object` + Zod; retries non-JSON/timeout briefly
3. `AI_FAILOVER=true` wraps Groq→OpenRouter (or reverse if `AI_PROVIDER=openrouter`)
4. On failure, surface a clear error — never fabricate signals
5. Confidence and potentialImpact are separate metrics
6. Unknown entities become `null` / `UNRESOLVED_ENTITIES`

## Adding another provider later

1. Implement `AiProvider`
2. Register in `provider.factory.ts`
3. Keep analyze/assistant business logic unchanged
