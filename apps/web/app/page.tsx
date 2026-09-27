import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FEATURES = [
    {
        title: 'Verified & Scored',
        desc: 'Every package is validated, probed, and given an explainable trust score so you know exactly what you are installing.',
    },
    {
        title: 'One-Click Install',
        desc: 'Generate ready-to-use configs for Claude Desktop, OpenAI clients, VS Code, and Docker Compose in seconds.',
    },
    {
        title: 'Safe Sandbox',
        desc: 'Test any server in a sandbox with bounded permissions, live logs, and automatic rate-limiting before you deploy.',
    },
];

const POPULAR_FILTERS = ['filesystem', 'web-search', 'no-auth', 'docker', 'verified', 'streamable-http'];

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <section className="bg-navy py-20 px-4 text-white">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="mb-4 text-5xl font-bold">MCP Forge</h1>
                    <p className="mb-8 text-xl text-gray-300">The trusted operating layer for MCP servers.</p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/packages">Explore Packages</Link>
                        </Button>
                        <Button size="lg" asChild>
                            <Link href="/docs">Publish Your Server</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="bg-gray-50 px-4 py-12">
                <div className="mx-auto max-w-2xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Search for tools, transports, auth type..." className="h-12 pl-10 text-lg" />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {POPULAR_FILTERS.map((t) => (
                            <Link
                                key={t}
                                href={`/packages?filter=${t}`}
                                className="rounded-full border bg-white px-3 py-1 text-sm hover:bg-gray-100"
                            >
                                {t}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-12">
                <h2 className="mb-6 text-center text-2xl font-semibold">Why MCP Forge?</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {FEATURES.map((f) => (
                        <Card key={f.title}>
                            <CardHeader>
                                <CardTitle>{f.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">{f.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
