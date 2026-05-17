// In-memory search index stub (replaced by Postgres in Phase 2)
type PackageRecord = {
    name: string;
    slug: string;
    description: string;
    transports: string[];
    primitives: { tools?: boolean; prompts?: boolean; resources?: boolean; sampling?: boolean };
    auth: { type: string };
    stars: number;
    verified: boolean;
    updatedAt?: string;
};

const store: Map<string, PackageRecord> = new Map();

export const searchIndex = {
    async all(): Promise<PackageRecord[]> {
        return Array.from(store.values());
    },
    async bySlug(slug: string): Promise<PackageRecord | null> {
        return store.get(slug) ?? null;
    },
    async upsert(pkg: PackageRecord): Promise<void> {
        store.set(pkg.slug, pkg);
    },
};
