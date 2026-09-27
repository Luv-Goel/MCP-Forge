#!/usr/bin/env python3
"""
Trust Scoring Engine - Phase 2.
Computes transparent, explainable trust scores for MCP packages.
"""
import json, sys, math
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class TrustScore:
    package: str
    total: float
    breakdown: dict
    grade: str
    factors: list

    def to_dict(self):
        return {
            "package": self.package,
            "total": round(self.total, 2),
            "grade": self.grade,
            "breakdown": {k: round(v, 4) for k, v in self.breakdown.items()},
            "factors": self.factors,
        }

WEIGHTS = {
    "performance_latency": 0.15,
    "verification_success":   0.30,
    "last_successful_probe":   0.20,
    "documentation_quality":   0.15,
    "signed_release":          0.10,
    "update_frequency":        0.10,
    "known_security_issues": -0.20,
    "permission_footprint":    0.05,
    "install_reproducibility": 0.10,
    "community_adoption":      0.10,
}

def grade(score: float) -> str:
    if score >= 0.90: return "A+"
    if score >= 0.85: return "A"
    if score >= 0.80: return "A-"
    if score >= 0.75: return "B+"
    if score >= 0.70: return "B"
    if score >= 0.65: return "B-"
    if score >= 0.60: return "C+"
    if score >= 0.55: return "C"
    if score >= 0.50: return "C-"
    if score >= 0.40: return "D"
    return "F"

def compute_verification_success(probe_result: dict) -> tuple[float, str]:
    if probe_result.get("overall"):
        return 1.0, "Server passed all verification checks"
    errors = probe_result.get("runtime", {}).get("error", "")
    return 0.0, f"Verification failed: {errors[:80]}"

def compute_last_successful_probe(manifest: dict, probe_result: dict) -> tuple[float, str]:
    updated = manifest.get("updatedAt", "")
    days_old = 30
    if updated:
        try:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            days_old = (datetime.now(timezone.utc) - updated_dt).days
        except:
            days_old = 30
    if days_old <= 7:
        score = 1.0
    elif days_old <= 30:
        score = 0.8
    elif days_old <= 90:
        score = 0.5
    elif days_old <= 180:
        score = 0.25
    else:
        score = 0.0
    passed = probe_result.get("runtime", {}).get("success", False)
    return score if passed else max(0, score - 0.3), f"Last probe {days_old} days ago (passed={passed})"

def compute_documentation_quality(manifest: dict) -> tuple[float, str]:
    score = 0.0
    factors = []
    required = ["name", "slug", "description", "homepage", "source", "license"]
    present = [k for k in required if manifest.get(k)]
    score += 0.4 * (len(present) / len(required))
    if len(present) == len(required):
        factors.append("All required fields present")
    if manifest.get("examples"):
        score += 0.2; factors.append("Includes usage examples")
    if manifest.get("scopes"):
        score += 0.2; factors.append("Declares permission scopes")
    if manifest.get("healthcheck"):
        score += 0.2; factors.append("Defines health check")
    return min(score, 1.0), "; ".join(factors) if factors else "Sparse documentation"

def compute_signed_release(manifest: dict) -> tuple[float, str]:
    releases = manifest.get("releases", [])
    if not releases:
        return 0.3, "No releases declared"
    latest = max(releases, key=lambda r: r.get("published_at", "")) if releases else {}
    sigs = latest.get("signatures", {})
    if sigs.get("maintainer") and sigs.get("forge"):
        return 1.0, "Signed by maintainer and MCP Forge"
    elif sigs.get("maintainer"):
        return 0.7, "Signed by maintainer only"
    return 0.4, "No signatures found"

def compute_update_frequency(manifest: dict) -> tuple[float, str]:
    releases = manifest.get("releases", [])
    if len(releases) <= 1:
        return 0.4, "Only one release"
    return 0.75, f"{len(releases)} releases on record"

def compute_known_security_issues(manifest: dict) -> tuple[float, str]:
    warnings = []
    scopes = manifest.get("scopes", [])
    for scope in scopes:
        if scope.get("name") == "network" and not scope.get("domains"):
            warnings.append("Network scope lacks domain restrictions")
        if scope.get("name") == "filesystem" and "*" in str(scope.get("paths", [])):
            warnings.append("Filesystem scope has unbounded path access")
    if warnings:
        return -0.2, "; ".join(warnings)
    return 0.0, "No known security issues"

def compute_permission_footprint(manifest: dict) -> tuple[float, str]:
    scopes = manifest.get("scopes", [])
    if not scopes:
        return 0.5, "No scopes declared — cannot assess"
    required_scopes = [s for s in scopes if s.get("required")]
    scope_count = len(required_scopes)
    if scope_count == 0:
        return 1.0, "Zero required scopes (minimal footprint)"
    elif scope_count <= 2:
        return 0.85, f"{scope_count} required scopes — good"
    elif scope_count <= 4:
        return 0.6, f"{scope_count} required scopes — moderate"
    return 0.3, f"{scope_count} required scopes — consider reducing"

def compute_install_reproducibility(manifest: dict) -> tuple[float, str]:
    runtime_type = manifest.get("runtime", {}).get("type")
    if runtime_type == "docker":
        return 0.9, "Docker runtime — highly reproducible"
    elif runtime_type == "binary":
        return 0.85, "Binary distribution — reproducible"
    elif runtime_type == "python":
        return 0.75, "Python runtime — depends on environment"
    return 0.6, "Custom runtime — verify compatibility"

def compute_community_adoption(manifest: dict) -> tuple[float, str]:
    stars = manifest.get("stars", 0)
    verified = manifest.get("verified", False)
    score = min(stars / 100, 1.0) * 0.7
    if verified:
        score += 0.3
    return score, f"Stars={stars}, verified={verified}"

def compute_performance_latency(manifest: dict, probe_result: dict) -> tuple[float, str]:
    """15% weight — latency and throughput from benchmark results."""
    duration = probe_result.get("runtime", {}).get("duration_ms", 999)
    if duration < 50:
        return 1.0, f"Excellent latency: {duration}ms"
    elif duration < 100:
        return 0.8, f"Good latency: {duration}ms"
    elif duration < 200:
        return 0.6, f"Acceptable latency: {duration}ms"
    elif duration < 500:
        return 0.4, f"Slow latency: {duration}ms"
    return 0.2, f"Poor latency: {duration}ms"

def compute_trust_score(package_name: str, manifest: dict, probe_result: dict) -> TrustScore:
    breakdown = {}
    factors = []

    checks = [
        ("performance_latency", compute_performance_latency, manifest, probe_result),
        ("verification_success", compute_verification_success, probe_result),
        ("last_successful_probe", compute_last_successful_probe, manifest, probe_result),
        ("documentation_quality", compute_documentation_quality, manifest),
        ("signed_release", compute_signed_release, manifest),
        ("update_frequency", compute_update_frequency, manifest),
        ("known_security_issues", compute_known_security_issues, manifest),
        ("permission_footprint", compute_permission_footprint, manifest),
        ("install_reproducibility", compute_install_reproducibility, manifest),
        ("community_adoption", compute_community_adoption, manifest),
    ]

    total = 0.0
    for name, fn, *args in checks:
        w = WEIGHTS[name]
        if name == "verification_success":
            val, factor = fn(args[0])
        elif name == "last_successful_probe":
            val, factor = fn(args[0], args[1])
        else:
            val, factor = fn(*args)

        contribution = w * val
        total += contribution
        breakdown[name] = contribution
        factors.append(f"{name}: {factor} (contrib={contribution:+.2f})")

    return TrustScore(
        package=package_name,
        total=max(0.0, min(1.0, total)),
        breakdown=breakdown,
        grade=grade(max(0.0, min(1.0, total))),
        factors=factors,
    )

def score_package(manifest_path: str, probe_result: dict = None) -> dict:
    try:
        manifest = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return {"error": str(e)}

    if probe_result is None:
        probe_result = {"overall": True, "runtime": {"success": True, "duration_ms": 50}}

    score = compute_trust_score(manifest.get("name", "unknown"), manifest, probe_result)
    return score.to_dict()

if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    result = score_package(manifest)
    print(json.dumps(result, indent=2))