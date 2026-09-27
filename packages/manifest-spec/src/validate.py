"""Manifest loading and validation for MCP Forge.

Provides `load_manifest` (robust JSON parsing) and `validate_manifest`
(JSON Schema + semantic validation) for MCP package manifests.
"""
import json
import os
from pathlib import Path

try:
    import jsonschema
except ImportError:  # pragma: no cover
    jsonschema = None

SCHEMA_PATH = Path(__file__).resolve().parent.parent.parent.parent / "schemas" / "mcp.package.v1.schema.json"

_schema_cache = None


def load_schema(path=None) -> dict:
    """Load (and cache) the manifest JSON Schema."""
    global _schema_cache
    if _schema_cache is not None:
        return _schema_cache
    schema_file = Path(path) if path else SCHEMA_PATH
    _schema_cache = json.loads(schema_file.read_text())
    return _schema_cache


def load_manifest(path):
    """Load a manifest from a file path. Raises on parse errors."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    return json.loads(p.read_text())


class ValidationResult:
    """Container for validation results with structured error reporting."""

    def __init__(self, valid, errors=None, warnings=None, schema=None):
        self.valid = valid
        self.errors = errors or []
        self.warnings = warnings or []
        self.schema = schema

    def to_dict(self):
        return {
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "schema": self.schema,
        }


def _semantic_checks(manifest: dict) -> tuple[list, list]:
    """Cross-field semantic checks that JSON Schema cannot express."""
    errors, warnings = [], []

    transports = set(manifest.get("transports", []))
    runtime_type = manifest.get("runtime", {}).get("type")

    # Runtime/transport coherence
    if runtime_type == "remote" and not manifest.get("runtime", {}).get("url"):
        errors.append("runtime.type 'remote' requires a 'runtime.url'")
    if runtime_type in ("stdio", "python", "binary") and not manifest.get("runtime", {}).get("entrypoint"):
        errors.append(f"runtime.type '{runtime_type}' requires a 'runtime.entrypoint'")
    if runtime_type == "docker" and not manifest.get("runtime", {}).get("image"):
        errors.append("runtime.type 'docker' requires a 'runtime.image'")
    if runtime_type in ("stdio", "python", "binary", "docker") and "streamable-http" in transports:
        warnings.append("streamable-http transport declared but runtime is not remote - verify server supports it")

    # Auth/env coherence
    auth_type = manifest.get("auth", {}).get("type")
    if auth_type == "api_key" and not manifest.get("auth", {}).get("env_var"):
        errors.append("auth.type 'api_key' should declare 'auth.env_var'")
    if auth_type in ("api_key", "bearer", "oauth") and manifest.get("auth", {}).get("required"):
        env_map = manifest.get("runtime", {}).get("env", {})
        if not any(v == "required" for v in env_map.values()):
            warnings.append("required auth declared but no runtime env vars marked 'required'")

    # Scope sanity
    for scope in manifest.get("scopes", []):
        name = scope.get("name")
        if name == "filesystem" and not scope.get("paths") and not scope.get("required") is False:
            warnings.append("filesystem scope has no declared paths")
        if name == "network" and not scope.get("domains"):
            warnings.append("network scope has no domain restrictions")

    # Release sanity
    releases = manifest.get("releases", [])
    versions = [r.get("version") for r in releases if r.get("version")]
    if len(versions) != len(set(versions)):
        errors.append("duplicate release versions declared")
    for r in releases:
        if r.get("published_at") and not r.get("version"):
            errors.append("release with published_at must declare a version")

    return errors, warnings


def validate_manifest(manifest: dict, schema_path=None) -> ValidationResult:
    """Validate a manifest dict against the schema plus semantic checks."""
    schema = load_schema(schema_path)

    if jsonschema is None:
        errors = ["jsonschema library not installed - cannot validate"]
        return ValidationResult(False, errors, [], schema="mcp.package.v1")

    errors, warnings = [], []
    try:
        validator = jsonschema.Draft7Validator(schema)
        for err in sorted(validator.iter_errors(manifest), key=lambda e: list(e.path)):
            errors.append(f"{'.'.join(str(p) for p in err.path) or '(root)'}: {err.message}")
    except Exception as exc:  # pragma: no cover
        errors.append(f"schema validation error: {exc}")

    sem_errors, sem_warnings = _semantic_checks(manifest)
    errors.extend(sem_errors)
    warnings.extend(sem_warnings)

    return ValidationResult(valid=len(errors) == 0, errors=errors, warnings=warnings, schema="mcp.package.v1")


def validate_manifest_file(path: str, schema_path=None) -> ValidationResult:
    """Convenience wrapper: load a manifest from disk and validate it."""
    try:
        manifest = load_manifest(path)
    except Exception as exc:
        return ValidationResult(False, [f"failed to load manifest: {exc}"], [], schema="mcp.package.v1")
    return validate_manifest(manifest, schema_path)


def get_default_schema_path():
    """Resolve the schema path for this checkout, or fall back to SCHEMA_PATH."""
    return str(SCHEMA_PATH if SCHEMA_PATH.exists() else Path(os.path.join(os.path.dirname(__file__), "schema.json")))
