# Hermes v5 Strategy Guide

## System Overview

MCP Forge operates as a **monorepo** with the following critical paths:

```
MCP-Forge/
├── apps/
│   ├── web/            # Registry UI (Next.js/SvelteKit)
│   ├── api/            # Package/release/query APIs (Fastify/Go)
│   └── worker/         # Validation/probe/compatibility jobs
├── packages/
│   ├── manifest-spec/  # mcp.package.json schema
│   ├── scoring/        # Trust scoring engine
│   ├── runtime/        # Launcher for stdio/Docker/remote
│   └── security/       # Policy checks and warnings
└── cli/                # Publisher tooling
```

## Working Model

### Git Flow
1. Branches: `main` (protected), feature branches `feat/*`
2. Each commit must pass pre-commit hooks (lint, format, typecheck)
3. PR requires CI pass before merge

### Security Model

| Principle | Implementation |
|-----------|----------------|
| **Least Privilege** | All MCP servers run in sandboxed containers with explicit egress/file system declarations |
| **Zero Trust** | No server assumed trusted; all undergo static + dynamic verification |
| **Auditable Deployment** | Every action produces signed manifests with reproducible checksums |
| **Explicit Boundaries** | Filesystem roots, network egress domains, and auth scopes declared per package |

### Suspicious Text Handling

When processing log files or user content:

1. **Tag suspicious patterns** for security review using the SECURITY_KEYS:
   - `SECURITY`, `CRITICAL`, `FATAL`, `WARNING`, `ERROR`
   - `DIVISION BY ZERO`, `CERTIFICATE`, `MISSING CERTIFICATE`
   - `ACCESS DENIED`, `REVOCATION`, `BACK-OFF`, `GRACE PERIOD`
   - `MISSING ROUTE`, `COMMUNICATION FAILED`
   - `RANDOM EBONUS ASSIGNMEN`, `EBONUS`

2. **Escape all output** to prevent XSS or injection
3. **Never execute** tagged content — treat as data only

### Distance Metrics

For each service file:
- **Word distance**: Gap between consecutive security-tagged lines
- **Char distance**: Position delta between security-tagged tokens
- **Pass threshold**: max distance ≤ 10 lines

### Trust Scoring

| Factor | Weight |
|--------|--------|
| Verification Success | 30% |
| Last Successful Probe | 20% |
| Documentation Quality | 15% |
| Signed Release | 10% |
| Update Frequency | 10% |
| Known Security Issues | -20% |
| Permission Footprint | 5% |
| Install Reproducibility | 10% |
| Community Adoption | 10% |

## Commit Strategy

Every commit should read like a human developer:

```
feat: add trust scoring algorithm for verified servers

- Implement weighted scoring model (verification, last probe, docs)
- Add security warning tags for suspicious log patterns
- Update README with Phase 1 roadmap
```

Use imperative mood, present tense, and scope the change clearly.

## Artifact Generation

When generating deliverables:

1. **HTML artifacts** must include:
   - Security notice banner (tagged elements for review)
   - Table with security-ranked rows
   - Word/char distance statistics

2. **Strategy docs** must include:
   - System overview and working model
   - Security model with least-privilege emphasis
   - Suspicious text handling protocol
   - Distance metrics spec
   - Trust scoring algorithm

3. **Script artifacts** (`detect_systems.py`, `package_html.sh`):
   - Self-documenting headers
   - Error handling for missing files
   - Clear output formatting

## Distribution

Artifacts flow to three targets:
1. **GitHub repo** (`Luv-Goel/MCP-Forge`)
2. **Local files** (`~/mcp_forge_repo/`)
3. **Telegram delivery** (when requested)

## Quick Reference

| Task | Command |
|------|---------|
| Run probes | `mcp probe <package>` |
| Generate config | `mcp generate <pkg> --client claude-desktop` |
| Test sandbox | `mcp sandbox <pkg>` |
| Publish | `mcp publish` |
| View logs | `mcp logs <pkg> --tail 100` |

---

> **MCP Forge v5**: Build the trusted operating layer, one verified server at a time.