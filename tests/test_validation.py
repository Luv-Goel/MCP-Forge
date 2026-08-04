from validate import validate_manifest, validate_manifest_file, load_manifest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent

VALID = {
    "name": "Test Server",
    "slug": "test-server",
    "description": "A fully valid test manifest with enough description length.",
    "transports": ["stdio"],
    "primitives": {"tools": True},
    "auth": {"type": "none"},
    "runtime": {"type": "python", "entrypoint": ["python3", "-m", "server"]},
    "scopes": [{"name": "filesystem", "required": True, "paths": ["/data"]}],
    "releases": [{"version": "1.0.0", "published_at": "2026-01-01T00:00:00Z"}],
}


def test_valid_manifest_passes():
    result = validate_manifest(VALID)
    assert result.valid is True
    assert result.errors == []


def test_invalid_slug_is_rejected():
    bad = {**VALID, "slug": "Bad Slug!"}
    result = validate_manifest(bad)
    assert result.valid is False
    assert any("slug" in e for e in result.errors)


def test_missing_required_fields():
    result = validate_manifest({"name": "x"})
    assert result.valid is False
    assert any("'slug'" in e for e in result.errors)


def test_semantic_check_remote_requires_url():
    bad = {**VALID, "runtime": {"type": "remote"}, "transports": ["streamable-http"]}
    result = validate_manifest(bad)
    assert result.valid is False
    assert any("runtime.url" in e for e in result.errors)


def test_semantic_check_docker_requires_image():
    bad = {**VALID, "runtime": {"type": "docker"}}
    result = validate_manifest(bad)
    assert result.valid is False
    assert any("runtime.image" in e for e in result.errors)


def test_duplicate_release_versions():
    bad = {
        **VALID,
        "releases": [
            {"version": "1.0.0", "published_at": "2026-01-01T00:00:00Z"},
            {"version": "1.0.0", "published_at": "2026-02-01T00:00:00Z"},
        ],
    }
    result = validate_manifest(bad)
    assert result.valid is False
    assert any("duplicate release" in e for e in result.errors)


def test_validate_example_manifest_file():
    result = validate_manifest_file(str(ROOT / "examples" / "mcp.package.json"))
    assert result.valid is True, result.errors


def test_validate_missing_file_reports_error():
    result = validate_manifest_file("/no/such/manifest.json")
    assert result.valid is False
    assert any("failed to load" in e for e in result.errors)


def test_load_manifest_raises_for_missing():
    import pytest

    with pytest.raises(FileNotFoundError):
        load_manifest("/no/such/manifest.json")
