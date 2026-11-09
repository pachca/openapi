import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import * as path from 'node:path';

let server: Server;
let child: ChildProcess | undefined;
let stream: ServerResponse | undefined;
let base: string;
let stdout: string;
let stderr: string;
let calls: { url: string; method: string; authorization?: string; body: string }[];
let forwardStatus: number;
const event = { id: 'delivery-1', event_type: 'message', payload: { type: 'message', content: 'hello' }, created_at: '2026-11-09T00:00:00Z' };

beforeEach(async () => {
  calls = []; stdout = ''; stderr = ''; forwardStatus = 204;
  server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    calls.push({ url: req.url!, method: req.method!, authorization: req.headers.authorization, body });
    if (req.url === '/webhooks/events/stream') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: { url: `${base}/stream?secret=hidden`, expires_at: new Date(Date.now() + 3_600_000).toISOString() } }));
    } else if (req.url?.startsWith('/stream?')) {
      stream = res;
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('event: confirm_subscription\ndata: {"type":"confirm_subscription"}\n\n');
    } else if (req.url?.startsWith('/webhooks/events?')) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: [event], meta: { paginate: { has_next: false } } }));
    } else if (req.url === '/forward') {
      res.statusCode = forwardStatus;
      if (forwardStatus === 302) res.setHeader('location', `${base}/unexpected`);
      res.end();
    } else { res.statusCode = 204; res.end(); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterEach(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGKILL'); await once(child, 'exit');
  }
  child = undefined; stream = undefined;
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function run(args: string[] = []) {
  child = spawn(process.execPath, [path.resolve('bin/run.js'), 'bots', 'listen-events', '--token', 'test-bot-token', ...args], {
    env: { ...process.env, PACHCA_API_URL: base, PACHCA_SKIP_NEW_VERSION_CHECK: '1', PACHCA_SECRET_STORE: 'file' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout!.on('data', (data) => { stdout += data; });
  child.stderr!.on('data', (data) => { stderr += data; });
  return once(child, 'exit');
}

describe('bots listen-events command', () => {
  it('prints JSONL without deleting history, keeps signed URLs out of verbose logs and exits on SIGINT', async () => {
    const exit = run(['--verbose']);
    await vi.waitFor(() => expect(stdout, stderr).toContain('delivery-1'), { timeout: 5_000 });
    expect(stdout.trim().split('\n').map((line) => JSON.parse(line))).toEqual([event]);
    expect(calls.some((r) => r.method === 'DELETE')).toBe(false);
    expect(calls.find((r) => r.url.startsWith('/stream?'))?.authorization).toBeUndefined();
    expect(calls.find((r) => r.url.startsWith('/webhooks/events?'))?.authorization).toBe('Bearer test-bot-token');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
    expect(stderr).not.toContain('secret=hidden');
    expect(stderr).not.toContain('test-bot-token');
  });

  it('forwards only payload, then acknowledges on 2xx without leaking authorization', async () => {
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    const forwarded = calls.find((r) => r.url === '/forward')!;
    expect(JSON.parse(forwarded.body)).toEqual({ type: 'message', content: 'hello' });
    expect(forwarded.authorization).toBeUndefined();
    expect(calls.findIndex((r) => r.url === '/forward')).toBeLessThan(calls.findIndex((r) => r.method === 'DELETE'));
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
    expect(stdout).toBe('');
  });

  it.each([500, 302])('stops on forward HTTP %s, keeps history and does not follow redirects', async (status) => {
    forwardStatus = status;
    const exit = run(['--forward-to', `${base}/forward`]);
    expect((await exit)[0]).not.toBe(0);
    expect(calls.some((r) => r.url === '/forward')).toBe(true);
    expect(calls.some((r) => r.url === '/unexpected' || r.method === 'DELETE')).toBe(false);
    expect(stderr).not.toContain('secret=hidden');
  });

  it('dry-run performs no network requests or forwarding', async () => {
    const exit = run(['--dry-run', '--forward-to', `${base}/forward`]);
    expect((await exit)[0]).toBe(0);
    expect(calls).toEqual([]);
    expect(stdout).toContain('/webhooks/events/stream');
  });

  it('rejects credentials in the forwarding URL before making a request', async () => {
    const exit = run(['--forward-to', 'https://user:password@example.com']);
    expect((await exit)[0]).toBe(2);
    expect(calls).toEqual([]);
    expect(stderr + stdout).toContain('HTTP(S)');
    expect(stderr + stdout).not.toContain('password');
  });
});
