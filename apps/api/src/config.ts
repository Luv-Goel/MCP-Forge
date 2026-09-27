/**
 * Centralized environment-based configuration for the MCP Forge API.
 */
const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export const config = {
    port: Number.parseInt(env('PORT', '8080'), 10),
    host: env('HOST', '0.0.0.0'),
    logLevel: env('LOG_LEVEL', 'info'),
    /** Path to the JSON persistence file. Empty string disables persistence (memory only). */
    dataFile: env('DATA_FILE', 'data/packages.json'),
    /** Rate limit: max requests per time window. */
    rateLimit: {
        max: Number.parseInt(env('RATE_LIMIT_MAX', '120'), 10),
        timeWindow: env('RATE_LIMIT_WINDOW', '1 minute'),
    },
    corsOrigin: env('CORS_ORIGIN', '*'),
};

export default config;
