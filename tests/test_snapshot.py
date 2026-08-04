import importlib.util
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_BIN = ROOT / "cli" / "bin" / "mcp-snapshot"


def _load_snapshot():
    source = SNAPSHOT_BIN.read_text()
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
        tmp.write(source)
        tmp_path = tmp.name
    try:
        spec = importlib.util.spec_from_file_location("mcp_snapshot", tmp_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    finally:
        os.unlink(tmp_path)


def test_snapshot_creates_real_manifest_hash():
    mod = _load_snapshot()
    manifest = ROOT / "examples" / "mcp.package.json"
    snap = mod.create_snapshot(str(manifest))
    assert len(snap["manifest_hash"]) == 64
    # The old bug produced the SHA-256 of empty bytes; must not happen.
    assert snap["manifest_hash"] != "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    assert snap["name"] == "Filesystem Tools"
    assert snap["slug"] == "filesystem-tools"
    assert snap["scopes"] == ["filesystem"]
    assert snap["runtime"]["entrypoint"] == ["uv", "run", "mcp-filesystem"]


def test_snapshot_returns_error_for_missing_manifest():
    mod = _load_snapshot()
    snap = mod.create_snapshot("/no/such.json")
    assert "error" in snap


def test_snapshot_hash_changes_with_content():
    mod = _load_snapshot()
    manifest = ROOT / "examples" / "mcp.package.json"
    a = mod.create_snapshot(str(manifest))
    b = mod.create_snapshot(str(ROOT / "examples" / "echo-server.mcp.package.json"))
    assert a["manifest_hash"] != b["manifest_hash"]
