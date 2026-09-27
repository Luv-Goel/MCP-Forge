#!/usr/bin/env python3
# NPM-style vuln check adapter: wraps mcp-validate output + trust score
import json, subprocess, sys

def run_audit(manifest_path: str, mcp_validate: str = "mcp-validate") -> dict:
    try:
        r = subprocess.run([mcp_validate, manifest_path], capture_output=True, text=True, timeout=30)
        audits = {"stdout": r.stdout, "stderr": r.stderr, "returncode": r.returncode}
    except Exception as e:
        audits = {"stdout": "", "stderr": str(e), "returncode": -1}
    # TODO: hook into trust scoring
    return audits

if __name__ == "__main__":
    m = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    print(json.dumps(run_audit(m), indent=2))
