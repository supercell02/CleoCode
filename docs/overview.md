# CleoCode: A Model-Agnostic, Terminal-Based Coding Agent

CleoCode is a terminal-based coding agent. It runs in your terminal, understands your workspace, and can use multiple LLM providers / models behind a single interface.

Built with **Bun**, **OpenTUI + React**, **Hono**, and **AI SDK**.

## Key properties

- **Model-agnostic**: supported models are defined in one place (`packages/shared/src/models.ts`). Current IDs:
  - `claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-6` (anthropic)
  - `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano` (openai)
  - Default: `gpt-5.4`
- **Terminal-native**: CLI renderer via `@opentui/core` (`packages/cli/src/index.tsx`), memory router with `/`, `/sessions/new`, `/sessions/:id`.
- **Client / server split**: CLI talks to Hono server over HTTP (`API_URL`, default `http://localhost:3000`).
- **Auth + billing enforced server-side**: Clerk auth (`require-auth`), Polar credits (`require-credits-balance`, `ingestAiUsage`).

See `setup.md`, `usage.md`, `architecture.md`, `configuration.md`.
