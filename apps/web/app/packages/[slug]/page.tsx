'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function PackageDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const [pkg, setPkg] = useState<Package | null>(null);
    const [releases, setReleases] = useState<Release[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Package & { releases?: Release[] }>(`/v1/packages/${slug}`);
                setPkg(data);
                setReleases(data.releases ?? []);
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

            <SandboxTester packageSlug={slug} />
        </div>
    );
}
