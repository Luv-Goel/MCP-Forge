#!/usr/bin/env python3
"""
Compatibility Matrix - Phase 2.
Maps MCP packages to client capabilities.
"""
import json, sys
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class ClientCapabilities:
    name: str
    transports: list
    primitives: dict
    auth: list
    supports_roots: bool
    supports_sampling: bool
    notes: str = ""

COMPATIBILITY_MATRIX = {
    "claude-desktop": ClientCapabilities(
        name="Claude Desktop",
        transports=["stdio", "streamable-http"],
        primitives={"tools": True, "prompts": True, "resources": True, "sampling": False},
        auth=["api_key", "oauth"],
        supports_roots=True,
        supports_sampling=False,
        notes="Native MCP support; roots via filesystem roots config",
    ),
    "openai-compatible": ClientCapabilities(
        name="OpenAI-Compatible Clients",
        transports=["streamable-http"],
        primitives={"tools": True, "prompts": True, "resources": True, "sampling": True},
        auth=["api_key", "oauth", "bearer"],
        supports_roots=True,
        supports_sampling=True,
        notes="Requires Streamable HTTP transport; sampling via server-side sampling",
    ),
    "vscode": ClientCapabilities(
        name="VS Code (Copilot)",
        transports=["stdio"],
        primitives={"tools": True, "prompts": True, "resources": True, "sampling": False},
        auth=["api_key"],
        supports_roots=True,
        supports_sampling=False,
        notes="Stdio only; OAuth via VS Code identity",
    ),
    "cursor": ClientCapabilities(
        name="Cursor",
        transports=["stdio", "streamable-http"],
        primitives={"tools": True, "prompts": True, "resources": True, "sampling": False},
        auth=["api_key", "oauth"],
        supports_roots=True,
        supports_sampling=False,
        notes="Similar to Claude Desktop; supports both transports",
    ),
    "custom-runtime": ClientCapabilities(
        name="Custom Agent Runtime",
        transports=["stdio", "streamable-http", "sse"],
        primitives={"tools": True, "prompts": True, "resources": True, "sampling": True},
        auth=["api_key", "oauth", "bearer", "none"],
        supports_roots=True,
        supports_sampling=True,
        notes="Full flexibility; depends on implementation",
    ),
}

def check_compatibility(manifest: dict, client: str) -> dict:
    """Check if a package is compatible with a given client."""
    if client not in COMPATIBILITY_MATRIX:
        return {"compatible": False, "error": f"Unknown client: {client}"}

    caps = COMPATIBILITY_MATRIX[client]
    issues = []
    warnings = []

    # Transport check
    pkg_transports = set(manifest.get("transports", []))
    client_transports = set(caps.transports)
    overlap = pkg_transports & client_transports
    if not overlap:
        issues.append(f"No compatible transports. Package: {pkg_transports}, Client: {client_transports}")

    # Primitives check
    pkg_prim = manifest.get("primitives", {})
    client_prim = caps.primitives
    for prim, supported in client_prim.items():
        pkg_supports = pkg_prim.get(prim, False)
        if pkg_supports and not supported:
            issues.append(f"Primitive '{prim}' not supported by {client}")

    # Auth check
    pkg_auth = manifest.get("auth", {}).get("type", "none")
    if pkg_auth not in caps.auth:
        issues.append(f"Auth type '{pkg_auth}' not supported by {client}")

    # Roots check
    if manifest.get("runtime", {}).get("roots") and not caps.supports_roots:
        warnings.append("Package uses filesystem roots but client has limited root support")

    # Sampling check
    if pkg_prim.get("sampling") and not caps.supports_sampling:
        warnings.append("Package uses sampling but client does not support it")

    compatible = len(issues) == 0
    return {
        "compatible": compatible,
        "package": manifest.get("name"),
        "client": client,
        "client_transports": caps.transports,
        "package_transports": manifest.get("transports", []),
        "compatible_transports": list(overlap),
        "primitives_match": {
            k: pkg_prim.get(k, False) == v
            for k, v in client_prim.items() if pkg_prim.get(k, False)
        },
        "auth_compatible": pkg_auth in caps.auth,
        "issues": issues,
        "warnings": warnings,
        "notes": caps.notes,
    }

def build_matrix(manifest: dict) -> dict:
    """Build a full compatibility matrix for a package."""
    results = {}
    for client_id in COMPATIBILITY_MATRIX:
        results[client_id] = check_compatibility(manifest, client_id)
    return results

def get_matrix_summary() -> list:
    """Return a summary of all client capabilities."""
    return [
        {
            "id": client_id,
            "name": caps.name,
            "transports": caps.transports,
            "primitives": caps.primitives,
            "auth": caps.auth,
            "supports_roots": caps.supports_roots,
            "supports_sampling": caps.supports_sampling,
            "notes": caps.notes,
        }
        for client_id, caps in COMPATIBILITY_MATRIX.items()
    ]

def analyze_package(manifest_path: str) -> dict:
    """Full compatibility analysis for a manifest."""
    try:
        manifest = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return {"error": str(e)}

    matrix = build_matrix(manifest)
    compatible_clients = [k for k, v in matrix.items() if v["compatible"]]

    return {
        "package": manifest.get("name"),
        "slug": manifest.get("slug"),
        "package_transports": manifest.get("transports", []),
        "package_primitives": manifest.get("primitives", {}),
        "compatible_clients": compatible_clients,
        "incompatible_clients": [k for k in matrix if k not in compatible_clients],
        "matrix": matrix,
        "summary": get_matrix_summary(),
    }

if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    result = analyze_package(manifest)
    print(json.dumps(result, indent=2))