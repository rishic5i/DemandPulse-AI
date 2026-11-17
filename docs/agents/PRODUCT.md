# Product reference

## Name

**DemandPulse AI** — Turn hidden business signals into intelligent demand features.

## Problem

Consumer-goods demand is shaped by promotions, competitor moves, preferences, events, and supply disruptions that live in unstructured notes. Classic forecasting systems cannot consume that text directly.

## Solution

1. Ingest sales CSV + business notes (CSV or paste)
2. Extract structured demand/supply signals with Groq
3. Validate entities against the sales catalog (no guessing)
4. Generate deterministic numerical features in TypeScript
5. Explore evidence, export CSV/JSON, serve REST features

## Judge demo path (< 3 minutes)

1. Open app
2. Click **Run Full Demo**
3. Wait for live Groq extraction
4. Overview metrics + charts
5. Signal Explorer → click a signal → show evidence
6. Feature Store → export CSV/JSON → API preview
7. Optional: AI Copilot question

## Explicit non-goals (MVP)

- No Docker / K8s / Redis / vector DB
- No Python / FastAPI / Streamlit backend
- No durable server DB (stateless / client-held analysis)
- No fabricated forecast uplift claims
