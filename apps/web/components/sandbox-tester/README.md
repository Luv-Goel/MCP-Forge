# Sandbox Tester Component (Phase 3)

This React component provides a safe test console for MCP servers with bounded permissions and visible logs.

## Usage

```tsx
import { SandboxTester } from '@/components/sandbox-tester';

<SandboxTester packageSlug="my-mcp-server" />
```

## Implementation

- Browser-based JSON-RPC test console
- Visible logs for all requests/responses  
- Permission prompts for filesystem/network access
- Rate limiting and request cancellation
- Masked secrets in output

## Security Features

- Least-privilege sandbox by default
- No persistent storage of secrets
- SSRF protection via domain allowlist
- Max request size: 1MB
- Timeout: 30 seconds per request