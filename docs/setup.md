# Setup

## Prerequisites

- **Bun** v1.0+ — https://bun.sh
- A running server + database (see `configuration.md` for env).

## 1. Clone + install

```bash
git clone <repository-url>
cd CleoCode
bun install
```

## 2. Configure env

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required groups (see `configuration.md`):
- `API_URL`, `DATABASE_URL`
- `ANTHROP_API_KEY`, `OPENAI_API_KEY`
- Clerk: `CLERK_*`, `JWT_SECRET`
- Polar: `POLAR_*`

The `cleocode` binary loads `.env` from repo root, then overrides with `.env` in `CLEOCODE_ORIGINAL_CWD` (`packages/cli/bin/cleocode`).

## 3. Run

CLI in watch mode:

```bash
bun run dev:cli
```

Server with hot reload:

```bash
bun run dev:server
```

Server listens on port `3000` (`packages/server/src/index.ts`).

## 4. Link `cleocode` globally

Builds CLI to `packages/cli/dist` then `bun link`:

```bash
bun run link:cli
```

Then from any terminal:

```bash
cleocode
```

Unlink with `bun unlink` if needed.

## Scripts reference

From root `package.json`:
- `bun run dev:cli` — `bun run --watch packages/cli/src/index.tsx`
- `bun run dev:server` — `bun run --hot packages/server/src/index.ts`
- `bun run build:cli` — `bun run --filter @CleoCode/cli build`
- `bun run link:cli` — build + `bun link` in `packages/cli`
