# CleoCode

A modern CLI tool built with **Bun** and **OpenTUI** for an elegant terminal experience.

## Prerequisites

- **Bun** v1.0+ — [Install Bun](https://bun.sh)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CleoCode
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

## Development

### Run the CLI in watch mode

```bash
bun run dev:cli
```

This starts the CLI with file watching enabled. Any changes to `packages/cli/src/index.tsx` will automatically restart the development server.

## Project Structure

```
CleoCode/
├── packages/
│   ├── cli/                  # Main CLI application
│   │   └── src/
│   │       └── index.tsx     # Entry point
│   └── ...
├── package.json             # Root workspace configuration
└── README.md               # This file
```

## Tech Stack

- **[Bun](https://bun.sh)** — Fast JavaScript runtime and package manager
- **[OpenTUI](https://github.com/geist-org/opentui)** — Terminal UI component library

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev:cli` | Start CLI in watch mode |

## Tips

- Use `bun add <package>` to install dependencies in specific workspaces
- Run `bun run` to see all available scripts
- Check individual workspace `package.json` files for workspace-specific commands

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
