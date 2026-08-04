import asyncio
import json
from pathlib import Path

from probe import run_probe
from sandbox import run_request

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "examples" / "echo-server.mcp.package.json"


def test_probe_enumerates_tools():
    result = run_probe(str(MANIFEST))
    assert result["overall"] is True
    runtime = result["runtime"]
    assert runtime["success"] is True
    assert isinstance(runtime["tools"], list)
    names = [t.get("name") for t in runtime["tools"]]
    assert "echo" in names


def test_probe_detects_server_error_on_initialize():
    import json as _json

    bad = _json.loads(MANIFEST.read_text())
    bad["runtime"] = {"type": "stdio", "entrypoint": ["python3", "-c", "import sys; sys.stdout.write(_json.dumps({'jsonrpc':'2.0','id':1,'error':{'code':-32600,'message':'bad'}}))"]}
    tmp = ROOT / "data" / "probe-error-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    # Use a fixture that responds with an error to initialize
    broken = ROOT / "data" / "probe-error-server.py"
    broken.write_text(
        "import json,sys\n"
        "line = sys.stdin.readline()\n"
        "msg = json.loads(line)\n"
        "print(json.dumps({'jsonrpc':'2.0','id':msg.get('id'),'error':{'code':-32600,'message':'rejected'}}))\n"
        "sys.stdout.flush()\n"
    )
    tmp.write_text(_json.dumps({
        "name": "broken",
        "slug": "broken-server",
        "description": "A server that rejects initialize with a protocol error.",
        "runtime": {"type": "stdio", "entrypoint": ["python3", str(broken)]},
    }))
    try:
        result = run_probe(str(tmp))
        assert result["overall"] is False
        assert "initialize" in result["runtime"]["error"]
    finally:
        tmp.unlink(missing_ok=True)
        broken.unlink(missing_ok=True)


def test_sandbox_performs_initialize_handshake():
    result = asyncio.run(run_request(str(MANIFEST), {"method": "tools/list", "params": {}}, timeout=10))
    assert result.success is True
    msgs = [log["message"] for log in result.logs]
    assert any("initialize" in m for m in msgs)
    assert "tools" in result.response.get("result", {})


def test_sandbox_without_handshake_still_succeeds_on_fixture():
    result = asyncio.run(run_request(str(MANIFEST), {"method": "tools/call", "params": {"name": "echo", "arguments": {}}}, timeout=10))
    assert result.success is True
    assert result.response.get("result", {}).get("content") is not None
