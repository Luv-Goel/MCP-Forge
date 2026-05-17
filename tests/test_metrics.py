def test_runner_returns_otel_style_metrics():
    import sys
    sys.path.insert(0, "packages/benchmark/src")
    from runner import BenchmarkRunner
    runner = BenchmarkRunner("schemas/mcp.package.v1.schema.json")
    result = runner.run()
    assert hasattr(result, 'latency_ms')
    assert result.latency_ms >= 0
    assert hasattr(result, 'throughput_rps')
    assert result.throughput_rps > 0
