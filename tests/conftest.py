"""Shared pytest fixtures and path setup for the MCP Forge test suite."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PACKAGE_SRC = [
    ROOT / "packages" / "manifest-spec" / "src",
    ROOT / "packages" / "runtime" / "src",
    ROOT / "packages" / "scoring" / "src",
    ROOT / "packages" / "security" / "src",
    ROOT / "packages" / "client-templates" / "src",
    ROOT / "packages" / "benchmark" / "src",
]

for p in PACKAGE_SRC:
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

os.environ.setdefault("DATA_FILE", str(ROOT / "data" / "packages.json"))
