#!/usr/bin/env python3
"""
Sandboxed MCP request runner - Phase 3.

Spawns a stdio MCP server from a manifest, sends a single JSON-RPC request,
and returns the response alongside captured stdout/stderr logs. Designed to be
invoked as a subprocess by the web sandbox API, one request per invocation so
no state leaks between requests.
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from dataclasses import dataclass, asdict, field


@dataclass
class SandboxResult:
    success: bool
    response: dict = None
    logs: list = field(default_factory=list)
    error: str = ""
    duration_ms: int = 0

    def __post_init__(self):
        if self.response is None:
            self.response = {}

    def to_dict(self):
        return asdict(self)


async def run_request(manifest_path: str, request: dict, timeout: int = 15) -> SandboxResult:
    logs = []
    try:
        manifest = json.loads(Path(manifest_path).read_text())
    except Exception as exc:
        return SandboxResult(False, error=f"failed to load manifest: {exc}", logs=["manifest load error"])

    runtime = manifest.get("runtime", {})
    rt_type = runtime.get("type", "stdio")
    if rt_type not in ("stdio", "python", "binary"):
        return SandboxResult(
            False,
            error=f"sandbox supports stdio runtimes only (got '{rt_type}')",
            logs=[f"runtime type '{rt_type}' not sandboxable"],
        )

    entry = runtime.get("entrypoint", ["python", "-m", "server"])
    env = {**os.environ}
    for k, v in runtime.get("env", {}).items():
        if v != "required":
            env[k] = str(v)
    env["MCP_SANDBOX"] = "1"

    start = asyncio.get_event_loop().time()
    try:
        proc = await asyncio.create_subprocess_exec(
            *entry,
            env=env,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError:
        return SandboxResult(False, error=f"command not found: {entry[0]}", logs=[f"entrypoint not found: {entry[0]}"])

    async def pump_stream(stream, level):
        while True:
            line = await stream.readline()
            if not line:
                break
            logs.append({"level": level, "message": line.decode(errors="replace").rstrip()})

    stderr_task = asyncio.create_task(pump_stream(proc.stderr, "stderr"))

    try:
        # Protocol handshake: initialize first, then notifications/initialized.
        init = json.dumps({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "mcp-forge-sandbox", "version": "0.1.0"},
            },
        })
        proc.stdin.write((init + "\n").encode())
        await proc.stdin.drain()
        await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
        logs.append({"level": "info", "message": "initialize handshake complete"})

        notify = json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"})
        proc.stdin.write((notify + "\n").encode())
        await proc.stdin.drain()

        msg = json.dumps({"jsonrpc": "2.0", "id": 1, "method": request.get("method", "tools/list"), "params": request.get("params", {})})
        proc.stdin.write((msg + "\n").encode())
        await proc.stdin.drain()

        line = await asyncio.wait_for(proc.stdout.readline(), timeout=timeout)
        response = json.loads(line.decode())
        logs.append({"level": "info", "message": "request sent and response received"})

        proc.kill()
        try:
            await asyncio.wait_for(proc.wait(), timeout=3)
        except (asyncio.TimeoutError, ProcessLookupError):
            pass
        await stderr_task

        duration_ms = int((asyncio.get_event_loop().time() - start) * 1000)
        return SandboxResult(
            success=True,
            response=response,
            logs=logs,
            duration_ms=duration_ms,
        )
    except asyncio.TimeoutError:
        proc.kill()
        await stderr_task
        return SandboxResult(False, error=f"server did not respond within {timeout}s", logs=logs)
    except json.JSONDecodeError:
        proc.kill()
        await stderr_task
        return SandboxResult(False, error="server returned an invalid JSON response", logs=logs)
    except Exception as exc:
        proc.kill()
        await stderr_task
        return SandboxResult(False, error=str(exc), logs=logs)


def main(argv=None):
    """CLI: sandbox.py <manifest> <request.json> [--timeout N]."""
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    manifest_path = sys.argv[1]
    request_path = sys.argv[2]
    timeout = 15
    if "--timeout" in sys.argv:
        timeout = int(sys.argv[sys.argv.index("--timeout") + 1])

    request = json.loads(Path(request_path).read_text())
    result = asyncio.run(run_request(manifest_path, request, timeout))
    print(json.dumps(result.to_dict(), indent=2))
    sys.exit(0 if result.success else 1)


if __name__ == "__main__":
    main()
