from score import compute_trust_score, score_package, grade
from analyze import analyze_manifest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def test_trust_score_includes_latency():
    manifest = {"name": "test", "primitives": {}, "runtime": {}}
    probe = {"overall": True, "runtime": {"success": True, "duration_ms": 50}}
    result = compute_trust_score("test", manifest, probe)
    assert "performance_latency" in result.breakdown
    assert result.breakdown["performance_latency"] == 0.12


def test_grade_boundaries():
    assert grade(0.95) == "A+"
    assert grade(0.72) == "B"
    assert grade(0.42) == "D"
    assert grade(0.1) == "F"


def test_score_package_on_example():
    result = score_package(str(ROOT / "examples" / "mcp.package.json"))
    assert 0 <= result["total"] <= 1
    assert result["grade"] in ("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F")
    assert len(result["factors"]) >= 5


def test_score_package_missing_manifest():
    result = score_package("/no/such.json")
    assert "error" in result


def test_security_report_detects_unbounded_network_scope():
    manifest = {
        "name": "risky",
        "auth": {"type": "none"},
        "runtime": {"type": "docker", "image": "example/server:latest"},
        "scopes": [{"name": "network", "required": True, "domains": []}],
    }
    tmp = ROOT / "data" / "risky-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(__import__("json").dumps(manifest))
    try:
        report = analyze_manifest(str(tmp))
        codes = [f.code for f in report.findings]
        assert "NETWORK_NO_DOMAINS" in codes
        assert "DOCKER_TAG" in codes
        assert report.summary["level"] == "WARNING"
        assert report.passed is True
    finally:
        tmp.unlink(missing_ok=True)


def test_filesystem_wildcard_is_detected_in_any_path():
    import json as _json

    manifest = {
        "name": "wildcard-fs",
        "auth": {"type": "none"},
        "runtime": {"type": "stdio", "entrypoint": ["python3", "-m", "server"]},
        "scopes": [{"name": "filesystem", "paths": ["/data/**"]}],
    }
    tmp = ROOT / "data" / "fs-wildcard-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(_json.dumps(manifest))
    try:
        report = analyze_manifest(str(tmp))
        codes = [f.code for f in report.findings]
        assert "FS_ROOT_ESCAPE" in codes
    finally:
        tmp.unlink(missing_ok=True)


def test_filesystem_root_path_is_flagged():
    import json as _json

    manifest = {
        "name": "root-fs",
        "auth": {"type": "none"},
        "runtime": {"type": "stdio", "entrypoint": ["python3", "-m", "server"]},
        "scopes": [{"name": "filesystem", "paths": ["/"]}],
    }
    tmp = ROOT / "data" / "fs-root-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(_json.dumps(manifest))
    try:
        report = analyze_manifest(str(tmp))
        codes = [f.code for f in report.findings]
        assert "FS_ROOT_ACCESS" in codes
    finally:
        tmp.unlink(missing_ok=True)


def test_absolute_nonroot_path_is_not_flagged():
    import json as _json

    manifest = {
        "name": "safe-fs",
        "auth": {"type": "none"},
        "runtime": {"type": "stdio", "entrypoint": ["python3", "-m", "server"]},
        "scopes": [{"name": "filesystem", "paths": ["/data"], "required": True}],
    }
    tmp = ROOT / "data" / "fs-safe-tmp.json"
    tmp.parent.mkdir(exist_ok=True)
    tmp.write_text(_json.dumps(manifest))
    try:
        report = analyze_manifest(str(tmp))
        codes = [f.code for f in report.findings]
        assert "FS_ROOT_ACCESS" not in codes
        assert "FS_ROOT_ESCAPE" not in codes
    finally:
        tmp.unlink(missing_ok=True)
