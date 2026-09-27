import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">MCP Forge</h1>
          <p className="text-xl text-gray-300 mb-8">The trusted operating layer for MCP servers.</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild><Link href="/packages">Explore Packages</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/docs">Publish Your Server</Link></Button>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <Input placeholder="Search for tools, transports, auth type…" className="h-12 text-lg" />
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {['filesystem', 'web-search', 'no-auth', 'docker', 'verified', 'streamable-http'].map(t => (
              <Link key={t} href={`/packages?filter=${t}`} className="text-sm bg-white border px-3 py-1 rounded-full hover:bg-gray-100">{t}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights (Phase 1-3) */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">Why MCP Forge?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            title: 'Verified & Scored',
            desc: 'Every package is validated, probed, and given an explainable trust score so you know exactly what you're installing.',
          },{
            title: 'One‑Click Install',
            desc: 'Generate ready‑to‑use configs for Claude Desktop, OpenAI clients, VS Code, and Docker Compose in seconds.',
          },{
            title: 'Safe Sandbox',
            desc: 'Test any server in a sandbox with bounded permissions, live logs, and automatic rate‑limiting before you deploy.',
          }].map(f => (
            <Card key={f.title}>
              <CardHeader><CardTitle>{f.title}</CardTitle></CardHeader>
              <CardContent><p className="text-gray-600">{f.desc}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
