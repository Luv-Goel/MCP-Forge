#!/usr/bin/env python3
"""
Runtime probe system for MCP servers - Phase 2.
Probes stdio, Docker, and remote MCP servers for verification.
"""
import asyncio
import json
import subprocess
import time
import os
import sys
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


async def _terminate(proc) -> None:
    """Best-effort kill + wait for a subprocess."""
    try:
        proc.kill()
    except (ProcessLookupError, OSError):
        pass
    try:
        await asyncio.wait_for(proc.wait(), timeout=3)
    except (asyncio.TimeoutError, ProcessLookupError, OSError):
        pass


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
    env = {**os.environ, **{k: str(v) for k, v in env_extra.items() if v != "required"}}

    try:
        proc = await asyncio.create_subprocess_exec(
            *entry,
            env=env,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        init_msg = json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "mcp-forge-probe", "version": "0.1.0"},
            },
        })
        proc.stdin.write((init_msg + "\n").encode())
        await proc.stdin.drain()

        capabilities = {}
        tools = []
        try:
            line = await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
            data = json.loads(line.decode())
            result = data.get("result", {})
            if data.get("error"):
                raise RuntimeError(f"initialize failed: {data['error']}")
            capabilities = result.get("capabilities", {})
        except asyncio.TimeoutError:
            await _terminate(proc)
            return ProbeResult(False, error="Server did not respond within timeout", transport="stdio")
        except json.JSONDecodeError:
            await _terminate(proc)
            return ProbeResult(False, error="Invalid JSON response from server", transport="stdio")
        except RuntimeError as exc:
            await _terminate(proc)
            return ProbeResult(False, error=str(exc), transport="stdio")

        # Send the initialized notification (protocol requirement), then enumerate
        # tools with tools/list if the server advertises the tools capability.
        notify = json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"})
        proc.stdin.write((notify + "\n").encode())
        await proc.stdin.drain()

        if capabilities.get("tools") is not False:
            tools_msg = json.dumps({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
            proc.stdin.write((tools_msg + "\n").encode())
            await proc.stdin.drain()
            try:
                line = await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
                data = json.loads(line.decode())
                if data.get("result"):
                    tools = data["result"].get("tools", [])
            except (asyncio.TimeoutError, json.JSONDecodeError):
                tools = []

        await _terminate(proc)

        return ProbeResult(
            success=True,
            tools=tools,
            duration_ms=int((time.time() - start) * 1000),
            transport="stdio",
        )
    except FileNotFoundError:
        return ProbeResult(False, error=f"Command not found: {entry[0]}", transport="stdio")
    except Exception as e:
        return ProbeResult(False, error=str(e), transport="stdio")


def probe_docker(image: str, timeout: int = 30) -> ProbeResult:
    """Probe a Docker-based MCP server image (offline network, bounded runtime)."""
    start = time.time()
    try:
        result = subprocess.run(
            ["docker", "run", "--rm", "--network=none", "--entrypoint", "sh", image, "-c", "echo ready"],
            capture_output=True, text=True, timeout=timeout,
        )
        return ProbeResult(
            success=result.returncode == 0,
            duration_ms=int((time.time() - start) * 1000),
            transport="docker",
            error="" if result.returncode == 0 else (result.stderr or result.stdout)[:200],
        )
    except subprocess.TimeoutExpired:
        return ProbeResult(False, error="Docker probe timed out", transport="docker")
    except FileNotFoundError:
        return ProbeResult(False, error="Docker not installed", transport="docker")
    except Exception as e:
        return ProbeResult(False, error=str(e), transport="docker")


async def probe_http(url: str, timeout: int = 10) -> ProbeResult:
    """Probe a remote MCP server via HTTP."""
    start = time.time()
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{url.rstrip('/')}/health", timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                await resp.text()
                return ProbeResult(
                    success=resp.status == 200,
                    duration_ms=int((time.time() - start) * 1000),
                    transport="http",
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


def run_probe(manifest_path: str, timeout: int = 10) -> dict:
    """Run all probes for a given manifest."""
    manifest_probe = probe_manifest(manifest_path)
    if not manifest_probe.get("valid"):
        return {"manifest": manifest_probe, "runtime": {}, "overall": False}

    try:
        data = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return {"manifest": manifest_probe, "runtime": {"success": False, "error": str(e)}, "overall": False}

    runtime_type = manifest_probe.get("runtime_type", "stdio")
    if runtime_type == "docker":
        result = probe_docker(data.get("runtime", {}).get("image", ""), timeout=timeout)
    elif runtime_type == "remote":
        result = asyncio.run(probe_http(data.get("runtime", {}).get("url", ""), timeout=timeout))
    else:
        result = asyncio.run(probe_stdio(manifest_path, timeout=timeout))

    return {
        "manifest": manifest_probe,
        "runtime": result.to_dict(),
        "overall": result.success,
    }


if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    result = run_probe(manifest)
    print(json.dumps(result, indent=2))
