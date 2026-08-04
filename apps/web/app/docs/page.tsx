import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DOCS = [
    {
        title: 'Manifest Specification',
        href: '#manifest',
        description: 'The mcp.package.json format: transports, primitives, scopes, runtime, and releases.',
    },
    {
        title: 'CLI Tools',
        href: '#cli',
        description: 'mcp-validate, mcp-probe, mcp-score, mcp-snapshot, mcp-benchmark, mcp-generate, mcp-compat, and mcp-security.',
    },
    {
        title: 'Trust Score',
        href: '#trust',
        description: 'How the explainable trust score is computed and what each factor means.',
    },
    {
        title: 'Security Model',
        href: '#security',
        description: 'Scope analysis, SSRF detection, least-privilege enforcement, and the sandbox.',
    },
];

export default function DocsPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Documentation</h1>
                <p className="mt-1 text-gray-600">Everything you need to publish, validate, and operate MCP servers with MCP Forge.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {DOCS.map((doc) => (
                    <Card key={doc.href} className="transition-shadow hover:shadow-md">
                        <CardHeader>
                            <CardTitle><a href={doc.href} className="hover:underline">{doc.title}</a></CardTitle>
                            <CardDescription>{doc.description}</CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <Card id="manifest">
                <CardHeader>
                    <CardTitle>Manifest Specification <Badge variant="secondary">v1</Badge></CardTitle>
                    <CardDescription>The core of every MCP Forge package.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                    <p>Every package declares a <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">mcp.package.json</code> with:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>identity</strong> - name, slug, description, homepage, license</li>
                        <li><strong>capabilities</strong> - transports (stdio, streamable-http, sse) and primitives (tools, prompts, resources, sampling)</li>
                        <li><strong>runtime</strong> - how the server is launched: entrypoint, image, URL, or remote endpoint</li>
                        <li><strong>scopes</strong> - declared permissions: filesystem paths, network domains, env access</li>
                        <li><strong>releases</strong> - versioned snapshots with signatures and changelogs</li>
                    </ul>
                    <div className="mt-4">
                        <Link href="/packages" className="text-sm text-navy hover:underline">Browse example packages to see manifests in action.</Link>
                    </div>
                </CardContent>
            </Card>

            <Card id="cli">
                <CardHeader>
                    <CardTitle>CLI Tools</CardTitle>
                    <CardDescription>Validate, probe, score, benchmark, and generate install configs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                    <pre className="overflow-x-auto rounded-lg bg-navy p-4 text-xs text-green-300">
{`# Validate a manifest against the schema
mcp-validate mcp.package.json

# Probe the runtime (launches the server, sends initialize)
mcp-probe mcp.package.json

# Compute an explainable trust score
mcp-score mcp.package.json --probe probe.json

# Create a reproducible release snapshot
mcp-snapshot mcp.package.json --output snapshot.json

# Benchmark latency/throughput against the real server
mcp-benchmark mcp.package.json --iterations 200 --verbose

# Generate install configs for every supported client
mcp-generate mcp.package.json --output-dir ./configs

# Analyze compatibility across clients
mcp-compat mcp.package.json

# Run security policy analysis
mcp-security mcp.package.json`}
                    </pre>
                </CardContent>
            </Card>

            <Card id="trust">
                <CardHeader>
                    <CardTitle>Trust Score</CardTitle>
                    <CardDescription>An explainable 0-100 grade built from transparent factors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                    <p>The score weights ten factors:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>verification_success (30%)</strong> - did the server pass runtime probing</li>
                        <li><strong>last_successful_probe (20%)</strong> - recency and success of the last probe</li>
                        <li><strong>performance_latency (15%)</strong> - benchmark latency percentile</li>
                        <li><strong>documentation_quality (15%)</strong> - completeness of the manifest</li>
                        <li><strong>signed_release (10%)</strong> - maintainer/forge signatures</li>
                        <li><strong>update_frequency, community_adoption, permission_footprint, install_reproducibility</strong> - activity and posture</li>
                        <li><strong>known_security_issues (-20%)</strong> - unbounded scopes and risky patterns</li>
                    </ul>
                    <p className="text-gray-600">Every factor is returned with a human-readable explanation so scores are auditable.</p>
                </CardContent>
            </Card>

            <Card id="security">
                <CardHeader>
                    <CardTitle>Security Model</CardTitle>
                    <CardDescription>Defense in depth for every package you install.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Scope analysis</strong> - detects unbounded filesystem paths and unrestricted network egress</li>
                        <li><strong>SSRF detection</strong> - flags known SSRF-testing endpoints in egress domains</li>
                        <li><strong>Docker hygiene</strong> - warns on unpinned <code className="rounded bg-gray-100 px-1 text-xs">:latest</code> tags</li>
                        <li><strong>Egress hook</strong> - a layer-7 allowlist/denylist that audits every outbound request</li>
                        <li><strong>Sandbox tester</strong> - interactive testing with visible logs and permission prompts</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
