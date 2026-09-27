#!/usr/bin/env python3
# Layer-7 egress hook - enforces outbound allowlists at the application layer.
import json
import os
import time
import sys
from pathlib import Path
from dataclasses import dataclass, asdict
from urllib.parse import urlparse

@dataclass
class EgressEvent:
    timestamp: str
    src: str
    dst: str
    proto: str
    allowed: bool
    reason: str

_ALLOWLIST = [d for d in os.environ.get("MCP_EGRESS_ALLOWLIST", "").split(",") if d]
_DENYLIST = [d for d in os.environ.get("MCP_EGRESS_DENYLIST", "").split(",") if d]
_LOG_FILE = os.environ.get("MCP_EGRESS_LOG", "logs/egress.jsonl")


def _normalize(target: str) -> str:
    """Extract a comparable host/prefix from a URL or bare host."""
    target = target.strip().rstrip("/")
    if "://" in target:
        return urlparse(target).netloc or target
    return target


def log_event(event: EgressEvent) -> None:
    Path(_LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(_LOG_FILE, "a") as f:
        f.write(json.dumps(asdict(event)) + "\n")


def _match_host(target: str, entry: str) -> bool:
    """Match a normalized target against a host entry (entry matches its subdomains)."""
    entry = entry.rstrip(".")
    return target == entry or target.endswith("." + entry)


def check_egress(url: str, method: str = "GET") -> bool:
    """Decide whether an outbound request is permitted.

    Priority: denylist wins over allowlist. An empty allowlist permits all
    egress (with an audit log entry); a non-empty allowlist denies anything
    not explicitly listed. Entries match their subdomains.
    """
    target = _normalize(url)
    allowed = True
    reason = "allowlist empty -> allow all"

    if _ALLOWLIST:
        if any(_match_host(target, d) for d in _ALLOWLIST):
            allowed = True
            reason = "allowlisted"
        else:
            allowed = False
            reason = "not in allowlist"

    if any(_match_host(target, d) for d in _DENYLIST):
        allowed = False
        reason = "denylisted"

    log_event(EgressEvent(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        src=os.environ.get("MCP_SERVICE_NAME", "unknown"),
        dst=url, proto=method, allowed=allowed, reason=reason,
    ))
    return allowed


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    for url in sys.argv[1:]:
        print(f"{url} -> {'ALLOW' if check_egress(url) else 'DENY'}")
