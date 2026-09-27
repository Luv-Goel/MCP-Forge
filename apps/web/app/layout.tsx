import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'MCP Forge - The trusted operating layer for MCP servers',
        template: '%s | MCP Forge',
    },
    description:
        'Discover, validate, score, and install MCP servers with confidence. Trust signals, sandbox testing, and one-click configs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-white text-gray-900 antialiased">
                <SiteHeader />
                <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
                <footer className="border-t border-gray-200 py-6">
                    <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
                        MCP Forge - the trusted operating layer for the MCP ecosystem.
                    </div>
                </footer>
            </body>
        </html>
    );
}
