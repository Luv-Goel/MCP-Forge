def test_runner_returns_otel_style_metrics():
    import sys
    sys.path.insert(0, "packages/benchmark/src")
    from runner import BenchmarkRunner
    runner = BenchmarkRunner("examples/echo-server.mcp.package.json", iterations=10)
    result = runner.run()
    assert hasattr(result, 'latency_ms')
    assert result.latency_ms >= 0
    assert hasattr(result, 'throughput_rps')
    assert result.throughput_rps > 0
    assert hasattr(result, 'latency_p95_ms')
    assert hasattr(result, 'latency_p99_ms')
    assert result.error_rate == 0.0
