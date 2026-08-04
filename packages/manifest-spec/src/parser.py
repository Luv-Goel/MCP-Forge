import json
from pathlib import Path

def load_manifest(path):
    """Load a manifest from a file path, with a helpful error for missing files."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    with open(p) as f:
        return json.load(f)
