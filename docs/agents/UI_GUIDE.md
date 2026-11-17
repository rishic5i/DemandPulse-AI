# UI guide

## Navigation

1. Ingest
2. Overview
3. Signal Explorer
4. Feature Store
5. AI Copilot

## Critical demo UX

- **Run Full Demo** must load sample CSVs and call `/api/analyze` in one action
- Pipeline status strip must reflect ingest → extract → features → explore
- After success, Overview shows next-step cards into Explorer / Features / Copilot
- Demo mode badge must appear when synthetic data is used
- AI failures must show explicit errors (no silent mock swap)

## Visual direction

- Dark navy enterprise SaaS
- Restrained sky/blue accents
- Clear hierarchy, dense-but-readable tables
- Recharts for category distribution

## State ownership

Client pipeline state lives in `src/hooks/use-analysis.ts` and is persisted to `sessionStorage` for serverless continuity.
