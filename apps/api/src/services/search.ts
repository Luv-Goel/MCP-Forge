/**
 * Search and listing service built on top of the durable store.
 */
import { store } from '../store.ts';
import type { PackageRecord } from '../store.ts';

export interface PackageQuery {
    q?: string;
    transport?: string;
    auth?: string;
    verified?: boolean | undefined;
    primitive?: string;
    sort?: 'updated' | 'stars' | 'name';
    limit?: number;
    offset?: number;
}

export interface Paginated<T> {
    total: number;
    offset: number;
    limit: number;
    items: T[];
}

export function matchesFilter(pkg: PackageRecord, query: PackageQuery): boolean {
    if (query.q) {
        const q = query.q.toLowerCase();
        const haystack = [
            pkg.name,
            pkg.slug,
            pkg.description,
            ...(Array.isArray(pkg.transports) ? pkg.transports : []),
            ...(Array.isArray(pkg.tags) ? (pkg.tags as string[]) : []),
        ]
            .join(' ')
            .toLowerCase();
        if (!haystack.includes(q)) return false;
    }
    if (query.transport && !pkg.transports.includes(query.transport)) return false;
    if (query.auth && pkg.auth?.type !== query.auth) return false;
    if (query.primitive) {
        const prim = query.primitive as keyof NonNullable<PackageRecord['primitives']>;
        if (!pkg.primitives?.[prim]) return false;
    }
    if (query.verified !== undefined && pkg.verified !== query.verified) return false;
    return true;
}

function comparator(sort: string) {
    switch (sort) {
        case 'stars':
            return (a: PackageRecord, b: PackageRecord) => (b.stars ?? 0) - (a.stars ?? 0);
        case 'name':
            return (a: PackageRecord, b: PackageRecord) => a.name.localeCompare(b.name);
        case 'updated':
        default:
            return (a: PackageRecord, b: PackageRecord) =>
                (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    }
}

export async function queryPackages(query: PackageQuery): Promise<Paginated<PackageRecord>> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);
    const sort = query.sort ?? 'updated';

    const all = await store.allPackages();
    const filtered = all.filter((p) => matchesFilter(p, query));
    filtered.sort(comparator(sort));

    return {
        total: filtered.length,
        offset,
        limit,
        items: filtered.slice(offset, offset + limit),
    };
}

export const searchIndex = {
    async all(): Promise<PackageRecord[]> {
        return store.allPackages();
    },
    async bySlug(slug: string): Promise<PackageRecord | null> {
        return store.getPackage(slug);
    },
    async upsert(pkg: PackageRecord): Promise<void> {
        await store.putPackage(pkg);
    },
};
