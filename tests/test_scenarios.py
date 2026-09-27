def test_list_tools_scenario():
    from mcp_benchmark.scenarios.std_scenarios import list_tools_scenario
    assert "method" in list_tools_scenario and list_tools_scenario["method"] == "list_tools"
