# API

All JSON responses include `requestId`.

## GET `/api/health`

Returns service and AI configuration status (no secrets).

```json
{
  "requestId": "req_...",
  "status": "ok",
  "ai": {
    "provider": "groq",
    "model": "openai/gpt-oss-20b",
    "configured": true
  },
  "storage": {
    "mode": "stateless"
  }
}
```

## POST `/api/analyze`

Request:

```json
{
  "sales": [
    {
      "date": "2026-01-01",
      "sku": "SKU001",
      "product_name": "Premium Shampoo",
      "retailer": "Retailer A",
      "region": "North",
      "units_sold": 120,
      "revenue": 2400
    }
  ],
  "notes": [
    {
      "id": "note_1",
      "date": "2026-01-05",
      "retailer": "Retailer A",
      "region": "North",
      "note": "A competitor launched a 20% discount on premium shampoo."
    }
  ],
  "demoMode": true
}
```

Success: `{ requestId, analysis }` where `analysis` includes `signals` and `features`.

Failure examples:

- `400 VALIDATION_ERROR`
- `429 RATE_LIMITED`
- `503 MISSING_API_KEY`
- `502 PROVIDER_ERROR` / `INVALID_RESPONSE`

## GET `/api/features`

Query params: `runId` (required), optional `sku`, `retailer`, `region`.

Best-effort only. Prefer the features array from `/api/analyze` for reliability.

## POST `/api/assistant`

Request:

```json
{
  "question": "Which retailers have supply risk?",
  "signals": [],
  "features": [],
  "demoMode": true
}
```

`signals` and `features` must be provided by the client from the current analysis.
