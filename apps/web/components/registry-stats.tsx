'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/utils';

interface Stats {
    packages: number;
    verified: number;
    total_stars: number;
    total_releases: number;
    avg_stars: number;
}

export function RegistryStats() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        apiFetch<Stats>('/v1/stats')
            .then(setStats)
            .catch(() => setStats(null));
    }, []);

    if (!stats) return null;

    const rows = [
        { label: 'Packages', value: stats.packages },
        { label: 'Verified', value: stats.verified },
        { label: 'Stars', value: stats.total_stars.toLocaleString() },
        { label: 'Releases', value: stats.total_releases },
    ];

    return (
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
            {rows.map((row) => (
                <div key={row.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                    <div className="text-2xl font-bold text-navy">{row.value}</div>
                    <div className="text-sm text-gray-500">{row.label}</div>
                </div>
            ))}
        </div>
    );
}
