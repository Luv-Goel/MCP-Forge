import json
from pathlib import Path
from typing import Any, Dict, Optional

SCHEMA_VERSION = "v1"

def load_manifest(path: str | Path) -> Dict[str, Any]:
    """Load and validate an mcp.package.json manifest."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    _validate(data)
    return data

def _validate(data: Dict[str, Any]) -> None:
    """Validate manifest against schema rules."""
    required = ["name", "slug", "description", "homepage", "source",
                "license", "maintainer", "primitives", "transports", "auth", "runtime"]
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    p = data.get("primitives", {})
    if not p.get("tools") and not p.get("resources") and not p.get("prompts"):
        raise ValueError("At least one primitive (tools, resources, or prompts) must be enabled")

    t = data.get("transports", [])
    if not t:
        raise ValueError("At least one transport must be specified")

    if data.get("auth", {}).get("type") == "api_key" and not data.get("auth", {}).get("env_var"):
        raise ValueError("Auth type 'api_key' requires 'env_var' to be specified")

def get_transport_summary(data: Dict[str, Any]) -> str:
    """Human-readable transport summary."""
    return ", ".join(data.get("transports", []))

def get_scopes_summary(data: Dict[str, Any]) -> str:
    """Human-readable scopes summary."""
    scopes = data.get("scopes", [])
    if not scopes:
        return "No scopes declared"
    return "; ".join(
        f"{s['name']}[{\'required\' if s.get(\'required\') else \'optional\'}]"
        for s in scopes
    )

def get_auth_summary(data: Dict[str, Any]) -> str:
    """Human-readable auth summary."""
    auth = data.get("auth", {})
    t = auth.get("type", "unknown")
    return f"{t.upper()}" + (f" (env: {auth['env_var']})" if auth.get("env_var") else "")

def serialize_manifest(data: Dict[str, Any]) -> str:
    """Serialize manifest to JSON string."""
    return json.dumps(data, indent=2, sort_keys=False)
