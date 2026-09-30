# Contributing to CleoCode

Thanks for your interest in contributing to CleoCode! This guide covers setup, workflow, and standards.

## Code of Conduct

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to kumaramar4880@gmail.com.

## Getting Started

### Prerequisites

- **Bun** v1.0+ — [Install Bun](https://bun.sh)
- **Git**

### Setup

```bash
git clone https://github.com/supercell02/CleoCode
cd CleoCode
bun install
```

### Useful Scripts

| Script | Description |
|--------|-------------|
| `bun run dev:cli` | Start CLI in watch mode (`packages/cli/src/index.tsx`) |
| `bun run dev:server` | Start server with hot reload (`packages/server/src/index.ts`) |
| `bun run build:cli` | Build `@CleoCode/cli` package |
| `bun run link:cli` | Build + `bun link` the CLI globally as `cleocode` |

Project layout:

```
CleoCode/
├── packages/
│   ├── cli/      # Main CLI app (Bun + OpenTUI)
│   ├── server/   # Backend (Hono)
│   ├── shared/   # Shared types/utils (@CleoCode/shared)
│   └── database/ # DB layer
├── docs/
├── package.json  # Bun workspaces: packages/*
└── ...
```

## How to Contribute

1. **Find or file an issue.** Check existing issues first. For bugs include repro steps, expected vs actual behavior, Bun/OS versions, and logs.
2. **Fork and branch.** Fork the repo, then create a focused branch:
   ```bash
   git checkout -b feat/short-description
   # or: fix/..., docs/..., chore/...
   ```
3. **Make changes.** Keep PRs small and scoped to one issue where possible.
4. **Verify.** Run the relevant workspace locally (`dev:cli`, `dev:server`, build) and add/update tests where appropriate.
5. **Open a PR.** Describe what changed and why, link the issue (`Fixes #123`), and include screenshots/logs for CLI UI changes.

## Coding Standards

- **Runtime:** Bun. Prefer `bun` APIs and `bun install` / `bun run` over npm/node equivalents.
- **Language:** TypeScript. Use strict typing, avoid `any` where a precise type is possible.
- **Style:** Follow existing file conventions (formatting, imports, naming). Keep functions small and workspace-aware (don't hardcode paths; respect workspace root/config).
- **Security/privacy:** Credentials and user config stay local. Never log secrets, tokens, or API keys. No telemetry without explicit user action.
- **Commits:** Clear, imperative messages (e.g. `feat(cli): add theme flag`). Reference issues in the body when relevant.

## Tests

- Add or update tests for bug fixes and features where a test harness exists.
- For CLI changes, include manual verification steps in the PR (command run + output).

## Reporting Bugs / Requesting Features

- **Bugs:** Use the issue tracker with repro steps, environment (`bun --version`, OS), and relevant logs.
- **Features:** Describe the use case, proposed API/UX, and alternatives considered. Check `docs/` and `incoming features/` for prior discussion.

## Questions

Open a GitHub issue for questions or suggestions. Maintainers review issues and PRs on a best-effort basis.

## License

Contributions are licensed under the [Apache License 2.0](LICENSE). By submitting a PR, you agree your contribution is governed by those terms.
