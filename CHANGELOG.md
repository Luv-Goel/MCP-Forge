# Changelog

All notable changes to **MCP Forge** are documented here.

This project adheres to [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### Added
- (nothing yet)

---

## [1.1.0] — 2026-09-27

### Added
- **`mcp-watch` CLI** — live manifest polling with real-time score/validation updates.
- **Plugin hooks API** — register custom validators and scorers via `--plugin` flag.
- **Webhook notifications** — POST registry events (publish, update, delete) to a configurable URL.
- **`GET /v1/packages/:slug/diff`** — diff two release versions side-by-side.
- **Dark mode** — web UI respects `prefers-color-scheme`.
- GitHub Actions workflow for automated release notes generation.

### Changed
- Sandbox rate limit raised from 10 to 20 req/min with per-IP accounting.
- Trust score now factors in release cadence and version age.
- `mcp-generate` now outputs a `docker-compose.yml` snippet for HTTP servers.

### Fixed
- `mcp-snapshot` failed silently when the output directory didn't exist.
- Registry stats endpoint returned stale counts after package deletion.
- Trust scoring `latency` field was nullable but not handled gracefully.

---

## [1.0.0] — 2026-08-04

### Added
- **Registry API** (`apps/api`) — full CRUD, releases, search, stats, health endpoints with Fastify.
- **Web UI** (`apps/web`) — Next.js 14 app with package browser, sandbox tester, dashboard, and docs.
- **CLI toolchain** — `mcp-validate`, `mcp-probe`, `mcp-score`, `mcp-snapshot`, `mcp-benchmark`, `mcp-generate`, `mcp-compat`, `mcp-security`.
- **Trust scoring engine** (`packages/scoring`) — weighted, explainable grades with letter grade output.
- **Sandbox runner** (`packages/runtime/sandbox.py`) — subprocess isolation, per-request lifetime.
- **Egress hook** (`packages/runtime/channel_egress_hook.py`) — allowlist/denylist with JSONL audit log.
- **Security analyzer** (`packages/security`) — scope analysis, SSRF detection, Docker hygiene checks.
- **Benchmark runner** (`packages/benchmark`) — latency p50/p95/p99, throughput, error rate against live servers.
- **Client templates** (`packages/client-templates`) — install config generators for Claude Desktop, OpenAI, VS Code, Docker Compose.
- **JSON Schema** (`schemas/mcp.package.v1.schema.json`) — canonical manifest spec with runtime/scopes/transports/primitives.
- **pytest suite** — 46 Python tests + 26 API vitest tests.
- **Docker Compose** setup for local orchestration.
- **Makefile** with `dev`, `test`, `typecheck`, `analyze`, `web-build` targets.

---

## [0.3.0] — 2026-05-17

### Added
- Phase 3: sandbox tester backend, security analysis, release snapshot CLI, egress hook, maintainer dashboard.

---

## [0.2.0] — 2026-05-17

### Added
- Phase 2: runtime probe, installer generation, trust scoring, compatibility matrix.

---

## [0.1.0] — 2026-05-17

### Added
- Phase 1 foundation: manifest schema, JSON Schema validator, CLI scaffold.

---

[Unreleased]: https://github.com/Luv-Goel/MCP-Forge/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Luv-Goel/MCP-Forge/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Luv-Goel/MCP-Forge/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/Luv-Goel/MCP-Forge/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Luv-Goel/MCP-Forge/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Luv-Goel/MCP-Forge/releases/tag/v0.1.0
