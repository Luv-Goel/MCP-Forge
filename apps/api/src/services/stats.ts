/**
 * Registry statistics computed from the durable store.
 */
import { store } from '../store.ts';
import type { PackageRecord } from '../store.ts';

export interface RegistryStats {
    packages: number;
    verified: number;
    transports: Record<string, number>;
    auth: Record<string, number>;
    primitives: Record<string, number>;
    total_releases: number;
    total_stars: number;
    avg_stars: number;
    tags: Record<string, number>;
}

export async function computeStats(): Promise<RegistryStats> {
    const all = await store.allPackages();
    const transports: Record<string, number> = {};
    const auth: Record<string, number> = {};
    const primitives: Record<string, number> = {};
    const tags: Record<string, number> = {};
    let total_releases = 0;
    let total_stars = 0;
    let verified = 0;

    for (const pkg of all) {
        if (pkg.verified) verified += 1;
        total_stars += pkg.stars ?? 0;
        for (const t of pkg.transports ?? []) transports[t] = (transports[t] ?? 0) + 1;
        const authType = pkg.auth?.type ?? 'none';
        auth[authType] = (auth[authType] ?? 0) + 1;
        for (const [name, enabled] of Object.entries(pkg.primitives ?? {})) {
            if (enabled) primitives[name] = (primitives[name] ?? 0) + 1;
        }
        for (const tag of (pkg.tags as string[] | undefined) ?? []) tags[tag] = (tags[tag] ?? 0) + 1;
        total_releases += (await store.listReleases(pkg.slug)).length;
    }

    return {
        packages: all.length,
        verified,
        transports,
        auth,
        primitives,
        total_releases,
        total_stars,
        avg_stars: all.length ? Math.round((total_stars / all.length) * 10) / 10 : 0,
        tags,
    };
}
