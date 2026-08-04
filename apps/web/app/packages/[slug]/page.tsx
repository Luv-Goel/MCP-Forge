'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/utils';
import { SandboxTester } from '@/components/sandbox-tester';
import type { Package } from '../page';

interface Release {
    version: string;
    published_at: string;
    manifest_version: string;
    changelog?: string;
    signatures?: { maintainer?: string; forge?: string };
}

interface TrustScore {
    total: number;
    grade: string;
    factors: Array<{ name: string; weight: number; value: number; contribution: number; explanation: string }>;
}

interface CompatibilityMatrix {
    compatible_clients: string[];
    incompatible_clients: string[];
    matrix: Array<{
        client: string;
        client_name: string;
        compatible: boolean;
        compatible_transports: string[];
        issues: string[];
        warnings: string[];
        notes: string;
    }>;
}

const TRUST_COLORS: Record<string, string> = {
    'A+': 'bg-green-600',
    A: 'bg-green-600',
    'A-': 'bg-green-500',
    'B+': 'bg-green-500',
    B: 'bg-lime-500',
    'B-': 'bg-lime-500',
    'C+': 'bg-yellow-500',
    C: 'bg-yellow-500',
    'C-': 'bg-orange-500',
    D: 'bg-orange-500',
    F: 'bg-red-600',
};

export default function PackageDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const [pkg, setPkg] = useState<Package | null>(null);
    const [releases, setReleases] = useState<Release[]>([]);
    const [trust, setTrust] = useState<TrustScore | null>(null);
    const [compat, setCompat] = useState<CompatibilityMatrix | null>(null);
    const [install, setInstall] = useState<Record<string, string> | null>(null);
    const [activeTab, setActiveTab] = useState('releases');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [data, trustRes, compatRes, installRes] = await Promise.all([
                    apiFetch<Package & { releases?: Release[] }>(`/v1/packages/${slug}`),
                    apiFetch<TrustScore>(`/v1/packages/${slug}/trust`),
                    apiFetch<CompatibilityMatrix>(`/v1/packages/${slug}/compat`),
                    apiFetch<Record<string, string>>(`/v1/packages/${slug}/install`),
                ]);
                setPkg(data);
                setReleases(data.releases ?? []);
                setTrust(trustRes);
                setCompat(compatRes);
                setInstall(installRes);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Package not found');
            }
        })();
    }, [slug]);

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <h1 className="text-2xl font-bold">{error}</h1>
                <Button asChild className="mt-4" variant="outline">
                    <Link href="/packages">Back to packages</Link>
                </Button>
            </div>
        );
    }

    if (!pkg) {
        return <div className="mx-auto max-w-3xl px-4 py-16 text-gray-500">Loading package...</div>;
    }

    const runtime = (pkg.runtime ?? {}) as Record<string, unknown>;
    const scopeNames = (pkg.scopes ?? []).map((s) => (s as Record<string, unknown>).name as string);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{pkg.name}</h1>
                    {pkg.verified && <Badge variant="success">Verified</Badge>}
                    {trust && (
                        <Badge className={TRUST_COLORS[trust.grade] ?? 'bg-gray-500'} variant="secondary">
                            Trust {trust.grade}
                        </Badge>
                    )}
                </div>
                <p className="mt-1 font-mono text-sm text-gray-500">{pkg.slug}</p>
                <p className="mt-2 text-gray-700">{pkg.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {pkg.transports.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                ))}
                {pkg.auth?.type && (
                    <Badge variant="outline">auth: {pkg.auth.type}</Badge>
                )}
                {Object.entries(pkg.primitives ?? {})
                    .filter(([, v]) => v)
                    .map(([k]) => (
                        <Badge key={k} variant="outline">{k}</Badge>
                    ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Runtime</CardTitle>
                        <CardDescription>How this server is launched.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Type:</span> {String(runtime.type ?? 'unknown')}</div>
                        {Array.isArray(runtime.entrypoint) && (
                            <div>
                                <span className="text-gray-500">Entrypoint:</span>{' '}
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                                    {(runtime.entrypoint as string[]).join(' ')}
                                </code>
                            </div>
                        )}
                        {typeof runtime.url === 'string' && (
                            <div>
                                <span className="text-gray-500">URL:</span>{' '}
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                                    {runtime.url}
                                </code>
                            </div>
                        )}
                        {typeof runtime.image === 'string' && (
                            <div>
                                <span className="text-gray-500">Image:</span>{' '}
                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                                    {runtime.image}
                                </code>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>Declared scopes and security posture.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        {scopeNames.length === 0 && <p className="text-gray-500">No permission scopes declared.</p>}
                        {scopeNames.map((name) => (
                            <div key={name} className="flex items-center justify-between">
                                <span>{name}</span>
                                <Badge variant="secondary">declared</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="releases">Releases</TabsTrigger>
                    <TabsTrigger value="trust">Trust Score</TabsTrigger>
                    <TabsTrigger value="compat">Compatibility</TabsTrigger>
                    <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>

                <TabsContent value="releases">
                    <Card>
                        <CardHeader>
                            <CardTitle>Releases</CardTitle>
                            <CardDescription>Versioned manifest snapshots for this package.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {releases.length === 0 ? (
                                <p className="text-sm text-gray-500">No releases published yet.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {releases.map((r) => (
                                        <li key={r.version} className="flex items-center justify-between py-2 text-sm">
                                            <div>
                                                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{r.version}</code>
                                                {r.changelog && <span className="ml-2 text-gray-600">{r.changelog}</span>}
                                            </div>
                                            <span className="text-xs text-gray-500">{new Date(r.published_at).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trust">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trust Score {trust ? <Badge variant="secondary">{trust.grade}</Badge> : null}</CardTitle>
                            <CardDescription>
                                {trust ? `${Math.round(trust.total * 100)}/100 - explainable, factor-by-factor breakdown.` : 'Loading...'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {trust ? (
                                <div className="space-y-2">
                                    {trust.factors.map((f) => (
                                        <div key={f.name} className="flex items-center justify-between gap-4 text-sm">
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium">{f.name}</span>
                                                <span className="ml-2 text-xs text-gray-500">{f.explanation}</span>
                                            </div>
                                            <span className="font-mono text-xs text-gray-600">
                                                {f.weight >= 0 ? '+' : ''}{Math.round(f.contribution * 100) / 100}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Trust score unavailable.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compat">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compatibility</CardTitle>
                            <CardDescription>Which clients can run this server out of the box.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {compat ? (
                                <div className="space-y-2">
                                    {compat.matrix.map((m) => (
                                        <div key={m.client} className="flex items-center justify-between gap-4 rounded border border-gray-100 px-3 py-2 text-sm">
                                            <div className="min-w-0">
                                                <span className="font-medium">{m.client_name}</span>
                                                {m.compatible_transports.length > 0 && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        {m.compatible_transports.join(', ')}
                                                    </span>
                                                )}
                                                {m.issues.map((issue, i) => (
                                                    <div key={i} className="text-xs text-red-600">{issue}</div>
                                                ))}
                                            </div>
                                            <Badge variant={m.compatible ? 'success' : 'destructive'}>
                                                {m.compatible ? 'Compatible' : 'Incompatible'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Compatibility unavailable.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="install">
                    <Card>
                        <CardHeader>
                            <CardTitle>Install Configs</CardTitle>
                            <CardDescription>Ready-to-use configs for each supported client.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {install ? (
                                <div className="space-y-4">
                                    {Object.entries(install).map(([client, config]) => (
                                        <div key={client}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-sm font-medium">{client}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => void navigator.clipboard.writeText(config)}
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                            <pre className="overflow-x-auto rounded-lg bg-navy p-3 text-xs text-green-300">{config}</pre>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Install configs unavailable.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <SandboxTester packageSlug={slug} />
        </div>
    );
}
