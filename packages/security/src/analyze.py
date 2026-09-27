#!/usr/bin/env python3
"""
Security Policy Analysis - Phase 2.
Provides least-privilege warnings, SSRF detection, and scope analysis.
"""
import json, sys, re, ipaddress
from pathlib import Path
from dataclasses import dataclass, asdict

@dataclass
class SecurityFinding:
    level: str  # "info", "warning", "critical"
    code: str
    message: str
    path: str = ""

@dataclass
class SecurityReport:
    package: str
    findings: list
    summary: dict
    passed: bool

PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("224.0.0.0/4"),  # multicast
    ipaddress.ip_network("240.0.0.0/4"),  # reserved
]

def is_private_ip(ip: str) -> bool:
    """Check if an IP is in private/non-routable ranges."""
    try:
        addr = ipaddress.ip_address(ip)
        return any(addr in net for net in PRIVATE_RANGES)
    except ValueError:
        return False

def analyze_scope(scope: dict) -> list:
    """Analyze a single scope for security issues."""
    findings = []
    name = scope.get("name", "unknown")

    # Network scope analysis
    if name == "network":
        domains = scope.get("domains", [])
        if not domains:
            findings.append(SecurityFinding(
                level="warning", code="NETWORK_NO_DOMAINS",
                message="Network scope has no domain restrictions — allows arbitrary egress",
                path=".scopes[].name=network"
            ))
        
        # Check for 0.0.0.0 or wildcard patterns
        for d in domains:
            if "0.0.0.0" in d or "*" in d:
                findings.append(SecurityFinding(
                    level="critical", code="NETWORK_WILDCARD",
                    message=f"Network scope contains dangerous pattern: {d}",
                    path=".scopes[].domains"
                ))

    # Filesystem scope analysis
    if name == "filesystem":
        paths = scope.get("paths", []) or []
        if any("*" in p for p in paths) or any(".." in p for p in paths):
            findings.append(SecurityFinding(
                level="critical", code="FS_ROOT_ESCAPE",
                message="Filesystem scope contains unsafe path pattern (wildcard or '..')",
                path=".scopes[].paths"
            ))
        if any(p.strip() in ("/", "//") for p in paths):
            findings.append(SecurityFinding(
                level="warning", code="FS_ROOT_ACCESS",
                message="Filesystem scope grants access to the filesystem root",
                path=".scopes[].paths"
            ))

    return findings

def analyze_manifest(manifest_path: str) -> SecurityReport:
    """Run security analysis on a manifest."""
    try:
        manifest = json.loads(Path(manifest_path).read_text())
    except Exception as e:
        return SecurityReport(
            package="unknown",
            findings=[SecurityFinding("critical", "PARSE_ERROR", str(e))],
            summary={"level": "CRITICAL"},
            passed=False,
        )

    findings = []
    scopes = manifest.get("scopes", [])

    # 1. Scope analysis
    for scope in scopes:
        findings.extend(analyze_scope(scope))

    # 2. Auth analysis
    auth = manifest.get("auth", {})
    if auth.get("type") == "none":
        findings.append(SecurityFinding(
            level="info", code="AUTH_NONE",
            message="Server requires no authentication — ensure network isolation",
            path=".auth.type"
        ))

    # 3. Network analysis
    runtime = manifest.get("runtime", {})
    if runtime.get("network", {}).get("required"):
        domains = runtime.get("network", {}).get("egress", {}).get("domains", [])
        
        # Check for SSRF-vulnerable domains
        ssrf_patterns = ["api.ipify.org", "httpbin.org", "ifconfig.co"]
        for d in domains:
            for p in ssrf_patterns:
                if p in d.lower():
                    findings.append(SecurityFinding(
                        level="warning", code="SSRF_RISK",
                        message=f"Domain {d} may be used for SSRF testing",
                        path=".runtime.network.egress.domains"
                    ))

    # 4. Runtime type analysis
    rt_type = runtime.get("type")
    if rt_type == "remote":
        findings.append(SecurityFinding(
            level="info", code="REMOTE_SERVER",
            message="Remote server — ensure HTTPS and auth in production"
        ))

    # 5. Container analysis
    if rt_type == "docker":
        image = runtime.get("image", "")
        if ":latest" in image or not image:
            findings.append(SecurityFinding(
                level="warning", code="DOCKER_TAG",
                message="Docker image should use pinned digest, not :latest",
                path=".runtime.image"
            ))

    # Summarize
    critical_count = sum(1 for f in findings if f.level == "critical")
    warning_count = sum(1 for f in findings if f.level == "warning")
    info_count = sum(1 for f in findings if f.level == "info")

    level = "CLEAN"
    if critical_count > 0:
        level = "CRITICAL"
    elif warning_count > 0:
        level = "WARNING"

    return SecurityReport(
        package=manifest.get("name", "unknown"),
        findings=findings,
        summary={
            "level": level,
            "critical": critical_count,
            "warnings": warning_count,
            "info": info_count,
        },
        passed=critical_count == 0,
    )

def print_report(report: SecurityReport):
    """Print a security report."""
    print(f"Security Report: {report.package}")
    print(f"Overall: {report.summary['level']} ({report.summary['critical']} critical, {report.summary['warnings']} warnings)\n")

    for finding in report.findings:
        prefix = {"critical": "🚨", "warning": "⚠️", "info": "ℹ️"}[finding.level]
        print(f"  {prefix} [{finding.level.upper()}] {finding.code}: {finding.message}")

    print(f"\nConclusion: {'PASS' if report.passed else 'FAIL'}")

if __name__ == "__main__":
    manifest = sys.argv[1] if len(sys.argv) > 1 else "mcp.package.json"
    report = analyze_manifest(manifest)
    print_report(report)