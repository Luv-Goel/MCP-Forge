def test_runner_accepts_manifest_path():
    from mcp_benchmark.runner import BenchmarkRunner
    runner = BenchmarkRunner("mcp.package.json")
    assert runner.manifest_path.endswith("mcp.package.json")
