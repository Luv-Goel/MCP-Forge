import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type PublishRow = {
  slug: string;
  name: string;
  version: string;
  trust: number;
  installs: number;
  lastRelease: string;
  status: 'verified' | 'pending';
};

const MOCK_DATA: PublishRow[] = [
  { slug: 'filesystem-tools', name: 'FS Tools', version: '0.3.1', trust: 92, installs: 1842, lastRelease: '2025-05-12T09:00:00Z', status: 'verified' },
  { slug: 'web-search-pro',   name: 'Web Search Pro', version: '1.1.0', trust: 88, installs: 910,  lastRelease: '2025-05-10T14:20:00Z', status: 'verified' },
  { slug: 'memory-store',     name: 'Memory Store',   version: '0.1.4', trust: 61, installs: 340,  lastRelease: '2025-05-08T11:15:00Z', status: 'pending' },
];

export default function MaintainerDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Maintainer Dashboard</h1>
          <p className="text-gray-600 mt-1">Track views, installs, trust scores, and export stats for your packages.</p>
        </div>
        <Button asChild><Link href="/dashboard/new">+ New Package</Link></Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Installs',  value: '3 092' },
          { label: 'Avg Trust Score', value: '80.3' },
          { label: 'Config Exports',  value: '441' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader><CardTitle className="text-sm text-gray-500">{kpi.label}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Packages</CardTitle>
          <CardDescription>Sorted by most verified first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Installs</TableHead>
                <TableHead>Last Release</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((r) => (
                <TableRow key={r.slug}>
                  <TableCell className="font-medium">{r.name}<br/><span className="text-xs text-gray-500">{r.slug}</span></TableCell>
                  <TableCell><code className="text-xs bg-gray-100 px-1 rounded">{r.version}</code></TableCell>
                  <TableCell>
                    <Badge variant={r.trust >= 80 ? 'default' : r.trust >= 60 ? 'secondary' : 'destructive'}>
                      {r.trust}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.installs.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{new Date(r.lastRelease).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'verified' ? 'default' : 'outline'}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline"><Link href={`/packages/${r.slug}`}>View</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
