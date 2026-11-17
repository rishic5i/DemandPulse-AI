# UI guide

## Navigation

1. Home
2. Ingest
3. Overview
4. Signal Explorer
5. Feature Store
6. AI Copilot

## Critical demo UX

- Home page explains product value with a primary **Run Full Demo** CTA
- **Run Full Demo** must load sample CSVs and call `/api/analyze` in one action
- Pipeline status strip must reflect ingest → extract → features → explore
- After success, Overview shows next-step cards into Explorer / Features / Copilot
- Overview includes multi-chart analysis (mix, region, confidence/impact, radar, SKU net demand, sales trend)
- Copilot answers must render Markdown (tables/lists), not raw markup
- Demo mode badge must appear when synthetic data is used
- AI failures must show explicit errors (no silent mock swap)

## Visual direction

- Light enterprise SaaS (cool gray/blue wash, white cards)
- Cyan/teal accents; Outfit + Source Sans 3 typography
- Clear hierarchy, dense-but-readable tables
- Recharts for multi-view analysis

## State ownership

Client pipeline state lives in `src/hooks/use-analysis.ts` and is persisted to `sessionStorage` for serverless continuity.
