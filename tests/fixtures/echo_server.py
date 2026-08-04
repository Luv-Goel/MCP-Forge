#!/usr/bin/env python3
"""Minimal MCP-compatible stdio server used as a benchmark fixture."""
import json
import sys
import time

CAPABILITIES = {"tools": {"listChanged": False}, "resources": {}}


def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        method = msg.get("method")
        req_id = msg.get("id")
        if method == "initialize":
            result = {"protocolVersion": "2024-11-05", "capabilities": CAPABILITIES, "serverInfo": {"name": "fixture-server", "version": "1.0.0"}}
        elif method == "list_tools":
            result = {"tools": [{"name": "echo", "description": "echo input", "inputSchema": {"type": "object"}}]}
        elif method == "read_resource":
            result = {"contents": [{"uri": msg.get("params", {}).get("uri", ""), "text": "resource"}]}
        elif method == "call_tool":
            result = {"content": [{"type": "text", "text": "ok"}]}
        elif method == "notifications/initialized":
            continue
        else:
            result = {"error": "method not found"}

        sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": req_id, "result": result}) + "\n")
        sys.stdout.flush()
        time.sleep(0.001)


if __name__ == "__main__":
    main()
