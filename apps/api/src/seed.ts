/**
 * Seed the registry with curated starter packages when the store is empty.
 */
import { store } from './store.ts';
import type { PackageRecord } from './store.ts';

const SEED_PACKAGES: PackageRecord[] = [
    {
        name: 'Filesystem Tools',
        slug: 'filesystem-tools',
        description: 'Secure read/write access to local files and directories for MCP clients.',
        transports: ['stdio'],
        primitives: { tools: true, prompts: false, resources: true, sampling: false },
        auth: { type: 'none' },
        runtime: { type: 'python', entrypoint: ['uv', 'run', 'mcp-filesystem'], env: { MCP_FS_BASE_DIR: '/data' } },
        scopes: [{ name: 'filesystem', required: true, paths: ['/data'] }],
        stars: 1240,
        verified: true,
        tags: ['filesystem', 'storage'],
        updatedAt: '2026-07-15T09:30:00Z',
    },
    {
        name: 'Web Search Pro',
        slug: 'web-search-pro',
        description: 'High-performance web search and scraping tools with domain allowlisting.',
        transports: ['streamable-http'],
        primitives: { tools: true, prompts: true, resources: false, sampling: false },
        auth: { type: 'api_key', env_var: 'SEARCH_API_KEY' },
        runtime: { type: 'remote', url: 'https://search.mcp.run' },
        scopes: [{ name: 'network', required: true, domains: ['api.search.com'] }],
        stars: 910,
        verified: true,
        tags: ['web-search', 'tools'],
        updatedAt: '2026-07-10T14:20:00Z',
    },
    {
        name: 'Memory Store',
        slug: 'memory-store',
        description: 'Persistent key-value memory for agents and multi-turn conversations.',
        transports: ['stdio', 'streamable-http'],
        primitives: { tools: true, prompts: false, resources: true, sampling: false },
        auth: { type: 'none' },
        runtime: { type: 'docker', image: 'ghcr.io/mcp-forge/memory-store:0.1.4' },
        scopes: [{ name: 'filesystem', required: true, paths: ['/data/memory'] }],
        stars: 340,
        verified: false,
        tags: ['memory', 'storage'],
        updatedAt: '2026-05-08T11:15:00Z',
    },
    {
        name: 'Echo Fixture Server',
        slug: 'echo-fixture',
        description: 'Minimal sandbox-friendly MCP server used to demonstrate probing and the sandbox tester.',
        transports: ['stdio'],
        primitives: { tools: true, prompts: false, resources: true, sampling: false },
        auth: { type: 'none' },
        runtime: {
            type: 'python',
            entrypoint: ['python3', 'tests/fixtures/echo_server.py'],
            env: {},
            network: { required: false, egress: { domains: [] } },
        },
        scopes: [],
        stars: 0,
        verified: false,
        tags: ['fixture', 'demo'],
        updatedAt: '2026-08-01T00:00:00Z',
    },
];

export async function seedIfEmpty(): Promise<void> {
    const existing = await store.allPackages();
    if (existing.length === 0) {
        await store.seed(SEED_PACKAGES);
        console.log(`[seed] loaded ${SEED_PACKAGES.length} starter packages`);
    }
}
