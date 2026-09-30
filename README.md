# CleoCode

CleoCode is a modern, extensible CLI tool built with **Bun** and **OpenTUI** for elegant, interactive, and scriptable terminal workflows.

## Vision

Empowering developers and teams with:
- Modern terminal user interfaces
- Fast, scriptable interaction with core development workflows
- Secure and extensible architecture

---

## Feature Highlights

- **Elegant CLI powered by Bun & OpenTUI**  
  Enjoy fast and interactive terminal experiences.
- **Workspace-aware commands**  
  Operations run with awareness of your workspace structure and configuration.
- **Easy project bootstrap and dependency management**  
  Streamlined Bun-powered setup for fast workspace onboarding.

---

## Prerequisites

- **Bun** v1.0+ — [Install Bun](https://bun.sh)

---

## Project Setup

1. **Clone the repository**
    ```bash
    git clone <repository-url>
    cd CleoCode
    ```

2. **Install dependencies**
    ```bash
    bun install
    ```

---

## Usage & Development

### Run the CLI in watch mode

```bash
bun run dev:cli
```

The CLI auto-restarts on file changes to speed up local development.

### Link CLI globally

To use the `cleocode` command anywhere on your system:

```bash
bun run link:cli
```

After linking, you can run:

```bash
cleocode
```

from any terminal.

### Project Structure

```
CleoCode/
├── packages/
│   ├── cli/                  # Main CLI application
│   │   └── src/
│   │       └── index.tsx     # Entry point
│   └── ...
├── package.json             # Root workspace configuration
├── README.md                # This file
└── ...
```

### Available Scripts

| Script                | Description                        |
|-----------------------|------------------------------------|
| `bun run dev:cli`     | Start CLI in watch mode            |
| `bun run link:cli`    | Link CLI globally as `cleocode`    |
| ...                   | ... (see package.json for more)    |

---

## Security & Privacy

- User credentials and config are only stored locally and never shared without explicit user action.

---

## Contribution Guide

We welcome issues and pull requests! To contribute:
1. Fork and clone this repository.
2. Create a new feature or bugfix branch.
3. Make your changes following the project's folder structure and style.
4. Write/update descriptive tests where appropriate.
5. Open a PR – describe your changes clearly.

For questions or suggestions, please open an issue.

---

## Community & Support

- Issues & feature requests: [GitHub Issues](<repository-url>/issues)
- Discussions: Coming soon!
- Contact maintainer: [your-email@domain.com] (update as needed)

---

## Coming Soon

- Multi-model LLM integration with flexible authentication
- Real-time token usage and cost estimation features
- Bring Your Own Key (BYOK) provider support

For details and early plans, see docs or open an issue.

---

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE).

---

## Roadmap / Changelog

- Future updates and release notes will appear here!
