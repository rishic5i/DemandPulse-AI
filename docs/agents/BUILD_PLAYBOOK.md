# Build playbook

Ordered process for any non-trivial change.

## Steps

1. **Orient**
   - Read `AGENTS.md`
   - Open `docs/agents/FILE_MAP.md`
   - Run `git status` and inspect related files before editing

2. **Specify the change**
   - Name the user-visible outcome
   - Identify modules touched (ingestion / intelligence / features / API / UI)

3. **Preserve invariants**
   - LLM = semantics only
   - TypeScript = numerical features
   - No silent AI mocks
   - No invented entities

4. **Implement the smallest path**
   - Prefer extending existing modules
   - Keep business logic out of React components
   - Keep prompts in `src/modules/intelligence/prompts.ts`

5. **Validate**
   - Add/adjust Vitest coverage for pure logic
   - Run:
     ```bash
     pnpm check
     ```

6. **Manual E2E smoke**
   - `pnpm dev`
   - Click **Run Full Demo**
   - Confirm Overview → Signal Explorer → Feature Store → Export

7. **Ship through PR**
   - Follow [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md)
   - Push feature branch, open PR, wait for Quality + Security checks
   - Merge only when green — never push straight to `main`

8. **Document**
   - Update the matching file under `docs/` or `docs/agents/` when behavior changes
   - Keep `AGENTS.md` as the index; put detail in referenced docs

## Completion criterion

Change is done only when local `pnpm check` passes, PR CI (Quality + Security) is green, the demo path still works, and docs/agent pointers still describe real behavior.
