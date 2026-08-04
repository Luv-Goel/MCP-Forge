/**
 * Durable JSON-file backed store for packages and releases.
 *
 * Persists the in-memory map to disk on every mutation using an atomic
 * write (temp file + rename). Safe for small-to-medium registries and
 * suitable for local dev; swap with Postgres for large deployments.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { config } from './config.ts';

export interface PackageRecord {
    name: string;
    slug: string;
    description: string;
    transports: string[];
    primitives: { tools?: boolean; prompts?: boolean; resources?: boolean; sampling?: boolean };
    auth: { type: string; env_var?: string };
    runtime?: Record<string, unknown>;
    scopes?: Array<Record<string, unknown>>;
    stars: number;
    verified: boolean;
    updatedAt?: string;
    [key: string]: unknown;
}

export interface ReleaseRecord {
    slug: string;
    version: string;
    published_at: string;
    manifest_version: string;
    changelog?: string;
    signatures?: { maintainer?: string; forge?: string };
}

interface DBShape {
    packages: Record<string, PackageRecord>;
    releases: Record<string, ReleaseRecord[]>;
}

const EMPTY_DB: DBShape = { packages: {}, releases: {} };

class JsonFileStore {
    private db: DBShape = { packages: {}, releases: {} };
    private loaded = false;
    private readonly file: string;

    constructor(file: string) {
        this.file = file;
    }

    private async load(): Promise<void> {
        if (this.loaded || !this.file) return;
        this.loaded = true;
        try {
            const raw = await fs.readFile(this.file, 'utf-8');
            const parsed = JSON.parse(raw) as Partial<DBShape>;
            this.db = {
                packages: parsed.packages ?? {},
                releases: parsed.releases ?? {},
            };
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.warn(`[store] failed to load ${this.file}: ${err.message}`);
            }
        }
    }

    private async persist(): Promise<void> {
        if (!this.file) return;
        const dir = path.dirname(this.file);
        await fs.mkdir(dir, { recursive: true });
        const tmp = `${this.file}.${process.pid}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(this.db, null, 2), 'utf-8');
        await fs.rename(tmp, this.file);
    }

    // ---- packages ----

    async allPackages(): Promise<PackageRecord[]> {
        await this.load();
        return Object.values(this.db.packages);
    }

    async getPackage(slug: string): Promise<PackageRecord | null> {
        await this.load();
        return this.db.packages[slug] ?? null;
    }

    async putPackage(pkg: PackageRecord): Promise<void> {
        await this.load();
        this.db.packages[pkg.slug] = { ...pkg, updatedAt: pkg.updatedAt ?? new Date().toISOString() };
        await this.persist();
    }

    async deletePackage(slug: string): Promise<boolean> {
        await this.load();
        const existed = slug in this.db.packages;
        if (existed) {
            delete this.db.packages[slug];
            delete this.db.releases[slug];
            await this.persist();
        }
        return existed;
    }

    async seed(packages: PackageRecord[]): Promise<void> {
        await this.load();
        for (const p of packages) this.db.packages[p.slug] = p;
        await this.persist();
    }

    // ---- releases ----

    async listReleases(slug: string): Promise<ReleaseRecord[]> {
        await this.load();
        return this.db.releases[slug] ?? [];
    }

    async addRelease(slug: string, release: ReleaseRecord): Promise<ReleaseRecord[]> {
        await this.load();
        const list = this.db.releases[slug] ?? [];
        const existing = list.findIndex((r) => r.version === release.version);
        if (existing >= 0) {
            list[existing] = release;
        } else {
            list.push(release);
        }
        list.sort((a, b) => b.published_at.localeCompare(a.published_at));
        this.db.releases[slug] = list;
        await this.persist();
        return list;
    }
}

export const store = new JsonFileStore(config.dataFile);
