'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/utils';

export interface Package {
    name: string;
    slug: string;
    description: string;
    transports: string[];
    primitives?: { tools?: boolean; prompts?: boolean; resources?: boolean; sampling?: boolean };
    auth?: { type: string; env_var?: string };
    runtime?: Record<string, unknown>;
    scopes?: Array<Record<string, unknown>>;
    stars: number;
    verified: boolean;
    tags?: string[];
    updatedAt?: string;
}

interface ListResponse {
    items: Package[];
    total: number;
    limit: number;
    offset: number;
}

const TRANSPORTS = ['stdio', 'streamable-http', 'sse'];
const AUTH_TYPES = ['none', 'api_key', 'oauth', 'bearer'];

export default function PackagesPage() {
    const [query, setQuery] = useState('');
    const [transport, setTransport] = useState('');
    const [auth, setAuth] = useState('');
    const [data, setData] = useState<ListResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 12;

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
            if (query) params.set('q', query);
            if (transport) params.set('transport', transport);
            if (auth) params.set('auth', auth);
            const result = await apiFetch<ListResponse>(`/v1/packages?${params}`);
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load packages');
        } finally {
            setLoading(false);
        }
    }, [query, transport, auth, offset]);

    useEffect(() => {
        setOffset(0);
    }, [query, transport, auth]);

    useEffect(() => {
        load();
    }, [load]);

    const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
    const page = Math.floor(offset / limit) + 1;

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Explore Packages</h1>
                <p className="mt-1 text-gray-600">
                    Discover validated MCP servers with trust scores, security signals, and install configs.
                </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                    placeholder="Search packages, tools, tags..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="md:max-w-sm"
                />
                <select
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                    <option value="">All transports</option>
                    {TRANSPORTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <select
                    value={auth}
                    onChange={(e) => setAuth(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                    <option value="">All auth</option>
                    {AUTH_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {loading && !data ? (
                <p className="text-gray-500">Loading packages...</p>
            ) : (
                <>
                    <p className="text-sm text-gray-500">{data?.total ?? 0} packages found</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {(data?.items ?? []).map((pkg) => (
                            <Link key={pkg.slug} href={`/packages/${pkg.slug}`}>
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle>{pkg.name}</CardTitle>
                                            {pkg.verified && <Badge variant="success">Verified</Badge>}
                                        </div>
                                        <CardDescription className="line-clamp-2">{pkg.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pkg.transports.map((t) => (
                                                <Badge key={t} variant="secondary">{t}</Badge>
                                            ))}
                                            {pkg.auth?.type && pkg.auth.type !== 'none' && (
                                                <Badge variant="outline">{pkg.auth.type}</Badge>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                                            <span>{pkg.stars ?? 0} stars</span>
                                            <span className="font-mono text-xs">{pkg.slug}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {data && data.total > limit && (
                        <div className="flex items-center justify-center gap-4 pt-2">
                            <Button variant="outline" disabled={page <= 1} onClick={() => setOffset(Math.max(0, offset - limit))}>
                                Previous
                            </Button>
                            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                            <Button variant="outline" disabled={page >= totalPages} onClick={() => setOffset(offset + limit)}>
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
