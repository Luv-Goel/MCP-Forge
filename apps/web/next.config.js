/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/v1/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/v1/:path*`,
            },
            {
                source: '/health',
                destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/health`,
            },
        ];
    },
    images: {
        unoptimized: true,
    },
    allowedDevOrigins: ['.monkeycode-ai.live'],
};

module.exports = nextConfig;
