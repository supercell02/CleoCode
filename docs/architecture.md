# Architecture

```
CleoCode/
├── packages/
│   ├── cli/src/
│   │   ├── index.tsx            # OpenTUI renderer + memory router
│   │   ├── screens/             # home, new-session, session
│   │   ├── components/          # input-bar, header, status-bar, dialogs, command-menu, messages
│   │   ├── providers/           # theme, dialog, toast, keyboard-layer, prompt-config
│   │   ├── hooks/use-chat.tsx
│   │   ├── lib/api-client.ts    # hono/client + Bearer auth
│   │   └── bin/cleocode         # linked binary, dotenv loading, runs dist/index.js
│   ├── server/src/
│   │   ├── index.ts             # Hono app, Sentry, /auth /billing /sessions /chat
│   │   ├── routes/chat.ts       # validate, streamText, persist, Polar ingest
│   │   ├── routes/sessions.ts
│   │   ├── routes/auth.ts
│   │   ├── routes/billing.ts    # checkout + portal + success
│   │   ├── middleware/require-auth.ts
│   │   ├── middleware/require-credits-balance.ts
│   │   ├── lib/models.ts        # resolveChatModel() -> anthropic()/openai()
│   │   ├── lib/credits.ts       # calculateCreditsForUsage()
│   │   ├── lib/polar.ts         # createCheckoutUrl, ingestAiUsage
│   │   └── system-prompt.ts
│   ├── shared/src/
│   │   ├── models.ts            # SUPPORTED_CHAT_MODELS + pricing + DEFAULT_CHAT_MODEL_ID
│   │   ├── schemas.ts
│   │   └── index.ts
│   └── database/src/
│       ├── client.ts
│       └── index.ts             # Prisma Session model with messages JSON
├── docs/
└── README.md
```

## Request flow

1. CLI `use-chat` → `apiClient.chat.$post({ id, messages, mode, model })`
2. `requireAuth` → `requireCreditsBalance` → zod validator
3. `resolveChatModel(model)` picks `anthropic()` or `openai()` + providerOptions
4. `streamText({ model, system: buildSystemPrompt({mode}), messages, tools: getToolContracts(mode) })`
5. Stream response with metadata `{ mode, model, durationMs, usage }`
6. On finish: update `session.messages`, compute credits, `ingestAiUsage()` to Polar

## Model-agnostic layer

- `packages/shared` owns IDs + pricing, no SDK imports.
- `packages/server/src/lib/models.ts` owns SDK resolution. Add a provider by extending `SupportedProvider`, `SUPPORTED_CHAT_MODELS`, and a `resolveXModel()` branch.
