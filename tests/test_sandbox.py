import asyncio
import json
from pathlib import Path

from sandbox import run_request

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "examples" / "echo-server.mcp.package.json"


def test_sandbox_runs_list_tools():
    result = asyncio.run(run_request(str(MANIFEST), {"method": "tools/list", "params": {}}, timeout=10))
    assert result.success is True
    assert result.response is not None
    assert "tools" in result.response.get("result", {})
    assert result.duration_ms >= 0


def test_sandbox_invalid_jsonrpc_target_returns_response():
    result = asyncio.run(run_request(str(MANIFEST), {"method": "no_such_method", "params": {}}, timeout=10))
    assert result.success is True


def test_sandbox_missing_manifest_fails_gracefully():
    result = asyncio.run(run_request("/no/such.json", {"method": "list_tools"}, timeout=5))
    assert result.success is False
    assert "manifest" in result.error


def test_sandbox_rejects_remote_runtime():
    manifest = json.loads(MANIFEST.read_text())
    manifest["runtime"] = {"type": "remote", "url": "https://example.com"}
    tmp = ROOT / "data" / "remote-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(json.dumps(manifest))
    try:
        result = asyncio.run(run_request(str(tmp), {"method": "list_tools"}, timeout=5))
        assert result.success is False
        assert "stdio" in result.error
    finally:
        tmp.unlink(missing_ok=True)
