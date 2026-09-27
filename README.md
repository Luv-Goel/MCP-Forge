# MCP Forge

> **The trusted operating layer for MCP servers.**
> *A platform where users can discover MCP servers, inspect capabilities, see trust and security signals, install them locally or remotely, test them in a sandbox, and export ready-to-use configs for Claude, OpenAI-compatible clients, editors, and custom agent runtimes.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?logo=discord&logoColor=white)](https://discord.gg/nousresearch)
[![GitHub Stars](https://img.shields.io/github/stars/Luv-Goel/MCP-Forge?style=social)](https://github.com/Luv-Goel/MCP-Forge/stargazers)

---

## 🚀 Product Shape

### Working Concept

MCP Forge is a **trusted operating layer** for the MCP (Model Context Protocol) ecosystem. Unlike simple awesome lists that are easy to copy, MCP Forge provides:

- **Trust infrastructure** (validation, probing, scoring)
- **Runtime execution** (sandbox testing, local/remote launches)
- **Compatibility tooling** (client-specific config generators)
- **Security hardening** (scope analysis, SSRF detection, least-privilege enforcement)
- **Ecosystem growth** (maintainer incentives, federation, monetization)

### Positioning Sentence

> **The trusted operating layer for MCP servers.**

---

## 📋 Roadmap Status (15 Phases)

| Phase | Title | Status | Key Deliverables |
|-------|-------|--------|------------------|
| **Phase 1** | Foundation | ✅ **COMPLETED** | Manifest spec, validator CLI, registry schema, dual-backend scaffold (Actix/Axum) |
| **Phase 2** | Real Utility | ✅ **COMPLETED** | Runtime probe, install generator, trust scoring, compatibility matrix |
| **Phase 3** | Differentiation | ✅ **COMPLETED** | Sandbox tester, security policy analysis, reproducible release snapshots, maintainer dashboard |
| **Phase 4** | Performance | 🚧 **NEXT** | Benchmarking suite, latency/throughput metrics, optimization guides |
| **Phase 5** | Observability | Pending | Centralized logging, Prometheus/Grafana dashboards, OpenTelemetry tracing |
| **Phase 6** | Enterprise Security | Pending | SAML/OAuth, audit trails, policy packs, least-privilege enforcement |
| **Phase 7** | Ecosystem Growth | Pending | Stars/badges, maintainer bounties, curated collections, "Works with X" badges |
| **Phase 8** | Client Diversity | Pending | Ollama, LM Studio, LocalAI, and custom client config generators |
| **Phase 9** | Advanced MCP Features | Pending | Roots/sampling support in sandbox, structured output validation, progress/cancellation |
| **Phase 10** | Offline Mode | Pending | Air-gapped registry mirroring, offline validation, local-first mode |
| **Phase 11** | Automation | Pending | GitHub/GitLab CI/CD integration, automatic manifest validation, PR checks |
| **Phase 12** | Documentation | Pending | Interactive tutorials, API docs (Swagger/OpenAPI), video guides, CLI man pages |
| **Phase 13** | Monetization | Pending | Private registries, priority support, premium features (e.g., "Verified Publisher" badge) |
| **Phase 14** | Federation | Pending | Mirror registries, team namespaces, upstream sync, private enterprise registries |
| **Phase 15** | AI-Powered Curation | Pending | AI-driven package recommendations, auto-generated docs, smart search |

---

## 🗺️ Phase 4: Performance

### Goals

- Benchmark MCP servers for latency, throughput, and resource usage.
- Provide optimization guides for high-throughput deployments.
- Integrate performance metrics into the trust score.

### Deliverables

| Component | Description |
|-----------|-------------|
| `mcp-benchmark` CLI | Run standardized benchmarks (e.g., 1K requests, 1MB payloads) and generate reports. |
| Performance Dashboard | Visualize latency/throughput metrics in the maintainer dashboard. |
| Optimization Guides | Documentation for tuning MCP servers (e.g., async I/O, connection pooling). |
| Trust Score Integration | Adjust trust score based on performance metrics (e.g., sub-100ms latency bonus). |

### Architecture

```
MCP-Forge/
├── packages/
│   ├── benchmark/       # Benchmarking suite (Python/Go)
│   │   ├── scenarios/   # Standardized test scenarios
│   │   └── reporter.py  # Generate HTML/PDF reports
│   └── scoring/         # Trust score integration
└── apps/web/            # Performance dashboard UI
```

---

## 🗺️ Phase 5: Observability

### Goals

- Centralize logs, metrics, and traces for deployed MCP servers.
- Provide dashboards for monitoring health, performance, and security.

### Deliverables

| Component | Description |
|-----------|-------------|
| OpenTelemetry Integration | Instrument MCP servers for distributed tracing. |
| Prometheus/Grafana Dashboards | Pre-built dashboards for latency, error rates, and resource usage. |
| Centralized Logging | Aggregate logs from multiple MCP servers into a single view. |
| Alerting | Notify maintainers of anomalies (e.g., high latency, failed probes). |

### Architecture

```
MCP-Forge/
├── packages/
│   └── observability/   # OpenTelemetry SDK, Prometheus exporters
└── apps/
    └── web/               # Grafana dashboard templates
```

---

## 🗺️ Phase 6: Enterprise Security

### Goals

- Support enterprise authentication (SAML/OAuth).
- Enforce least-privilege policies and audit trails.

### Deliverables

| Component | Description |
|-----------|-------------|
| SAML/OAuth Integration | Support enterprise identity providers (Okta, Azure AD). |
| Audit Trails | Log all registry actions (publish, install, verify) for compliance. |
| Policy Packs | Pre-built security policies (e.g., "No network egress", "Read-only filesystem"). |
| Least-Privilege Enforcement | Block manifests with excessive scopes (e.g., `*` in filesystem paths). |

### Architecture

```
MCP-Forge/
├── packages/
│   └── security/        # SAML/OAuth adapters, policy engine
└── apps/
    └── api/               # Audit trail API
```

---

## 🗺️ Phase 7: Ecosystem Growth

### Goals

- Incentivize maintainers to publish high-quality MCP servers.
- Curate collections and highlight popular packages.

### Deliverables

| Component | Description |
|-----------|-------------|
| Stars/Badges | Let users star packages; display badges (e.g., "Top 10%", "Verified"). |
| Maintainer Bounties | Reward maintainers for high trust scores, installs, or documentation. |
| Curated Collections | Group packages by domain (e.g., "Web Search", "Filesystem Tools"). |
| "Works with X" Badges | Show compatibility with clients (e.g., "Works with Ollama", "Works with LM Studio"). |

### Architecture

```
MCP-Forge/
├── packages/
│   └── ecosystem/       # Bounty system, collection manager
└── apps/
    └── web/               # Stars/badges UI, curated collections page
```

---

## 🗺️ Phase 8: Client Diversity

### Goals

- Support non-OpenAI clients (Ollama, LM Studio, LocalAI).
- Expand the compatibility matrix and install generator.

### Deliverables

| Component | Description |
|-----------|-------------|
| Ollama Config Generator | Generate `Modelfile` and `config.json` for Ollama. |
| LM Studio Config Generator | Generate `config.yaml` for LM Studio. |
| LocalAI Config Generator | Generate `config.yaml` for LocalAI. |
| Compatibility Matrix Updates | Add rows for Ollama, LM Studio, LocalAI. |

### Architecture

```
MCP-Forge/
└── packages/
    └── client-templates/  # New config generators
```

---

## 🗺️ Phase 9: Advanced MCP Features

### Goals

- Support advanced MCP features (roots, sampling, structured outputs) in the sandbox.
- Validate structured outputs and progress/cancellation.

### Deliverables

| Component | Description |
|-----------|-------------|
| Roots Support | Allow sandboxed access to specific filesystem roots. |
| Sampling Support | Test sampling endpoints in the sandbox. |
| Structured Output Validation | Validate JSON Schema compliance for tool outputs. |
| Progress/Cancellation | Support progress updates and request cancellation in the sandbox. |

### Architecture

```
MCP-Forge/
├── packages/
│   └── runtime/         # Roots/sampling support in probe.py
└── apps/
    └── web/               # Sandbox UI updates for advanced features
```

---

## 🗺️ Phase 10: Offline Mode

### Goals

- Support air-gapped environments and offline validation.
- Enable local-first registry mirroring.

### Deliverables

| Component | Description |
|-----------|-------------|
| Air-Gapped Registry Mirroring | Sync registry data to a local database for offline use. |
| Offline Validation | Validate manifests without network access. |
| Local-First Mode | Run MCP Forge entirely locally (no cloud dependencies). |

### Architecture

```
MCP-Forge/
├── cli/
│   └── mcp-mirror       # Registry mirroring CLI
└── packages/
    └── offline/          # Offline validation logic
```

---

## 🗺️ Phase 11: Automation

### Goals

- Integrate MCP Forge into CI/CD pipelines.
- Automate manifest validation and trust scoring.

### Deliverables

| Component | Description |
|-----------|-------------|
| GitHub/GitLab CI/CD Integration | Validate manifests on PRs; block merges for critical issues. |
| Automatic Manifest Validation | Run `mcp-validate` on every push to `main`. |
| PR Checks | Comment on PRs with trust score and security findings. |

### Architecture

```
MCP-Forge/
├── .github/
│   └── workflows/       # GitHub Actions workflows
└── packages/
    └── ci/               # CI/CD integration logic
```

---

## 🗺️ Phase 12: Documentation

### Goals

- Provide interactive tutorials, API docs, and video guides.
- Improve CLI man pages and help text.

### Deliverables

| Component | Description |
|-----------|-------------|
| Interactive Tutorials | Step-by-step guides for publishing, installing, and testing MCP servers. |
| API Docs (Swagger/OpenAPI) | Auto-generated API documentation for the registry. |
| Video Guides | YouTube/TikTok-style tutorials for key workflows. |
| CLI Man Pages | Comprehensive man pages for `mcp-validate`, `mcp-probe`, etc. |

### Architecture

```
MCP-Forge/
├── docs/                 # Interactive tutorials, API docs
└── packages/
    └── docs/             # Video scripts, CLI man pages
```

---

## 🗺️ Phase 13: Monetization

### Goals

- Offer premium features for enterprise users.
- Sustain development with a sustainable business model.

### Deliverables

| Component | Description |
|-----------|-------------|
| Private Registries | Host private MCP registries for enterprise customers. |
| Priority Support | Offer SLAs and dedicated support for premium users. |
| Premium Features | "Verified Publisher" badge, advanced analytics, custom domains. |

### Architecture

```
MCP-Forge/
├── apps/
│   └── enterprise/     # Private registry backend
└── packages/
    └── monetization/     # Billing, support ticketing
```

---

## 🗺️ Phase 14: Federation

### Goals

- Support mirror registries and team namespaces.
- Enable private enterprise registries.

### Deliverables

| Component | Description |
|-----------|-------------|
| Mirror Registries | Sync registry data across multiple instances. |
| Team Namespaces | Support `@team/package` naming for organizations. |
| Upstream Sync | Sync public registry data to private mirrors. |
| Private Enterprise Registries | Host private registries for enterprise customers. |

### Architecture

```
MCP-Forge/
├── apps/
│   └── federation/     # Federation backend
└── packages/
    └── sync/            # Upstream sync logic
```

---

## 🗺️ Phase 15: AI-Powered Curation

### Goals

- Use AI to recommend packages, auto-generate docs, and improve search.

### Deliverables

| Component | Description |
|-----------|-------------|
| AI-Driven Package Recommendations | Recommend packages based on user behavior and domain. |
| Auto-Generated Docs | Generate API docs, examples, and tutorials from manifests. |
| Smart Search | Improve search relevance with NLP and embeddings. |

### Architecture

```
MCP-Forge/
├── packages/
│   └── ai/             # AI models for recommendations/docs/search
└── apps/
    └── web/             # Smart search UI, auto-generated docs
```

---

## ✨ Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Registry** | ✅ Phase 1 | Searchable catalog with metadata, tags, health status |
| **Verification** | ✅ Phase 2 | Automated checks for manifest validity, protocol support, smoke tests |
| **Trust Signals** | ✅ Phase 2 | Verified publisher badge, signed release info, trust score, security warnings |
| **Local Runtime** | ✅ Phase 2 | Lightweight runner for stdio/Docker/remote servers |
| **Install Generator** | ✅ Phase 2 | One-click export for Claude, OpenAI, VS Code, Docker Compose |
| **Sandbox Tester** | ✅ Phase 3 | Safe test UI with bounded permissions and visible logs |
| **Security Layer** | ✅ Phase 3 | Scope inspection, least-privilege warnings, network policy hints |
| **Compatibility Matrix** | ✅ Phase 2 | Shows client transport/primitive/auth support |
| **Versioned Manifests** | ✅ Phase 3 | Reproducible package metadata for each release (snapshots) |
| **Publisher Tooling** | ✅ Phase 2 | `mcp-validate`, `mcp-probe`, `mcp-score`, `mcp-snapshot` CLI tools |
| **Performance Benchmarking** | 🚧 Phase 4 | Latency/throughput metrics, optimization guides |
| **Observability** | Phase 5 | Centralized logging, Prometheus/Grafana dashboards, OpenTelemetry tracing |
| **Enterprise Security** | Phase 6 | SAML/OAuth, audit trails, policy packs, least-privilege enforcement |
| **Ecosystem Growth** | Phase 7 | Stars/badges, maintainer bounties, curated collections |
| **Client Diversity** | Phase 8 | Ollama, LM Studio, LocalAI config generators |
| **Advanced MCP Features** | Phase 9 | Roots/sampling support, structured output validation, progress/cancellation |
| **Offline Mode** | Phase 10 | Air-gapped registry mirroring, offline validation |
| **Automation** | Phase 11 | GitHub/GitLab CI/CD integration, automatic manifest validation |
| **Documentation** | Phase 12 | Interactive tutorials, API docs, video guides, CLI man pages |
| **Monetization** | Phase 13 | Private registries, priority support, premium features |
| **Federation** | Phase 14 | Mirror registries, team namespaces, upstream sync |
| **AI-Powered Curation** | Phase 15 | AI-driven recommendations, auto-generated docs, smart search |

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- Rust 1.70+
- Docker (optional, for containerized MCP servers)

### Installation

```bash
# Clone the repository
git clone https://github.com/Luv-Goel/MCP-Forge.git
cd MCP-Forge

# Install dependencies
npm install

# Build the CLI tools
cd cli && pip install -e .

# Start the registry API
cd ../apps/api && npm run dev

# Start the web UI
cd ../web && npm run dev
```

### Quick Start

```bash
# Validate a manifest
mcp-validate mcp.package.json

# Probe a local MCP server
mcp-probe mcp.package.json

# Generate an install config
mcp-generate mcp.package.json --client claude-desktop
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- **Publish MCP Servers**: Add your MCP server to the registry.
- **Improve Documentation**: Write tutorials, fix typos, or add examples.
- **Build Tools**: Create new CLI tools or integrations.
- **Report Bugs**: Open issues for bugs or feature requests.
- **Review PRs**: Help review and test pull requests.

---

## 📜 License

MIT © [Luv Goel](https://github.com/Luv-Goel)
