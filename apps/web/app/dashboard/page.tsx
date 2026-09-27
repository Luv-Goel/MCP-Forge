'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/utils';
import type { Package } from '@/app/packages/page';

interface Stats {
    packages: number;
    verified: number;
    transports: Record<string, number>;
    auth: Record<string, number>;
    total_releases: number;
    total_stars: number;
    avg_stars: number;
}

export default function MaintainerDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [statsRes, listRes] = await Promise.all([
                    apiFetch<Stats>('/v1/stats'),
                    apiFetch<{ items: Package[] }>('/v1/packages?limit=100&sort=stars'),
                ]);
                setStats(statsRes);
                setPackages(listRes.items);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load registry data');
            }
        })();
    }, []);

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Registry Dashboard</h1>
                    <p className="text-gray-600 mt-1">Live registry health, packages, and trust signals.</p>
                </div>
                <Button asChild><Link href="/dashboard/new">+ New Package</Link></Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {!stats && !error ? (
                <p className="text-gray-500">Loading registry...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Packages', value: stats?.packages ?? 0 },
                            { label: 'Verified', value: stats?.verified ?? 0 },
                            { label: 'Total Stars', value: (stats?.total_stars ?? 0).toLocaleString() },
                            { label: 'Releases', value: stats?.total_releases ?? 0 },
                        ].map((kpi) => (
                            <Card key={kpi.label}>
                                <CardHeader><CardTitle className="text-sm text-gray-500">{kpi.label}</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-semibold">{kpi.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader><CardTitle className="text-sm">By Transport</CardTitle></CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {Object.entries(stats.transports).map(([t, count]) => (
                                        <div key={t} className="flex justify-between">
                                            <span>{t}</span>
                                            <span className="font-mono">{count}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-sm">By Auth</CardTitle></CardHeader>
                                <CardContent className="space-y-1 text-sm">
                                    {Object.entries(stats.auth).map(([a, count]) => (
                                        <div key={a} className="flex justify-between">
                                            <span>{a}</span>
                                            <span className="font-mono">{count}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Packages</CardTitle>
                            <CardDescription>Sorted by stars.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Package</TableHead>
                                        <TableHead>Transports</TableHead>
                                        <TableHead>Stars</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.map((pkg) => (
                                        <TableRow key={pkg.slug}>
                                            <TableCell className="font-medium">{pkg.name}<br /><span className="text-xs text-gray-500">{pkg.slug}</span></TableCell>
                                            <TableCell>{pkg.transports.join(', ')}</TableCell>
                                            <TableCell>{pkg.stars?.toLocaleString() ?? 0}</TableCell>
                                            <TableCell>
                                                <Badge variant={pkg.verified ? 'default' : 'outline'}>{pkg.verified ? 'verified' : 'pending'}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button asChild size="sm" variant="outline"><Link href={`/packages/${pkg.slug}`}>View</Link></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
