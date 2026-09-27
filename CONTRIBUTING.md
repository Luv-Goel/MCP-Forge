# Contributing to MCP Forge

First off — thank you for taking the time to contribute! 🎉

MCP Forge is an open-source project and we welcome contributions of all kinds: bug reports, feature requests, documentation improvements, and code contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Conventions](#commit-conventions)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this standard. Please report unacceptable behavior to the project maintainer.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/MCP-Forge.git
   cd MCP-Forge
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Luv-Goel/MCP-Forge.git
   ```

---

## Development Setup

### Prerequisites

- Python **3.10+**
- Node.js **20+**
- `pip` and `npm`
- Optional: Docker (for container-based server tests)

### Install dependencies

```bash
# Python toolchain
pip install -r requirements.txt

# Registry API
cd apps/api && npm install && cd ../..

# Web app
cd apps/web && npm install && cd ../..
```

### Run in development mode

```bash
# Terminal 1 — Registry API (port 8080)
cd apps/api && npm run dev

# Terminal 2 — Web UI (port 3000)
cd apps/web && npm run dev
```

Or use the Makefile shortcut:

```bash
make dev
```

---

## How to Contribute

### Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Before filing, please:

- Check existing [open issues](https://github.com/Luv-Goel/MCP-Forge/issues) to avoid duplicates.
- Reproduce the issue on the latest `master` branch.
- Include the MCP Forge version, OS, and Python/Node versions.

### Suggesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) issue template. Describe:

- **The problem** you're trying to solve.
- **Your proposed solution** (or alternative approaches you've considered).
- **Impact** — who benefits and how.

### Submitting Pull Requests

1. **Create a branch** from `master`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make your changes** with focused, atomic commits.
3. **Run the test suite** and ensure it passes:
   ```bash
   make test
   ```
4. **Push** to your fork and open a PR against `master`.
5. Fill in the [Pull Request template](.github/PULL_REQUEST_TEMPLATE.md).
6. Respond to review feedback promptly.

PRs must:
- Pass all CI checks (lint, type-check, tests).
- Include tests for new behaviour.
- Update documentation when relevant.

---

## Coding Standards

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/) style.
- Use type annotations where practical.
- Keep functions focused and well-named.

### TypeScript / JavaScript

- Follow the existing ESLint/Prettier configuration.
- Prefer `const` over `let`; avoid `var`.
- Use explicit types, not `any`.

### General

- No dead code or commented-out blocks.
- Prefer clarity over cleverness.
- Update `CHANGELOG.md` under the `[Unreleased]` section.

---

## Testing

```bash
# Python test suite (pytest)
python -m pytest tests/ -v

# API tests (vitest)
cd apps/api && npx vitest run

# Type checks
make typecheck

# Full suite via Makefile
make test
```

New features **must** include tests. Bug fixes **should** include a regression test.

---

## Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

**Examples:**

```
feat(cli): add mcp-watch command for live manifest polling
fix(scoring): handle missing latency field gracefully
docs(readme): add Docker Compose quickstart section
```

---

Thank you for helping make MCP Forge better! 🚀
