import importlib.util
import os
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOOK = ROOT / "packages" / "runtime" / "src" / "channel_egress_hook.py"

_VARS = ("MCP_EGRESS_ALLOWLIST", "MCP_EGRESS_DENYLIST", "MCP_EGRESS_LOG")


def _load_hook(env_allow="", env_deny=""):
    source = HOOK.read_text()
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp:
        tmp.write(source)
        tmp_path = tmp.name

    saved = {v: os.environ.get(v) for v in _VARS}
    os.environ["MCP_EGRESS_ALLOWLIST"] = env_allow
    os.environ["MCP_EGRESS_DENYLIST"] = env_deny
    os.environ["MCP_EGRESS_LOG"] = str(ROOT / "data" / "test-egress.jsonl")
    try:
        spec = importlib.util.spec_from_file_location("egress_hook", tmp_path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    finally:
        for v, val in saved.items():
            if val is None:
                os.environ.pop(v, None)
            else:
                os.environ[v] = val
        os.unlink(tmp_path)


def test_module_parses_and_imports():
    mod = _load_hook()
    assert callable(mod.check_egress)


def test_empty_allowlist_allows_all():
    mod = _load_hook()
    assert mod.check_egress("https://anything.example/x") is True


def test_allowlist_denies_non_matching():
    mod = _load_hook(env_allow="api.example.com")
    assert mod.check_egress("https://api.example.com/v1") is True
    assert mod.check_egress("https://evil.example.com") is False


def test_denylist_wins_over_allowlist():
    mod = _load_hook(env_allow="api.example.com", env_deny="api.example.com")
    assert mod.check_egress("https://api.example.com/v1") is False


def test_subdomain_matching():
    mod = _load_hook(env_allow="example.com")
    assert mod.check_egress("https://sub.example.com/path") is True
    assert mod.check_egress("https://notexample.com") is False
