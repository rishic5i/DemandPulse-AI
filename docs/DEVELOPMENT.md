# Development

## Prerequisites

- Node.js 22 (`nvm use` / `.nvmrc`)
- pnpm 10+
- Groq API key from https://console.groq.com/keys

## Setup

```bash
pnpm install
cp .env.example .env.local
# set GROQ_API_KEY in .env.local
pnpm dev
```

Open http://localhost:3000

## Environment variables

```env
AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

## Testing notes

- Unit tests mock/avoid live Groq calls.
- CI does not require `GROQ_API_KEY`.
- Manual AI verification requires a valid key.

## Deployment

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set env vars in the Vercel project.
4. Deploy.
5. Verify `/api/health` and the demo flow.

## Agent workflows

- Cursor and Claude Code both follow `AGENTS.md`.
- Claude Code also reads `CLAUDE.md` (pointer only).
- Use pnpm exclusively.
