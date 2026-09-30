# Configuration

Env is loaded from repo-root `.env`, overridden by `$CLEOCODE_ORIGINAL_CWD/.env` (see `packages/cli/bin/cleocode`).

Copy from `.env.example`:

| Var | Used for |
|---|---|
| `API_URL` | CLI → server base URL, default `http://localhost:3000` |
| `DATABASE_URL` | Prisma / database client |
| `ANTHROP_API_KEY` | Anthropic models via `@ai-sdk/anthropic` |
| `OPENAI_API_KEY` | OpenAI models via `@ai-sdk/openai` |
| `CLERK_FRONTEND_API`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_OAUTH_CLIENT_ID`, `CLERK_OAUTH_CLIENT_SECRET` | Clerk auth, server `require-auth` + CLI OAuth |
| `JWT_SECRET` | Token verification, default `jwt-secret` in example — change it |
| `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_SERVER`, `POLAR_CREDITS_METER_ID` | Billing, checkout/portal, `ingestAiUsage` credit metering |

Server also uses Sentry DSN hardcoded in `packages/server/src/index.ts` — move to env before open-sourcing if you want to avoid leaking it.
