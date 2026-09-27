#!/usr/bin/env python3
"""
Runtime probe system for MCP servers - Phase 2.
Probes stdio, Docker, and remote MCP servers for verification.
"""
import asyncio, json, subprocess, time, os, sys
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class ProbeResult:
    success: bool
    error: str = ""
    tools: list = None
    duration_ms: int = 0
    transport: str = "unknown"

    def to_dict(self):
        return {**asdict(self), "tools": self.tools or []}

async def probe_stdio(manifest_path: str, timeout: int = 10) -> ProbeResult:
    """Probe a stdio MCP server by sending an initialize request."""
    start = time.time()
    try:
        manifest = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return ProbeResult(False, error=f"Failed to load manifest: {e}", transport="stdio")

    runtime = manifest.get("runtime", {})
    entry = runtime.get("entrypoint", ["python", "-m", "server"])
    env_extra = runtime.get("env", {})

    env = {**os.environ}
    env.update(env_extra)

    try:
        proc = await asyncio.create_subprocess_exec(
            *entry, env=env,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        init_msg = json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {"protocolVersion": "2024-11-05", "capabilities": {}}
        })
        proc.stdin.write((init_msg + "\n").encode())
        await proc.stdin.drain()

        # Read response or timeout
        try:
            line = await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
            data = json.loads(line.decode())
            tools = data.get("result", {}).get("capabilities", {}).get("tools", [])
        except asyncio.TimeoutError:
            return ProbeResult(False, error="Server did not respond within timeout", transport="stdio")
        except json.JSONDecodeError:
            return ProbeResult(False, error="Invalid JSON response from server", transport="stdio")

        await proc.wait()
        return ProbeResult(
            success=proc.returncode == 0,
            tools=tools,
            duration_ms=int((time.time() - start) * 1000),
            transport="stdio"
        )
    except FileNotFoundError:
        return ProbeResult(False, error=f"Command not found: {entry[0]}", transport="stdio")
    except Exception as e:
        return ProbeResult(False, error=str(e), transport="stdio")

def probe_docker(image: str, timeout: int = 30) -> ProbeResult:
    """Probe a Docker-based MCP server image."""
    start = time.time()
    try:
        result = subprocess.run(
            ["docker", "run", "--rm", "--network=none", image,
             "--help" if True else "/bin/sh", "-c", "echo ready"],
            capture_output=True, text=True, timeout=timeout
        )
        return ProbeResult(
            success=result.returncode == 0,
            duration_ms=int((time.time() - start) * 1000),
            transport="docker"
        )
    except subprocess.TimeoutExpired:
        return ProbeResult(False, error="Docker probe timed out", transport="docker")
    except FileNotFoundError:
        return ProbeResult(False, error="Docker not installed", transport="docker")
    except Exception as e:
        return ProbeResult(False, error=str(e), transport="docker")

async def probe_http(url: str, timeout: int = 10) -> ProbeResult:
    """Probe a remote MCP server via HTTP/SSE."""
    start = time.time()
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{url.rstrip('/')}/health", timeout=timeout) as resp:
                body = await resp.text()
                return ProbeResult(
                    success=resp.status == 200,
                    duration_ms=int((time.time() - start) * 1000),
                    transport="http"
                )
    except ImportError:
        return ProbeResult(False, error="aiohttp not installed (run: pip install aiohttp)", transport="http")
    except Exception as e:
        return ProbeResult(False, error=str(e), transport="http")

def probe_manifest(manifest_path: str) -> dict:
    """Static manifest probe: enumerate declared capabilities."""
    try:
        data = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return {"valid": False, "error": str(e)}

    return {
        "valid": True,
        "name": data.get("name"),
        "slug": data.get("slug"),
        "primitives": data.get("primitives"),
        "transports": data.get("transports", []),
        "auth": data.get("auth", {}).get("type"),
        "runtime_type": data.get("runtime", {}).get("type"),
        "scopes": [s["name"] for s in data.get("scopes", [])],
    }

def run_probe(manifest_path: str) -> dict:
    """Run all probes for a given manifest."""
    manifest_probe = probe_manifest(manifest_path)
    runtime_type = manifest_probe.get("runtime_type", "stdio")

    if runtime_type == "docker":
        image = json.loads(Path(manifest_path).read_text()).get("runtime", {}).get("image", "")
        result = probe_docker(image)
    elif runtime_type == "remote":
        url = json.loads(Path(manifest_path).read_text()).get("runtime", {}).get("url", "")
        result = asyncio.run(probe_http(url))
    else:
        result = asyncio.run(probe_stdio(manifest_path))

    return {
        "manifest": manifest_probe,
        "runtime": result.to_dict(),
        "overall": result.success,
    }

if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    result = run_probe(manifest)
    print(json.dumps(result, indent=2))