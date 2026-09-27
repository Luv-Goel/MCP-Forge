'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, StopCircle, Trash2 } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    message: string;
}

export function SandboxTester({ packageSlug }: { packageSlug: string }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeTab, setActiveTab] = useState('invoke');
    const [requestInput, setRequestInput] = useState(
        '{\n  "method": "list_tools",\n  "params": {}\n}',
    );
    const [responseOutput, setResponseOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [rateLimit, setRateLimit] = useState({ limit: 10, remaining: 10, reset: 0 });

    const logMessage = (level: string, message: string) => {
        setLogs((prev) => [
            ...prev,
            { id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), level, message },
        ]);
    };

    const handleRunRequest = async () => {
        if (isRunning) return;
        if (rateLimit.remaining <= 0) {
            logMessage('error', `Rate limit exceeded. Reset in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`);
            return;
        }
        let request: unknown;
        try {
            request = JSON.parse(requestInput);
        } catch {
            logMessage('error', 'Invalid JSON in request body');
            return;
        }

        setIsRunning(true);
        setResponseOutput('');
        logMessage('info', `Sending ${(request as { method?: string }).method ?? 'request'} to sandbox...`);
        try {
            const res = await fetch('/api/agent/sandbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ package: packageSlug, request }),
            });
            const body = await res.json();
            if (body.rateLimit) setRateLimit(body.rateLimit);
            if (!res.ok) {
                logMessage('error', body.message ?? `Request failed (${res.status})`);
                setResponseOutput(JSON.stringify(body, null, 2));
            } else {
                logMessage('info', `Response received in ${body.duration_ms ?? '?'}ms`);
                if (body.error) logMessage('error', body.error);
                setResponseOutput(JSON.stringify(body.response ?? body, null, 2));
            }
        } catch (e) {
            logMessage('error', `Sandbox request failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleCancel = () => {
        // Requests have a hard server-side timeout; cancel is best-effort UX.
        setIsRunning(false);
        logMessage('info', 'Request session reset (server enforces a 15s timeout)');
    };

    const clearLogs = () => setLogs([]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>MCP Sandbox Tester</CardTitle>
                <CardDescription>
                    Interact with <strong>{packageSlug}</strong> in a safe, time-boxed sandbox.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Rate limit: {rateLimit.remaining}/{rateLimit.limit} per minute
                    </span>
                    <Button variant="outline" size="sm" onClick={clearLogs}>
                        <Trash2 className="mr-1 h-4 w-4" /> Clear Logs
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                    <TabsList>
                        <TabsTrigger value="invoke">Invoke</TabsTrigger>
                        <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoke">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Request JSON</label>
                                <Textarea
                                    value={requestInput}
                                    onChange={(e) => setRequestInput(e.target.value)}
                                    className="h-64 font-mono"
                                />
                                <div className="mt-2 flex space-x-2">
                                    <Button disabled={isRunning} onClick={handleRunRequest}>
                                        <Play className="mr-1 h-4 w-4" /> Run
                                    </Button>
                                    <Button variant="destructive" disabled={!isRunning} onClick={handleCancel}>
                                        <StopCircle className="mr-1 h-4 w-4" /> Cancel
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Response</label>
                                <Textarea readOnly value={responseOutput} className="h-64 font-mono" />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs">
                        <ScrollArea className="h-80 rounded border p-2">
                            {logs.length === 0 && <p className="p-2 text-sm text-gray-400">No logs yet.</p>}
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex space-x-2 text-sm ${
                                        log.level === 'error'
                                            ? 'text-red-600'
                                            : log.level === 'warn'
                                              ? 'text-yellow-600'
                                              : 'text-gray-600'
                                    }`}
                                >
                                    <span className="w-24 shrink-0">[{log.timestamp.slice(11, 19)}]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
