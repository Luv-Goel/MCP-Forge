#!/usr/bin/env python3
"""Standard MCP benchmark scenarios."""
list_tools_scenario = {
    "jsonrpc": "2.0", "id": 1, "method": "list_tools", "params": {}
}
call_tool_scenario = lambda tool_name: {
    "jsonrpc": "2.0", "id": 1, "method": "call_tool",
    "params": {"name": tool_name, "arguments": {}}
}
read_resource_scenario = lambda uri: {
    "jsonrpc": "2.0", "id": 1, "method": "read_resource",
    "params": {"uri": uri}
}
