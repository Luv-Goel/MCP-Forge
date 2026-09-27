from runner import BenchmarkRunner
from dataclasses import asdict


def test_runner_accepts_manifest_path():
    runner = BenchmarkRunner("mcp.package.json")
    assert runner.manifest_path.endswith("mcp.package.json")


def test_runner_benchmarks_real_stdio_server():
    runner = BenchmarkRunner("examples/echo-server.mcp.package.json", iterations=20)
    result = runner.run()
    assert result.success
    assert result.error == ""
    assert result.transport == "stdio"
    assert result.latency_ms >= 0
    assert result.throughput_rps > 0
    assert result.error_rate == 0.0
    assert result.requests == 20


def test_runner_reports_missing_manifest():
    runner = BenchmarkRunner("does/not/exist.json")
    result = runner.run()
    assert not result.success
    assert result.error != ""


def test_runner_result_serializable():
    runner = BenchmarkRunner("examples/echo-server.mcp.package.json", iterations=5)
    result = runner.run()
    d = asdict(result)
    assert set(d) == {
        "latency_ms", "latency_p95_ms", "latency_p99_ms", "throughput_rps",
        "error_rate", "requests", "errors", "transport", "success", "error",
    }
