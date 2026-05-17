import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, XCircle, CheckCircle2, Loader2, Play, StopCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface PermissionRequest {
  id: string;
  type: 'filesystem' | 'network' | 'env';
  resource: string;
  granted: boolean;
  reason: string;
}

export function SandboxTester({ packageSlug }: { packageSlug: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState('invoke');
  const [requestInput, setRequestInput] = useState('{\n  "jsonrpc": "2.0",\n  "id": 1,\n  "method": "list_tools",\n  "params": {}\n}');
  const [responseOutput, setResponseOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [pendingPermission, setPendingPermission] = useState<PermissionRequest | null>(null);
  const [rateLimit, setRateLimit] = useState({ limit: 10, remaining: 10, reset: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/agent/sandbox?package=${packageSlug}`;
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onopen = () => {
      logMessage('info', 'Connected to sandbox agent');
      setRateLimit({ limit: 10, remaining: 10, reset: Date.now() + 60000 });
    };
    wsRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'log') {
        logMessage(msg.level, msg.message, msg.data);
      } else if (msg.type === 'response') {
        setResponseOutput(JSON.stringify(msg.data, null, 2));
        setIsRunning(false);
      } else if (msg.type === 'permission_request') {
        setPendingPermission({
          id: msg.id,
          type: msg.permission_type,
          resource: msg.resource,
          granted: false,
          reason: msg.reason,
        });
      } else if (msg.type === 'rate_limit') {
        setRateLimit(msg.data);
      }
    };
    wsRef.current.onerror = () => logMessage('error', 'WebSocket connection error');
    wsRef.current.onclose = () => {
      logMessage('warn', 'Disconnected from sandbox agent');
      setIsRunning(false);
    };
    return () => wsRef.current?.close();
  }, [packageSlug]);

  // Auto‑scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const logMessage = (level: LogEntry['level'], message: string, data?: any) => {
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), level, message, data },
    ]);
  };

  const handleRunRequest = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logMessage('error', 'Not connected to sandbox agent');
      return;
    }
    if (rateLimit.remaining <= 0) {
      logMessage('error', `Rate limit exceeded. Reset in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`);
      return;
    }
    try {
      const request = JSON.parse(requestInput);
      setIsRunning(true);
      setResponseOutput('');
      wsRef.current.send(JSON.stringify({ type: 'request', data: request }));
      logMessage('info', `Sent request: ${request.method}`);
      setRateLimit((prev) => ({ ...prev, remaining: prev.remaining - 1 }));
    } catch (e) {
      logMessage('error', `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleCancel = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel' }));
      logMessage('info', 'Request cancelled');
      setIsRunning(false);
    }
  };

  const handleGrantPermission = (granted: boolean) => {
    if (!pendingPermission) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'permission_response', id: pendingPermission.id, granted }));
      setPermissions((p) => [...p, { ...pendingPermission, granted }]);
      logMessage(granted ? 'info' : 'warn', `${granted ? 'Granted' : 'Denied'} ${pendingPermission.type} for ${pendingPermission.resource}`);
      setPendingPermission(null);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>MCP Sandbox Tester</CardTitle>
        <CardDescription>Interact with <strong>{packageSlug}</strong> in a safe sandbox.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm">Rate limit: {rateLimit.remaining}/{rateLimit.limit}</span>
          <Button variant="outline" size="sm" onClick={clearLogs}>Clear Logs</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="invoke">Invoke</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="invoke">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Request JSON</label>
                <Textarea
                  value={requestInput}
                  onChange={(e) => setRequestInput(e.target.value)}
                  className="font-mono h-64"
                />
                <div className="mt-2 flex space-x-2">
                  <Button disabled={isRunning} onClick={handleRunRequest}> <Play className="mr-1 h-4 w-4" /> Run</Button>
                  <Button variant="destructive" disabled={!isRunning} onClick={handleCancel}> <StopCircle className="mr-1 h-4 w-4" /> Cancel</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Response</label>
                <Textarea readOnly value={responseOutput} className="font-mono h-64" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <ScrollArea className="h-80 border rounded p-2">
              {logs.map((log) => (
                <div key={log.id} className={`flex space-x-2 text-sm ${log.level === 'error' ? 'text-red-600' : log.level === 'warn' ? 'text-yellow-600' : 'text-gray-600'}`}>
                  <span className="w-24">[{log.timestamp.slice(11,19)}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="permissions">
            {pendingPermission && (
              <Alert variant="warning">
                <AlertTitle>Permission Request</AlertTitle>
                <AlertDescription>
                  <p>{pendingPermission.reason}</p>
                  <p><strong>Type:</strong> {pendingPermission.type}</p>
                  <p><strong>Resource:</strong> {pendingPermission.resource}</p>
                  <div className="mt-2 flex space-x-2">
                    <Button onClick={() => handleGrantPermission(true)}>Grant</Button>
                    <Button variant="destructive" onClick={() => handleGrantPermission(false)}>Deny</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <ul className="mt-2 space-y-1">
              {permissions.map((p) => (
                <li key={p.id} className="text-sm">
                  <Shield className="inline w-4 h-4 mr-1" /> {p.type} {p.granted ? 'granted' : 'denied'} for {p.resource}
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
