/**
 * Client compatibility matrix (TypeScript mirror of packages/client-templates).
 */
import type { PackageRecord } from '../store.ts';

export interface ClientCapability {
    id: string;
    name: string;
    transports: string[];
    primitives: { tools: boolean; prompts: boolean; resources: boolean; sampling: boolean };
    auth: string[];
    supports_roots: boolean;
    supports_sampling: boolean;
    notes: string;
}

const CLIENTS: ClientCapability[] = [
    {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        transports: ['stdio', 'streamable-http'],
        primitives: { tools: true, prompts: true, resources: true, sampling: false },
        auth: ['api_key', 'oauth', 'none'],
        supports_roots: true,
        supports_sampling: false,
        notes: 'Native MCP support; roots via filesystem roots config',
    },
    {
        id: 'openai-compatible',
        name: 'OpenAI-Compatible Clients',
        transports: ['streamable-http'],
        primitives: { tools: true, prompts: true, resources: true, sampling: true },
        auth: ['api_key', 'oauth', 'bearer', 'none'],
        supports_roots: true,
        supports_sampling: true,
        notes: 'Requires Streamable HTTP transport',
    },
    {
        id: 'vscode',
        name: 'VS Code (Copilot)',
        transports: ['stdio'],
        primitives: { tools: true, prompts: true, resources: true, sampling: false },
        auth: ['api_key', 'none'],
        supports_roots: true,
        supports_sampling: false,
        notes: 'Stdio only; OAuth via VS Code identity',
    },
    {
        id: 'cursor',
        name: 'Cursor',
        transports: ['stdio', 'streamable-http'],
        primitives: { tools: true, prompts: true, resources: true, sampling: false },
        auth: ['api_key', 'oauth', 'none'],
        supports_roots: true,
        supports_sampling: false,
        notes: 'Similar to Claude Desktop; supports both transports',
    },
    {
        id: 'custom-runtime',
        name: 'Custom Agent Runtime',
        transports: ['stdio', 'streamable-http', 'sse'],
        primitives: { tools: true, prompts: true, resources: true, sampling: true },
        auth: ['api_key', 'oauth', 'bearer', 'none'],
        supports_roots: true,
        supports_sampling: true,
        notes: 'Full flexibility; depends on implementation',
    },
];

export function checkCompatibility(pkg: PackageRecord, client: ClientCapability) {
    const pkgTransports = new Set(pkg.transports ?? []);
    const clientTransports = new Set(client.transports);
    const overlap = [...pkgTransports].filter((t) => clientTransports.has(t));

    const issues: string[] = [];
    const warnings: string[] = [];
    if (overlap.length === 0) {
        issues.push(
            `No compatible transports. Package: ${[...pkgTransports].join(',')}, Client: ${client.transports.join(',')}`,
        );
    }

    const pkgPrim = pkg.primitives ?? {};
    for (const [prim, supported] of Object.entries(client.primitives)) {
        if (pkgPrim[prim as keyof typeof pkgPrim] && !supported) {
            issues.push(`Primitive '${prim}' not supported by ${client.name}`);
        }
    }

    const pkgAuth = pkg.auth?.type ?? 'none';
    if (!client.auth.includes(pkgAuth)) {
        issues.push(`Auth type '${pkgAuth}' not supported by ${client.name}`);
    }

    if ((pkg.runtime as Record<string, unknown>)?.roots && !client.supports_roots) {
        warnings.push('Package uses filesystem roots but client has limited root support');
    }
    if (pkgPrim.sampling && !client.supports_sampling) {
        warnings.push('Package uses sampling but client does not support it');
    }

    return {
        compatible: issues.length === 0,
        client: client.id,
        client_name: client.name,
        compatible_transports: overlap,
        issues,
        warnings,
        notes: client.notes,
    };
}

export function buildMatrix(pkg: PackageRecord) {
    const matrix = CLIENTS.map((c) => checkCompatibility(pkg, c));
    const compatible = matrix.filter((m) => m.compatible).map((m) => m.client);
    return {
        package: pkg.slug,
        compatible_clients: compatible,
        incompatible_clients: matrix.filter((m) => !m.compatible).map((m) => m.client),
        matrix,
    };
}

export function getClients(): ClientCapability[] {
    return CLIENTS;
}
