import importlib.util
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_cli(name: str, bin_path: Path):
    source = bin_path.read_text()
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
        tmp.write(source)
        tmp_path = tmp.name
    try:
        spec = importlib.util.spec_from_file_location(name, tmp_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    finally:
        os.unlink(tmp_path)


def test_mcp_compat_analyzes_example():
    mod = _load_cli("mcp_compat", ROOT / "cli" / "bin" / "mcp-compat")
    # analyze_package comes from the client-templates package (already importable)
    from compat import analyze_package

    report = analyze_package(str(ROOT / "examples" / "mcp.package.json"))
    assert report["package"] == "Filesystem Tools"
    assert "custom-runtime" in report["compatible_clients"]
    assert isinstance(report["matrix"], dict)
    assert "claude-desktop" in report["matrix"]


def test_mcp_security_reports_on_example():
    from analyze import analyze_manifest

    report = analyze_manifest(str(ROOT / "examples" / "echo-server.mcp.package.json"))
    assert report.passed is True
    assert report.summary["level"] == "CLEAN"
    codes = [f.code for f in report.findings]
    assert "AUTH_NONE" in codes


def test_mcp_security_flags_docker_latest():
    import json as _json

    from analyze import analyze_manifest

    manifest = {
        "name": "unpinned",
        "auth": {"type": "none"},
        "runtime": {"type": "docker", "image": "example/server:latest"},
        "scopes": [{"name": "network", "domains": ["api.example.com"]}],
    }
    tmp = ROOT / "data" / "sec-docker-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(_json.dumps(manifest))
    try:
        report = analyze_manifest(str(tmp))
        codes = [f.code for f in report.findings]
        assert "DOCKER_TAG" in codes
        assert report.summary["level"] == "WARNING"
    finally:
        tmp.unlink(missing_ok=True)
