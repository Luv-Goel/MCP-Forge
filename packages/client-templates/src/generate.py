#!/usr/bin/env python3
"""
Install Generator - Phase 2.
Generates ready-to-use config snippets for various MCP clients.
"""
import json, sys
from pathlib import Path

CLIENTS = ["claude-desktop", "openai-compatible", "vscode", "docker-compose", "json-manifest"]

TRANSPORT_MAP = {
    "claude-desktop": "stdio",
    "openai-compatible": "streamable-http",
    "vscode": "stdio",
    "docker-compose": "stdio",
    "json-manifest": "stdio",
}

def generate_claude_desktop(data: dict, slug: str) -> str:
    """Generate Claude Desktop config snippet."""
    runtime = data.get("runtime", {})
    entry = " ".join(runtime.get("entrypoint", []))
    env = runtime.get("env", {})
    
    config = {
        "mcpServers": {
            slug: {
                "command": entry.split()[0],
                "args": entry.split()[1:],
                "env": {k: "" for k in env if env[k] == "required"}
            }
        }
    }
    return json.dumps(config, indent=2)

def generate_openai_compatible(data: dict, slug: str) -> str:
    """Generate OpenAI-compatible client config (Streamable HTTP)."""
    runtime = data.get("runtime", {})
    url = runtime.get("url", f"https://{slug}.mcp.run")
    auth = data.get("auth", {})
    env_var = auth.get("env_var", "API_KEY")
    
    config = {
        "mcpServers": {
            slug: {
                "url": url,
                "headers": {"Authorization": f"Bearer ${env_var}"}
            }
        }
    }
    return json.dumps(config, indent=2)

def generate_docker_compose(data: dict, slug: str) -> str:
    """Generate Docker Compose configuration."""
    runtime = data.get("runtime", {})
    image = runtime.get("image", f"ghcr.io/mcp-forge/{slug}")
    env = runtime.get("env", {})
    
    compose = {
        "version": "3.8",
        "services": {
            slug: {
                "image": image,
                "environment": {k: "" for k in env if env[k] == "required"},
                "network_mode": "none" if not runtime.get("network", {}).get("required") else None
            }
        }
    }
    return json.dumps(compose, indent=2)

def generate_json_manifest(data: dict, slug: str) -> str:
    """Generate a raw JSON manifest for custom integrations."""
    return json.dumps(data, indent=2)

def generate_install_configs(manifest_path: str, client: str = "all") -> dict:
    """Generate install configs for one or all clients."""
    try:
        data = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return {"error": str(e)}
    
    slug = data.get("slug", "unknown")
    results = {}

    if client == "all":
        for c in CLIENTS:
            results[c] = generate_for_client(data, slug, c)
    else:
        if client not in CLIENTS:
            return {"error": f"Unknown client: {client}. Choose from: {CLIENTS}"}
        results[client] = generate_for_client(data, slug, client)
    
    return results

def generate_for_client(data: dict, slug: str, client: str) -> str:
    """Dispatch to the right generator."""
    if client == "claude-desktop":
        return generate_claude_desktop(data, slug)
    elif client == "openai-compatible":
        return generate_openai_compatible(data, slug)
    elif client == "vscode":
        return generate_claude_desktop(data, slug)  # same as Claude for stdio
    elif client == "docker-compose":
        return generate_docker_compose(data, slug)
    elif client == "json-manifest":
        return generate_json_manifest(data, slug)
    return "# Unsupported client"

if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    client = sys.argv[2] if len(sys.argv) > 2 else "all"
    results = generate_install_configs(manifest, client)
    print(json.dumps(results, indent=2))