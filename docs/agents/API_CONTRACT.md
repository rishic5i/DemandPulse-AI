# API contract (agent summary)

Full examples: [`../API.md`](../API.md)

## Endpoints

### `GET /api/health`

Returns service status + whether Groq is configured. No secrets.

### `POST /api/analyze`

Input: `{ sales[], notes[], demoMode? }`  
Output: `{ requestId, analysis }` with `signals` + `features`.

This is the primary E2E backend path.

### `GET /api/features?runId=&sku=&retailer=&region=`

Best-effort in-memory lookup. Prefer analyze response payload for reliability (serverless).

### `POST /api/assistant`

Input must include current `signals` + `features` context from the client.  
Answers only from provided context.

## Validation

- Request bodies validated with Zod (`src/schemas/signal.ts`)
- Include `requestId` on every response
- Map `AiProviderError` to 429 / 502 / 503 appropriately
