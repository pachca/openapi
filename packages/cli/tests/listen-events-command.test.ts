import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import * as path from 'node:path';
import { createHmac } from 'node:crypto';

let server: Server;
let child: ChildProcess | undefined;
let stream: ServerResponse | undefined;
let base: string;
let stdout: string;
let stderr: string;
let calls: { url: string; method: string; authorization?: string; body: string; headers: Record<string, string | string[] | undefined> }[];
let forwardStatus: number;
let forwardBody: string;
let scopes: string[];
let historyRecords: unknown[];
let viewsStatus: number;
let viewsFailures: number;
let streamStatus: number;
let serverSkewMs: number;
const formRecord = (createdAt = new Date().toISOString()) => ({ id: 'form-1', event_type: 'view_submit', created_at: createdAt,
  payload: { type: 'view', event: 'submit', view_id: 'view-1', submit_id: 'submit-1', data: {}, webhook_timestamp: 1 } });
const event = { id: 'delivery-1', event_type: 'message', payload: { type: 'message', content: 'hello' }, created_at: '2026-11-09T00:00:00Z' };

beforeEach(async () => {
  calls = []; stdout = ''; stderr = ''; forwardStatus = 204; forwardBody = '';
  scopes = ['webhooks:events:read', 'webhooks:events:delete', 'views:write'];
  historyRecords = [event];
  viewsStatus = 200; viewsFailures = 0; streamStatus = 200; serverSkewMs = 0;
  server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    calls.push({ url: req.url!, method: req.method!, authorization: req.headers.authorization, body, headers: req.headers });
    res.setHeader('date', new Date(Date.now() + serverSkewMs).toUTCString());
    if (req.url === '/webhooks/events/stream' && streamStatus !== 200) {
      res.statusCode = streamStatus; res.end();
    } else if (req.url === '/webhooks/events/stream') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: { url: `${base}/stream?secret=hidden`, expires_at: new Date(Date.now() + 3_600_000).toISOString() } }));
    } else if (req.url?.startsWith('/stream?')) {
      stream = res;
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('event: confirm_subscription\ndata: {"type":"confirm_subscription"}\n\n');
    } else if (req.url?.startsWith('/webhooks/events?')) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: historyRecords, meta: { paginate: { has_next: false } } }));
    } else if (req.url === '/oauth/token/info') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ data: { user_id: 1, scopes } }));
    } else if (req.url?.startsWith('/views/') && viewsFailures > 0) {
      viewsFailures--;
      res.statusCode = 503; res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ errors: [{ key: 'service', value: 'unavailable' }] }));
    } else if (req.url?.startsWith('/views/')) {
      res.statusCode = viewsStatus;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(viewsStatus === 200 ? { data: { success: true } } : { errors: [{ key: 'scope', value: 'insufficient_scope' }] }));
    } else if (req.url === '/forward') {
      res.statusCode = forwardStatus;
      if (forwardStatus === 302) res.setHeader('location', `${base}/unexpected`);
      if (forwardBody) res.setHeader('content-type', 'application/json');
      res.end(forwardBody);
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

function run(args: string[] = [], env: Record<string, string> = {}) {
  child = spawn(process.execPath, [path.resolve('bin/run.js'), 'bots', 'listen-events', '--token', 'test-bot-token', ...args], {
    env: { ...process.env, PACHCA_SIGNING_SECRET: '', PACHCA_API_URL: base, PACHCA_SKIP_NEW_VERSION_CHECK: '1', PACHCA_SECRET_STORE: 'file', ...env },
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

  it('signs the forwarded body like a webhook, with a fresh timestamp and the record id as Idempotency-Key', async () => {
    historyRecords = [{ ...event, payload: { type: 'message', content: 'hello', webhook_timestamp: 1_700_000_000 } }];
    const exit = run(['--forward-to', `${base}/forward`], { PACHCA_SIGNING_SECRET: 'pachca_wh_test' });
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    const forwarded = calls.find((r) => r.url === '/forward')!;
    const sent = JSON.parse(forwarded.body);
    expect(Math.abs(sent.webhook_timestamp - Date.now() / 1000)).toBeLessThan(60);
    const expected = createHmac('sha256', 'pachca_wh_test').update(forwarded.body).digest('hex');
    expect(forwarded.headers['pachca-signature']).toBe(expected);
    expect(forwarded.headers['idempotency-key']).toBe('delivery-1');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it.each([
    [204, '', { submit_id: 'submit-1' }],
    [422, JSON.stringify({ errors: { date: 'Неверная дата' } }), { submit_id: 'submit-1', errors: { date: 'Неверная дата' } }],
  ])('relays a %i reply to a form submission to Pachca, then acknowledges', async (status, reply, answer) => {
    historyRecords = [formRecord()];
    forwardStatus = status; forwardBody = reply;
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    const submit = calls.find((r) => r.url === '/views/view-1/submit_response')!;
    expect(JSON.parse(submit.body)).toEqual(answer);
    expect(calls.findIndex((r) => r.url.startsWith('/views/'))).toBeLessThan(calls.findIndex((r) => r.method === 'DELETE'));
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it('acknowledges a form submission without answering it when the token lacks views:write', async () => {
    scopes = ['webhooks:events:read', 'webhooks:events:delete'];
    historyRecords = [formRecord()];
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    expect(calls.some((r) => r.url === '/forward')).toBe(true);
    expect(calls.some((r) => r.url.startsWith('/views/'))).toBe(false);
    expect(stderr).toContain('views:write');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it('acknowledges a form submission when Pachca refuses the answer', async () => {
    historyRecords = [formRecord()];
    viewsStatus = 403;
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    expect(calls.findIndex((r) => r.url.startsWith('/views/'))).toBeLessThan(calls.findIndex((r) => r.method === 'DELETE'));
    expect(stderr).toContain('submit-1');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it('repeats the answer to a form after a 503, while Pachca keeps the submission open', async () => {
    historyRecords = [formRecord()];
    viewsFailures = 1;
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    expect(calls.filter((r) => r.url === '/views/view-1/submit_response')).toHaveLength(2);
    expect(stderr).not.toContain('не передан');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it.each([10 * 60_000, 20_000])('skips a form submission %i ms old instead of forwarding it', async (age) => {
    historyRecords = [formRecord(new Date(Date.now() - age).toISOString())];
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    expect(calls.some((r) => r.url === '/forward' || r.url.startsWith('/views/'))).toBe(false);
    expect(stderr).toContain('form-1');
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it.each([
    ['skips', 0, false],
    ['forwards', 30_000, true],
  ])('%s a form submission by the age on Pachca\'s clock when the local clock is 30 s behind', async (_, createdAhead, forwarded) => {
    serverSkewMs = 30_000;
    historyRecords = [formRecord(new Date(Date.now() + createdAhead).toISOString())];
    const exit = run(['--forward-to', `${base}/forward`]);
    await vi.waitFor(() => expect(calls.some((r) => r.method === 'DELETE'), stderr).toBe(true), { timeout: 5_000 });
    expect(calls.some((r) => r.url === '/forward')).toBe(forwarded);
    child!.kill('SIGINT');
    expect((await exit)[0]).toBe(0);
  });

  it('refuses to forward without the right to delete history records, as a scope error', async () => {
    scopes = ['webhooks:events:read'];
    const exit = run(['--forward-to', `${base}/forward`]);
    expect((await exit)[0]).toBe(3);
    expect(stderr).toContain('webhooks:events:delete');
    expect(JSON.parse(stderr.trim().split('\n').at(-1)!)).toMatchObject({ type: 'PACHCA_SCOPE_ERROR', scope: 'webhooks:events:delete' });
    expect(calls.some((r) => r.url === '/webhooks/events/stream')).toBe(false);
  });

  it('exits with code 4 and a hint when the event stream is unavailable', async () => {
    streamStatus = 404;
    const exit = run();
    expect((await exit)[0]).toBe(4);
    expect(stderr).toContain('Сохранять историю событий');
    expect(JSON.parse(stderr.trim().split('\n').at(-1)!)).toMatchObject({ code: 404 });
  });

  it('documents --no-retry as reconnection only', async () => {
    child = spawn(process.execPath, [path.resolve('bin/run.js'), 'bots', 'listen-events', '--help'], {
      env: { ...process.env, PACHCA_SKIP_NEW_VERSION_CHECK: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout!.on('data', (data) => { stdout += data; });
    await once(child, 'exit');
    expect(stdout).toContain('Не переподключаться');
    expect(stdout).not.toContain('Disable auto-retry');
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
