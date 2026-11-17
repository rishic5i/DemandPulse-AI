---
name: verify-full-demo
description: Verify DemandPulse Run Full Demo still works after a change. Use when finishing a feature, before opening a PR, or when the user asks to smoke-test the demo.
---

# Verify Full Demo

## Goal

Confirm the main judge path still works: **Run Full Demo → Overview → Signal Explorer → Feature Store → Export**.

## Steps

1. Ensure deps: `pnpm install` if needed.
2. Start app: `pnpm dev` (or use deployed URL if user asks).
3. Open home. Click **Run Full Demo**.
4. Wait for pipeline status **Signals + features ready**.
5. Check Overview shows signal counts (not empty).
6. Open Signal Explorer — at least one row has evidence text.
7. Open Feature Store — rows present; Export CSV/JSON available.
8. Optional: Copilot answers only from current run.

## Fail conditions (stop and report)

- AI error with silent/mocked success
- Zero signals when notes were provided
- Feature rows all null when signals exist
- App crash / 500 on `/api/analyze`

## After verify

Remind: never push to `main`; use `feature/...` + PR + green CI.
