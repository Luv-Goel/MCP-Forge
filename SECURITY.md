# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Active support  |
| < 1.0   | ❌ Not supported   |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via public GitHub issues.**

If you discover a security vulnerability in MCP Forge, please disclose it responsibly. Send details to:

- **Email:** luv.security@proton.me *(or open a private GitHub security advisory)*
- **GitHub Advisory:** [Report a vulnerability](https://github.com/Luv-Goel/MCP-Forge/security/advisories/new)

### What to include

1. A description of the vulnerability and its potential impact.
2. Steps to reproduce (a minimal proof-of-concept if applicable).
3. Affected component(s) — CLI, API, sandbox runner, etc.
4. Any suggested mitigations.

### Response timeline

| Stage | Target |
|-------|--------|
| Acknowledgement | Within **48 hours** |
| Initial triage | Within **5 business days** |
| Fix & release | Within **30 days** for critical issues |

We follow responsible disclosure: we will credit you in the release notes (unless you prefer anonymity) once the fix is shipped.

---

## Scope

The following are **in scope** for security reports:

- **Sandbox escape** — breaking out of the subprocess isolation in `packages/runtime/sandbox.py`.
- **SSRF via egress hook** — bypassing the allowlist in `channel_egress_hook.py`.
- **Manifest injection** — crafting a manifest that causes arbitrary code execution during validation or probing.
- **Registry API auth bypass** — unauthorized modification of the package store.
- **Path traversal** — any file-system traversal via manifest fields.
- **Dependency vulnerabilities** — critical CVEs in direct dependencies.

The following are **out of scope**:

- Vulnerabilities in third-party MCP servers registered in the registry.
- Denial-of-service issues without a realistic attack scenario.
- Issues requiring physical access to the server.
- Social engineering attacks.

---

Thank you for helping keep MCP Forge secure! 🔒
