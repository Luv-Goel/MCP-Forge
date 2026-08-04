#!/usr/bin/env python3
"""Benchmark runner for MCP servers.

Spawns a real MCP server (stdio/docker/remote) from a package manifest and
measures round-trip latency percentiles, throughput and error rate using the
standard MCP JSON-RPC scenarios.
"""
import asyncio
import json
import os
import statistics
import time
from pathlib import Path
from dataclasses import dataclass, asdict

from scenarios.std_scenarios import list_tools_scenario, call_tool_scenario, read_resource_scenario


@dataclass
class BenchmarkResult:
    latency_ms: float
    latency_p95_ms: float
    latency_p99_ms: float
    throughput_rps: float
    error_rate: float
    requests: int
    errors: int
    transport: str
    success: bool
    error: str = ""


def _percentile(samples, pct):
    if not samples:
        return 0.0
    samples = sorted(samples)
    k = max(0, min(len(samples) - 1, int(round((len(samples) - 1) * pct / 100))))
    return samples[k]


def _summarize(latencies, errors, total_elapsed, transport):
    ok = len(latencies)
    error_rate = (errors / (ok + errors)) if (ok + errors) else 0.0
    throughput = (ok / total_elapsed) if total_elapsed > 0 else 0.0
    return BenchmarkResult(
        latency_ms=round(_percentile(latencies, 50), 2),
        latency_p95_ms=round(_percentile(latencies, 95), 2),
        latency_p99_ms=round(_percentile(latencies, 99), 2),
        throughput_rps=round(throughput, 2),
        error_rate=round(error_rate, 4),
        requests=ok,
        errors=errors,
        transport=transport,
        success=error_rate < 0.05 and ok > 0,
    )


class MCPStdioSession:
    """A single stdio MCP server session with JSON-RPC request support."""

    def __init__(self, entrypoint, env=None, timeout=5):
        self.entrypoint = entrypoint
        self.env = {**os.environ, **(env or {})}
        self.timeout = timeout
        self.proc = None

    async def start(self):
        self.proc = await asyncio.create_subprocess_exec(
            *self.entrypoint,
            env=self.env,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await self.request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "mcp-forge-benchmark", "version": "0.1.0"},
        })

    async def request(self, method, params):
        msg = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
        self.proc.stdin.write((msg + "\n").encode())
        await self.proc.stdin.drain()
        line = await asyncio.wait_for(self.proc.stdout.readline(), timeout=self.timeout)
        return json.loads(line.decode())

    async def close(self):
        if self.proc and self.proc.returncode is None:
            self.proc.kill()
            try:
                await asyncio.wait_for(self.proc.wait(), timeout=3)
            except (asyncio.TimeoutError, ProcessLookupError):
                pass


class BenchmarkRunner:
    def __init__(self, manifest_path, iterations=100, concurrency=1, timeout=5):
        self.manifest_path = str(Path(manifest_path).resolve())
        self.iterations = iterations
        self.concurrency = concurrency
        self.timeout = timeout

    def _load_manifest(self):
        with open(self.manifest_path) as f:
            return json.load(f)

    async def _benchmark_stdio(self, runtime) -> BenchmarkResult:
        entrypoint = runtime.get("entrypoint", ["python", "-m", "server"])
        env = runtime.get("env", {})
        scenario = list_tools_scenario
        latencies, errors = [], 0
        start = time.monotonic()

        async def worker(_):
            nonlocal errors
            session = MCPStdioSession(entrypoint, env, self.timeout)
            try:
                await session.start()
                for _ in range(self.iterations):
                    t0 = time.monotonic()
                    try:
                        resp = await session.request(scenario["method"], scenario["params"])
                        if resp.get("error"):
                            errors += 1
                        latencies.append((time.monotonic() - t0) * 1000)
                    except (asyncio.TimeoutError, json.JSONDecodeError, ConnectionError):
                        errors += 1
            except FileNotFoundError:
                return BenchmarkResult(0, 0, 0, 0, 1.0, 0, 1, "stdio", False,
                                       error=f"command not found: {entrypoint[0]}")
            except Exception as exc:
                return BenchmarkResult(0, 0, 0, 0, 1.0, 0, 1, "stdio", False, error=str(exc))
            finally:
                await session.close()

        if self.concurrency > 1:
            await asyncio.gather(*[worker(i) for i in range(self.concurrency)])
        else:
            await worker(0)

        elapsed = time.monotonic() - start
        return _summarize(latencies, errors, elapsed, "stdio")

    async def _benchmark_http(self, url) -> BenchmarkResult:
        try:
            import aiohttp
        except ImportError:
            return BenchmarkResult(0, 0, 0, 0, 1.0, 0, 1, "http", False,
                                   error="aiohttp not installed (pip install aiohttp)")

        latencies, errors = [], 0
        endpoint = f"{url.rstrip('/')}/mcp"
        start = time.monotonic()
        timeout = aiohttp.ClientTimeout(total=self.timeout)

        async def one_call(session):
            nonlocal errors
            t0 = time.monotonic()
            try:
                async with session.post(endpoint, json=list_tools_scenario, timeout=timeout) as resp:
                    await resp.json()
                    if resp.status >= 400:
                        errors += 1
                latencies.append((time.monotonic() - t0) * 1000)
            except Exception:
                errors += 1

        async with aiohttp.ClientSession() as session:
            for _ in range(self.iterations):
                await one_call(session)
        elapsed = time.monotonic() - start
        return _summarize(latencies, errors, elapsed, "streamable-http")

    def run(self) -> BenchmarkResult:
        try:
            manifest = self._load_manifest()
        except Exception as exc:
            return BenchmarkResult(0, 0, 0, 0, 1.0, 0, 1, "unknown", False, error=str(exc))

        runtime = manifest.get("runtime", {})
        rt_type = runtime.get("type", "stdio")
        try:
            if rt_type == "remote":
                return asyncio.run(self._benchmark_http(runtime.get("url", "")))
            return asyncio.run(self._benchmark_stdio(runtime))
        except KeyboardInterrupt:
            return BenchmarkResult(0, 0, 0, 0, 1.0, 0, 1, rt_type, False, error="benchmark interrupted")


if __name__ == "__main__":
    import sys

    path = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    iters = int(sys.argv[sys.argv.index("--iterations") + 1]) if "--iterations" in sys.argv else 100
    result = BenchmarkRunner(path, iterations=iters).run()
    print(json.dumps(asdict(result), indent=2))
