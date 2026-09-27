import json
from pathlib import Path

def load_manifest(path):
    p = Path(path)
    with open(p) as f:
        return json.load(f)
