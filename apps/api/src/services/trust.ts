/**
 * Explainable trust score engine (TypeScript mirror of packages/scoring).
 *
 * Computes a 0-1 trust score from transparent factors so the API can serve
 * the same signal the Python CLI produces without an external process.
 */
import type { PackageRecord } from '../store.ts';

const WEIGHTS: Record<string, number> = {
    verification_success: 0.30,
    last_successful_probe: 0.20,
    performance_latency: 0.15,
    documentation_quality: 0.15,
    signed_release: 0.10,
    update_frequency: 0.10,
    known_security_issues: -0.20,
    permission_footprint: 0.05,
    install_reproducibility: 0.10,
    community_adoption: 0.10,
};

export function grade(score: number): string {
    if (score >= 0.9) return 'A+';
    if (score >= 0.85) return 'A';
    if (score >= 0.8) return 'A-';
    if (score >= 0.75) return 'B+';
    if (score >= 0.7) return 'B';
    if (score >= 0.65) return 'B-';
    if (score >= 0.6) return 'C+';
    if (score >= 0.55) return 'C';
    if (score >= 0.5) return 'C-';
    if (score >= 0.4) return 'D';
    return 'F';
}

interface Factor {
    name: string;
    weight: number;
    value: number;
    contribution: number;
    explanation: string;
}

function docQuality(pkg: PackageRecord): { value: number; explanation: string } {
    const required = ['name', 'slug', 'description', 'homepage', 'source', 'license'];
    const present = required.filter((k) => Boolean((pkg as unknown as Record<string, unknown>)[k])).length;
    let value = 0.4 * (present / required.length);
    const notes: string[] = [];
    const tags = pkg.tags as string[] | undefined;
    if (tags && tags.length > 0) {
        value += 0.2;
        notes.push('includes tags');
    }
    if (pkg.scopes && pkg.scopes.length > 0) {
        value += 0.2;
        notes.push('declares permission scopes');
    }
    if (pkg.verified) {
        value += 0.2;
        notes.push('verified');
    }
    return {
        value: Math.min(value, 1),
        explanation: notes.length ? notes.join('; ') : 'sparse documentation',
    };
}

function signedRelease(pkg: PackageRecord): { value: number; explanation: string } {
    const releases = (pkg.releases as Array<Record<string, unknown>> | undefined) ?? [];
    if (releases.length === 0) return { value: 0.3, explanation: 'no releases declared' };
    const latest = releases.reduce((a, b) =>
        String(b.published_at ?? '') > String(a.published_at ?? '') ? b : a,
    );
    const sigs = (latest.signatures ?? {}) as Record<string, unknown>;
    if (sigs.maintainer && sigs.forge) return { value: 1, explanation: 'signed by maintainer and MCP Forge' };
    if (sigs.maintainer) return { value: 0.7, explanation: 'signed by maintainer only' };
    return { value: 0.4, explanation: 'no signatures found' };
}

function securityIssues(pkg: PackageRecord): { value: number; explanation: string } {
    const warnings: string[] = [];
    for (const scope of pkg.scopes ?? []) {
        const s = scope as Record<string, unknown>;
        if (s.name === 'network' && !(Array.isArray(s.domains) && s.domains.length > 0)) {
            warnings.push('network scope lacks domain restrictions');
        }
        if (s.name === 'filesystem' && Array.isArray(s.paths) && s.paths.some((p) => String(p).includes('*'))) {
            warnings.push('filesystem scope has unbounded path access');
        }
    }
    if (warnings.length > 0) return { value: -0.2, explanation: warnings.join('; ') };
    return { value: 0, explanation: 'no known security issues' };
}

function permissionFootprint(pkg: PackageRecord): { value: number; explanation: string } {
    const scopes = pkg.scopes ?? [];
    if (scopes.length === 0) return { value: 0.5, explanation: 'no scopes declared - cannot assess' };
    const required = scopes.filter((s) => (s as Record<string, unknown>).required);
    if (required.length === 0) return { value: 1, explanation: 'zero required scopes (minimal footprint)' };
    if (required.length <= 2) return { value: 0.85, explanation: `${required.length} required scopes - good` };
    if (required.length <= 4) return { value: 0.6, explanation: `${required.length} required scopes - moderate` };
    return { value: 0.3, explanation: `${required.length} required scopes - consider reducing` };
}

function reproducibility(pkg: PackageRecord): { value: number; explanation: string } {
    const runtime = (pkg.runtime ?? {}) as Record<string, unknown>;
    switch (runtime.type) {
        case 'docker':
            return { value: 0.9, explanation: 'docker runtime - highly reproducible' };
        case 'binary':
            return { value: 0.85, explanation: 'binary distribution - reproducible' };
        case 'python':
            return { value: 0.75, explanation: 'python runtime - depends on environment' };
        default:
            return { value: 0.6, explanation: 'custom runtime - verify compatibility' };
    }
}

function adoption(pkg: PackageRecord): { value: number; explanation: string } {
    const stars = pkg.stars ?? 0;
    let value = Math.min(stars / 100, 1) * 0.7;
    if (pkg.verified) value += 0.3;
    return { value, explanation: `stars=${stars}, verified=${pkg.verified}` };
}

function activity(pkg: PackageRecord): { value: number; explanation: string } {
    const releases = (pkg.releases as Array<Record<string, unknown>> | undefined) ?? [];
    const updated = pkg.updatedAt ? Date.parse(pkg.updatedAt) : 0;
    const daysOld = updated ? Math.max(0, (Date.now() - updated) / 86_400_000) : 90;
    let value = 0.4;
    let explanation = 'no recent release signal';
    if (releases.length >= 2) {
        value = 0.75;
        explanation = `${releases.length} releases on record`;
    } else if (daysOld <= 90) {
        value = 0.6;
        explanation = `last updated ${Math.round(daysOld)} days ago`;
    }
    return { value, explanation };
}

export function computeTrustScore(pkg: PackageRecord): {
    package: string;
    total: number;
    grade: string;
    breakdown: Record<string, number>;
    factors: Factor[];
} {
    const checks: Array<[string, { value: number; explanation: string }]> = [
        ['verification_success', { value: pkg.verified ? 1 : 0.5, explanation: pkg.verified ? 'verified package' : 'not yet verified' }],
        ['last_successful_probe', activity(pkg)],
        ['performance_latency', { value: 0.6, explanation: 'latency not benchmarked' }],
        ['documentation_quality', docQuality(pkg)],
        ['signed_release', signedRelease(pkg)],
        ['update_frequency', activity(pkg)],
        ['known_security_issues', securityIssues(pkg)],
        ['permission_footprint', permissionFootprint(pkg)],
        ['install_reproducibility', reproducibility(pkg)],
        ['community_adoption', adoption(pkg)],
    ];

    const factors: Factor[] = [];
    const breakdown: Record<string, number> = {};
    let total = 0;
    for (const [name, factor] of checks) {
        const weight = WEIGHTS[name] ?? 0;
        const contribution = weight * factor.value;
        total += contribution;
        breakdown[name] = Math.round(contribution * 10000) / 10000;
        factors.push({ name, weight, value: factor.value, contribution, explanation: factor.explanation });
    }

    total = Math.max(0, Math.min(1, total));
    return {
        package: pkg.slug,
        total: Math.round(total * 100) / 100,
        grade: grade(total),
        breakdown,
        factors,
    };
}
