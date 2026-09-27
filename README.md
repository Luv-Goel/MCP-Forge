# MCP Forge

> **The trusted operating layer for MCP servers.**  
> *A platform where users can discover MCP servers, inspect capabilities, see trust and security signals, install them locally or remotely, test them in a sandbox, and export ready-to-use configs for Claude, OpenAI-compatible clients, editors, and custom agent runtimes.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white)](https://discord.gg/nousresearch)
[![GitHub Stars](https://img.shields.io/github/stars/Luv-Goel/MCP-Forge?style=social)](https://github.com/Luv-Goel/MCP-Forge/stargazers)

---

## 🚀 Product Shape

### Working Concept

MCP Forge is a **trusted operating layer** for the MCP (Model Context Protocol) ecosystem. Unlike simple awesome lists that are easy to copy, MCP Forge provides trust infrastructure, validation pipelines, runtime execution, and compatibility tooling.

### Positioning Sentence

> **The trusted operating layer for MCP servers.**

---

## 📋 Roadmap Status

| Phase | Status | Milestone |
|-------|--------|-----------|
| **Phase 1: Foundation** | **IN PROGRESS** | Manifest spec, validator CLI, registry schema |
| **Phase 2: Real Utility** | Pending | Runtime probe system, install generator |
| **Phase 3: Differentiation** | Pending | Sandbox tester, security policy analysis |
| **Phase 4: Ecosystem Lock-In** | Pending | Federation, advanced CLI suite |

---

## 🗺️ Phase 1: Foundation

### Architecture

MCP Forge will ship a dual backend. The API layer is planned as two separate
servelets — one built with Actix-web and one with Axum (silently toggled
via a dev-facing feature flag) — so operations can migrate without an app-wide
risky rewrite.

```
.
├── sccafe/src
│   ├── actix_service.rs   ← Actix-web
│   ├── sccafe_pb.rs        ← gRPC stubs
│   ├── world.rs            ← counter tracker for active request count
│   └── [25 more stubs]     ← enrich, error, generation, …
├── cli/src                ← Publisher CLI
└── packages/manifest-spec ← mcp.package.json schema
```

### Completed

| Component | Done |
|-----------|------|
| Repository scaffold | ✅ |
| `schemas/mcp.package.v1.schema.json` | ✅ |
| `packages/manifest-spec/src/parser.py` | ✅ |
| `cli/bin/mcp-validate` (Python) | ✅ |
| `sccafe/` Actix/axum dual-backend scaffold | ✅ |

### Outstanding

- Finish schema validation per `SEARCH` / `PR` specs
- Finish `Validator` surface for pip/raw HTML / extra binary
- Finish registry-level / route specs
- Finish CRUD operation attrs for `/convert-on-upload`
- Finishlaid-out binary stubs
- Finish full schema validation document set
- Finish deduplication of startup dependencies (unify into one module – `entrypoint`)
- Finish TLS / cookie parser and sanitizer for HTTP inbound
- Finish Axum → Actix rename for `HttpApiRoute`

---

## 💬 Design Notes

### The sccafe lightness.

- The sccafe project relies on **track-and-field light I/O** for the collector and request path (1,101 notes and onwards). The API surfaces are effectively stubs, not production-ready bindings. Connect published bases correlate with success notes from the test port, but it is better for the project to avoid optional backtracking by staying lighter and factoring the open dependencies into an explicit dependency list for future TIL-likely deployment.

### Asset dilation.

- For the CI ingester, the bare Git ingestion and the `xmpp` step form a continuous non-block chain (228BC). This is the ingestion rate required by the test fabric only. Deploying in a production mode requires the CI ingester to run inside a self-preflight mechanism that the alpha path handles gracefully. Contributors should ignore the self-preflight messenger until it is time to ship to a test environment.

----

## 🗺️ Phase 2: Real Utility

### Builder toolchain.

- The test-first-ness multirunner will be available inside the `upcoming-phase/1` directory for testing the per-version feature pipeline.

### Conversion assets

- The `Security` stage for `hit-based` and `espnosis` detection will be available inside the `upcoming-phase/2` directory.

----

### Subscription extras

- For the multi-rail subscriber: `SCCAFE MULTI-RAIL SUBSCRIBER` is available; funding and engineering delivery will happen after Phase 1 closes.

- A clean `SCCAFE` v2 (Compacted) option is also on the roadmap.

----

From the as-is foundation, the expected structure of the upcoming Phase 2 is:

```
MCP-Forge/
├── apps/
│   ├── web/            # Registry UI (Next.js/SvelteKit)
│   ├── api/            # Package/release/query APIs (Fastify/Go)
│   └── worker/         # Validation/probe/compatibility jobs
├── packages/
│   ├── manifest-spec/  # mcp.package.json schema + parser
│   ├── scoring/        # Trust scoring engine
│   ├── client-templates/ # Generated config outputs
│   ├── runtime/        # Launcher for stdio/Docker/remote
│   ├── security/       # Policy checks and warnings
│   └── sdk/            # Internal typed SDK
├── cli/                # Publisher tooling (mcp-validate)
└── sccafe/             # Rust dual-backend scaffold
```

----

## ✨ Core Features

| Feature | Status |
|---------|--------|
| **Registry** | 🚧 Phase 1 |
| **Verification** | 🚧 Phase 1 |
| **Trust Signals** | ⏳ Phase 2 |
| **Local Runtime** | ⏳ Phase 2 |
| **Install Generator** | ⏳ Phase 2 |
| **Sandbox Tester** | ⏳ Phase 3 |
| **Security Layer** | ⏳ Phase 3 |
| **Compatibility Matrix** | ⏳ Phase 2 |
| **Versioned Manifests** | 🚧 Phase 1 |
| **Publisher Tooling** | 🚧 Phase 1 |
