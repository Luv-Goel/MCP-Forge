#!/usr/bin/env python3
"""Standard MCP benchmark scenarios (spec-compliant method names)."""
list_tools_scenario = {
    "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}
}
call_tool_scenario = lambda tool_name: {
    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
    "params": {"name": tool_name, "arguments": {}}
}
read_resource_scenario = lambda uri: {
    "jsonrpc": "2.0", "id": 1, "method": "resources/read",
    "params": {"uri": uri}
}
