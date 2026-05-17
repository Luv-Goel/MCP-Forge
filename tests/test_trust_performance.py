def test_trust_score_includes_latency():
    import sys
    sys.path.insert(0, "packages/scoring/src")
    from score import compute_trust_score
    manifest = {"name": "test", "primitives": {}, "runtime": {}}
    # 50ms falls into "Good latency" (0.8 * 0.15 = 0.12)
    probe = {"overall": True, "runtime": {"success": True, "duration_ms": 50}}
    result = compute_trust_score("test", manifest, probe)
    assert "performance_latency" in result.breakdown
    # 50ms -> good latency (0.8) -> contribution = 0.8 * 0.15 = 0.12
    assert result.breakdown["performance_latency"] == 0.12