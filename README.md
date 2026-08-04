# MCP Forge

> **The trusted operating layer for MCP servers.**
> Discover, validate, score, benchmark, sandbox-test, and install MCP servers with confidence.

MCP Forge is a platform and toolchain for the **Model Context Protocol** ecosystem. It turns the wild world of MCP servers into a verified, scored, and easily installable registry:

- **Trust infrastructure** — real manifest validation against the official schema, runtime probing, explainable trust scoring, and security analysis.
- **Runtime tooling** — benchmark latency/throughput against live servers, sandbox-test JSON-RPC calls, and enforce layer-7 egress allowlists.
- **Compatibility** — generate ready-to-use install configs for Claude Desktop, OpenAI-compatible clients, VS Code, and Docker Compose.
- **Registry API + Web UI** — a durable JSON-backed registry with search, filters, pagination, release management, and a package browser.

---

## Architecture

```
MCP-Forge/
├── apps/
│   ├── api/                 # Fastify registry API (search, CRUD, releases, health)
│   └── web/                 # Next.js web app (packages, docs, dashboard, sandbox)
│       └── app/api/agent/sandbox/   # HTTP sandbox route -> python sandbox runner
├── packages/
│   ├── manifest-spec/       # Manifest loader + JSON Schema validation
│   ├── runtime/             # probe.py, sandbox.py, channel_egress_hook.py
│   ├── scoring/             # Explainable trust score engine
│   ├── security/            # Scope analysis, SSRF detection
│   ├── client-templates/    # Install config generators + compatibility matrix
│   └── benchmark/           # Real stdio/HTTP benchmarking runner
├── cli/bin/                 # mcp-validate, mcp-probe, mcp-score, mcp-snapshot,
│                            # mcp-benchmark, mcp-generate, mcp-compat, mcp-security
├── schemas/                 # mcp.package.v1.schema.json
├── examples/                # Sample manifests (real package + fixture server)
└── tests/                   # pytest suite + fixture MCP server
```

### Data flow

```
Manifest (mcp.package.json)
   │  mcp-validate ──► JSON Schema + semantic checks
   │  mcp-probe    ──► launch server, send initialize, capture capabilities
   │  mcp-score    ──► weighted, explainable trust grade
   │  mcp-benchmark──► spawn server, N requests, latency p50/p95/p99 + rps
   ▼
Registry API (persists to data/packages.json)
   ▼
Web UI (browse / search / sandbox / docs)
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+
- Optional: Docker (for container-based servers)

### Quick start

```bash
# Install dependencies
pip install -r requirements.txt
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..

# Start the registry API (port 8080, auto-seeds starter packages)
cd apps/api && npm run dev

# Start the web app (port 3000, proxies /v1 to the API)
cd apps/web && npm run dev
```

Then open `http://localhost:3000`.

### CLI tools

```bash
# Validate a manifest against the official schema
python cli/bin/mcp-validate examples/mcp.package.json

# Probe a server's runtime (launches it and sends initialize)
python cli/bin/mcp-probe examples/echo-server.mcp.package.json

# Compute an explainable trust score
python cli/bin/mcp-score examples/mcp.package.json

# Create a reproducible release snapshot
python cli/bin/mcp-snapshot examples/mcp.package.json --output snapshot.json

# Benchmark a live server (latency percentiles + throughput)
python cli/bin/mcp-benchmark examples/echo-server.mcp.package.json --iterations 200 --verbose

# Generate install configs for every supported client
python cli/bin/mcp-generate examples/mcp.package.json --output-dir ./configs

# Analyze compatibility against every supported client
python cli/bin/mcp-compat examples/mcp.package.json

# Run security policy analysis (scopes, SSRF, docker hygiene)
python cli/bin/mcp-security examples/mcp.package.json
```

All tools also accept `--output/-o` to write JSON reports to disk.

---

## Registry API

Base URL: `http://localhost:8080`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe (uptime, version, registry counts) |
| GET | `/v1/packages` | List packages (query, filters, sort, pagination) |
| GET | `/v1/packages/:slug` | Package detail + releases |
| POST | `/v1/packages` | Register a package |
| PUT | `/v1/packages/:slug` | Update a package |
| DELETE | `/v1/packages/:slug` | Remove a package |
| GET | `/v1/packages/:slug/releases` | List releases |
| POST | `/v1/packages/:slug/releases` | Publish a release |
| GET | `/v1/packages/:slug/releases/:version` | Fetch a specific release |
| GET | `/v1/packages/:slug/trust` | Explainable trust score |
| GET | `/v1/packages/:slug/compat` | Client compatibility matrix |
| GET | `/v1/packages/:slug/install` | Install configs (all clients, or `?client=`) |
| GET | `/v1/search` | Search with transport/auth filters |
| GET | `/v1/stats` | Registry statistics |

### List query parameters

- `q` — free-text search (name, slug, description, transports, tags)
- `transport` — `stdio` | `streamable-http` | `sse`
- `auth` — `none` | `api_key` | `oauth` | `bearer`
- `primitive` — `tools` | `prompts` | `resources` | `sampling`
- `verified` — `true` | `false`
- `sort` — `updated` | `stars` | `name`
- `limit` / `offset` — pagination (default `limit=20`, max `100`)

### Configuration (environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | API port |
| `HOST` | `0.0.0.0` | Bind host |
| `LOG_LEVEL` | `info` | pino log level |
| `DATA_FILE` | `data/packages.json` | JSON persistence file |
| `RATE_LIMIT_MAX` | `120` | Requests per window |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate-limit window |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

---

## Sandbox Tester

The web UI includes an interactive sandbox on every package detail page. It:

1. Resolves the package manifest from the registry.
2. Spawns the server's stdio runtime in a subprocess (one request per process — no state leaks).
3. Sends your JSON-RPC request (default `list_tools`) with a 15s timeout.
4. Streams back logs and the JSON response.

The sandbox is **rate-limited to 10 requests/minute** and time-boxed, and non-stdio runtimes are rejected.

---

## Security Model

- **Scope analysis** — flags unbounded filesystem paths, unrestricted network egress, and wildcard patterns.
- **SSRF detection** — warns on known SSRF-testing endpoints in egress domains.
- **Docker hygiene** — warns on unpinned `:latest` image tags.
- **Layer-7 egress hook** (`channel_egress_hook.py`) — allowlist/denylist enforcement with a JSONL audit log.
- **Sandbox isolation** — subprocess isolation, per-request lifetime, bounded network via manifest scope inspection.

---

## Testing

```bash
# Python toolchain (46 tests)
python -m pytest tests/ -v

# Registry API (26 tests)
cd apps/api && npx vitest run

# Typechecks
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Web production build
cd apps/web && npm run build
```

Or use `make test`, `make typecheck`, `make web-build` from the repo root.

---

## Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| 1 Foundation | Done | Manifest spec, schema, dual-backend scaffold |
| 2 Real Utility | Done | Probing, install generators, trust scoring, compatibility matrix |
| 3 Differentiation | Done | Sandbox tester, security analysis, snapshots |
| 4 Performance | Done | Benchmarking suite + trust integration |
| 5+ | Next | Observability, enterprise security, client diversity, federation, AI curation |

---

## License

MIT © [Luv Goel](https://github.com/Luv-Goel)
