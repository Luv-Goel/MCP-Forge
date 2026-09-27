'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/utils';

export default function NewPackagePage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        transports: ['stdio'],
        auth: 'none',
        entrypoint: '',
        homepage: '',
        license: '',
        tags: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const toggleTransport = (t: string) => {
        setForm((prev) => ({
            ...prev,
            transports: prev.transports.includes(t)
                ? prev.transports.filter((x) => x !== t)
                : [...prev.transports, t],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim() || !form.slug.trim() || form.description.length < 10) {
            setError('Name, slug, and a description of at least 10 characters are required.');
            return;
        }
        const body: Record<string, unknown> = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            transports: form.transports,
            auth: { type: form.auth },
            stars: 0,
            verified: false,
        };
        if (form.entrypoint.trim()) {
            body.runtime = { type: 'python', entrypoint: form.entrypoint.trim().split(/\s+/) };
        }
        if (form.homepage.trim()) body.homepage = form.homepage.trim();
        if (form.license.trim()) body.license = form.license.trim();
        if (form.tags.trim()) body.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

        setSubmitting(true);
        try {
            await apiFetch('/v1/packages', { method: 'POST', body: JSON.stringify(body) });
            router.push(`/packages/${form.slug.trim()}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to register package');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Register a Package</h1>
                <p className="mt-1 text-gray-600">
                    Publish an MCP server manifest to the registry. You can enrich it with scopes and releases later.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                        <CardDescription>How the package is named and described.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Name</label>
                            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="My MCP Server" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Slug</label>
                            <Input
                                value={form.slug}
                                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                                placeholder="my-mcp-server"
                            />
                            <p className="mt-1 text-xs text-gray-500">URL-safe identifier, e.g. filesystem-tools.</p>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Description</label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => set('description', e.target.value)}
                                placeholder="What does this server do? (at least 10 characters)"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Homepage</label>
                            <Input value={form.homepage} onChange={(e) => set('homepage', e.target.value)} placeholder="https://github.com/you/server" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">License</label>
                            <Input value={form.license} onChange={(e) => set('license', e.target.value)} placeholder="MIT" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Capabilities</CardTitle>
                        <CardDescription>Transports and runtime entrypoint.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Transports</label>
                            <div className="flex flex-wrap gap-2">
                                {['stdio', 'streamable-http', 'sse'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => toggleTransport(t)}
                                        className={`rounded-full border px-3 py-1 text-sm ${
                                            form.transports.includes(t)
                                                ? 'border-navy bg-navy text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Auth</label>
                            <select
                                value={form.auth}
                                onChange={(e) => set('auth', e.target.value)}
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                            >
                                <option value="none">None</option>
                                <option value="api_key">API Key</option>
                                <option value="bearer">Bearer</option>
                                <option value="oauth">OAuth</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Entrypoint (stdio servers)</label>
                            <Input
                                value={form.entrypoint}
                                onChange={(e) => set('entrypoint', e.target.value)}
                                placeholder="python3 -m my_server"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
                            <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="search, tools" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Registering...' : 'Register Package'}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">Cancel</Link>
                    </Button>
                </div>
            </form>
        </div>
    );
}
