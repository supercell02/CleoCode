# Usage

## Starting

```bash
bun run dev:cli
# or, once linked:
cleocode
```

Routes (`packages/cli/src/index.tsx`):
- `/` → `Home`
- `/sessions/new` → `NewSession`
- `/sessions/:id` → `Session`

## Sessions and chat

- CLI sends `POST /chat` with `{ id, messages, mode, model }`.
- `model` must be in `SUPPORTED_CHAT_MODELS` (`packages/shared/src/models.ts`).
- Server validates, merges with stored `session.messages`, streams back via `streamText().toUIMessageStreamResponse()`.
- Finished messages are persisted to `db.session` and billed via Polar (`calculateCreditsForUsage` + `ingestAiUsage`).

## Models dialog

Model list comes from shared `SUPPORTED_CHAT_MODELS` with per-model pricing (`inputUsdPerMillionTokens`, `outputUsdPerMillionTokens`). Default is `gpt-5.4`.

## Auth / billing in CLI

- HTTP client (`packages/cli/src/lib/api-client.ts`) attaches `Bearer <token>` from local auth store, clears on 401.
- OAuth helpers in `packages/cli/src/lib/oauth.ts`, `auth.ts`.
- Upgrade/checkout opens Polar checkout/portal URLs from `POST /billing/checkout`, `POST /billing/portal`.
