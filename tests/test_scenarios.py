from scenarios.std_scenarios import list_tools_scenario, call_tool_scenario, read_resource_scenario


def test_list_tools_scenario():
    assert "method" in list_tools_scenario
    assert list_tools_scenario["method"] == "tools/list"


def test_call_tool_scenario():
    s = call_tool_scenario("my_tool")
    assert s["method"] == "tools/call"
    assert s["params"]["name"] == "my_tool"
    assert isinstance(s["params"]["arguments"], dict)


def test_read_resource_scenario():
    s = read_resource_scenario("file:///data")
    assert s["method"] == "resources/read"
    assert s["params"]["uri"] == "file:///data"
