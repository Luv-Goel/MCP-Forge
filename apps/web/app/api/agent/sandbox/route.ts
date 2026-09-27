import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';

// Simple WebSocket handler – forwards JSON‑RPC requests to the Python probe runner.
export async function GET(req: Request) {
  // Upgrade to WebSocket
  if (!req.headers.get('upgrade')?.includes('websocket')) {
    return new NextResponse('Upgrade required', { status: 426 });
  }

  const { socket, response } = await (await import('next')).WebSocketServer();

  const url = new URL(req.url);
  const pkg = url.searchParams.get('package');
  if (!pkg) {
    socket.send(JSON.stringify({ type: 'error', message: 'Missing package query param' }));
    socket.close();
    return response;
  }

  // Path to the probe script
  const probeScript = path.resolve(process.cwd(), '../../..', 'packages', 'runtime', 'src', 'probe.py');

  // Spawn a child Python process for each connection (isolated session)
  const py = spawn('python', [probeScript, path.resolve(process.cwd(), '../../..', 'schemas', 'mcp.package.v1.schema.json')]);

  // Simple rate‑limit (10 requests per minute)
  let remaining = 10;
  let reset = Date.now() + 60_000;

  const sendRateLimit = () => {
    socket.send(JSON.stringify({ type: 'rate_limit', data: { limit: 10, remaining, reset } }));
  };

  // Forward messages from client to Python stdin
  socket.on('message', (msg: any) => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
      if (data.type === 'cancel') {
        py.kill('SIGINT');
        socket.send(JSON.stringify({ type: 'log', level: 'info', message: 'Request cancelled' }));
        return;
      }
      if (data.type === 'request') {
        if (remaining <= 0) {
          socket.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded' }));
          return;
        }
        const payload = JSON.stringify(data.data);
        py.stdin.write(payload + '\n');
        remaining--;
        sendRateLimit();
      } else if (data.type === 'permission_response') {
        // For now just echo back; real implementation would forward to probe process
        socket.send(JSON.stringify({ type: 'log', level: data.granted ? 'info' : 'warn', message: `${data.granted ? 'Granted' : 'Denied'} permission ${data.id}` }));
      }
    } catch (e) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  // Capture stdout from the Python probe – expected to be JSON lines
  py.stdout.setEncoding('utf8');
  py.stdout.on('data', (data) => {
    const lines = data.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.success !== undefined) {
          socket.send(JSON.stringify({ type: 'response', data: obj }));
        } else {
          socket.send(JSON.stringify({ type: 'log', level: 'debug', message: line }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'log', level: 'debug', message: line }));
      }
    }
  });

  py.stderr.on('data', (data) => {
    socket.send(JSON.stringify({ type: 'log', level: 'error', message: data.toString() }));
  });

  py.on('close', (code) => {
    socket.send(JSON.stringify({ type: 'log', level: 'info', message: `Probe process exited with code ${code}` }));
    socket.close();
  });

  // Initial rate‑limit info
  sendRateLimit();

  return response;
}
