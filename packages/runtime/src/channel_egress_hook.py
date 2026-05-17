#!/usr/bin/env python3
# Layer‑7 egress hook — enforces outbound allowlists at the application layer.
import json, os, time, sys
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class EgressEvent:
    timestamp: str
    src: str
    dst: str
    proto: str
    allowed: bool
    reason: str

_ALLOWLIST = os.environ.get("MCP_EGRESS_ALLOWLIST", "").split(",")
_DENYLIST  = os.environ.get("MCP_EGRESS_DENYLIST",  "").split(",")
_LOG_FILE  = os.environ.get("MCP_EGRESS_LOG", "logs/egress.jsonl")

def log_event(event: EgressEvent):
    Path(_LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(_LOG_FILE, "a") as f:
        f.write(json.dumps(asdict(event)) + "
")

def check_egress(url: str, method: str = "GET") -> bool:
    allowed = True
    reason  = "allowlist empty → allow all"
    if _ALLOWLIST and _ALLOWLIST[0]:
        if any(url.startswith(d) for d in _ALLOWLIST):
            allowed = True; reason = "allowlisted"
        else:
            allowed = False; reason = "not in allowlist"
    if any(url.startswith(d) for d in _DENYLIST):
        allowed = False; reason = "denylisted"
    log_event(EgressEvent(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        src=os.environ.get("MCP_SERVICE_NAME", "unknown"),
        dst=url, proto=method, allowed=allowed, reason=reason
    ))
    return allowed

if __name__ == "__main__":
    for url in sys.argv[1:]:
        print(f"{url} -> {'ALLOW' if check_egress(url) else 'DENY'}")
