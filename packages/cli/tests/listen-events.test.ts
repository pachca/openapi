import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listenWebhookEvents } from '../src/webhook-listener.js';

const record = (id: string) => ({ id, event_type: 'message', payload: { text: id }, created_at: '2026-11-09T00:00:00Z' });
let abort: AbortController;
let streams: ReadableStreamDefaultController<Uint8Array>[];
let cancelled: number[];
let urls: string[];
let requests: { method: string; path: string; query?: Record<string, string | number> }[];
let delivered: string[];
let history: ReturnType<typeof record>[];
const encoder = new TextEncoder();
const realFetch = globalThis.fetch;

function send(index: number, data: unknown, event?: string) {
  streams[index].enqueue(encoder.encode(`${event ? `event: ${event}\n` : ''}data: ${JSON.stringify(data)}\n\n`));
}

async function request(opts: { method: string; path: string; query?: Record<string, string | number> }) {
  requests.push(opts);
  if (opts.path.endsWith('/stream')) {
    const url = `https://stream.example/events?secret=${urls.length + 1}`;
    urls.push(url);
    return { data: { url, expires_at: new Date(Date.now() + 3_600_000).toISOString() } };
  }
  if (opts.method === 'DELETE') return {};
  return { data: history, meta: { paginate: { has_next: false, next_page: null } } };
}

function start(options: Partial<Parameters<typeof listenWebhookEvents>[0]> = {}) {
  return listenWebhookEvents({
    request, signal: abort.signal,
    onEvent: async (event) => { delivered.push(event.id); },
    ...options,
  });
}

beforeEach(() => {
  abort = new AbortController();
  streams = []; cancelled = []; urls = []; requests = []; delivered = []; history = [];
  globalThis.fetch = vi.fn(async (_url, init) => {
    const index = streams.length;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { streams.push(controller); },
      cancel() { cancelled.push(index); },
    });
    init?.signal?.addEventListener('abort', () => {
      cancelled.push(index);
      try { streams[index].close(); } catch { /* already closed */ }
    });
    return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;
});

afterEach(() => {
  abort.abort();
  globalThis.fetch = realFetch;
  vi.useRealTimers();
});

describe('webhook event listener', () => {
  it('waits for subscription, drains all history oldest first and deduplicates buffered live events', async () => {
    const run = start({ request: async (opts) => {
      if (opts.path.endsWith('/stream') || opts.method === 'DELETE') return request(opts);
      requests.push(opts);
      return opts.query?.cursor
        ? { data: [record('old')], meta: { paginate: { has_next: false } } }
        : { data: [record('new')], meta: { paginate: { has_next: true, next_page: 'page2' } } };
    } });
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, record('new'));
    expect(requests.map((r) => r.path)).toEqual(['/webhooks/events/stream']);
    send(0, { type: 'confirm_subscription' }, 'confirm_subscription');
    await vi.waitFor(() => expect(delivered).toEqual(['old', 'new']));
    send(0, record('live'));
    await vi.waitFor(() => expect(delivered).toEqual(['old', 'new', 'live']));
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    expect(init?.redirect).toBe('error');
    abort.abort(); await run;
  });

  it('acknowledges only after successful processing, once for overlapping deliveries', async () => {
    let finish!: () => void;
    const run = start({ acknowledge: true, onEvent: async (event) => {
      delivered.push(event.id);
      await new Promise<void>((resolve) => { finish = resolve; });
    } });
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription');
    send(0, record('one')); send(0, record('one'));
    await vi.waitFor(() => expect(delivered).toEqual(['one']));
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false);
    finish();
    await vi.waitFor(() => expect(requests.filter((r) => r.method === 'DELETE')).toEqual([
      { method: 'DELETE', path: '/webhooks/events/one' },
    ]));
    abort.abort(); await run;
  });

  it('leaves history intact and closes streams when the handler fails', async () => {
    const run = start({ acknowledge: true, onEvent: async () => { throw new Error('Handler HTTP 500'); } });
    const outcome = expect(run).rejects.toThrow('Handler HTTP 500');
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription'); send(0, record('one'));
    await outcome;
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false);
    expect(cancelled).toContain(0);
  });

  it('reconnects after disconnect and rereads events missed while offline', async () => {
    vi.useFakeTimers();
    const run = start();
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    send(0, { type: 'disconnect', reconnect: false }, 'disconnect');
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.waitFor(() => expect(streams).toHaveLength(2));
    history = [record('missed')];
    send(1, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(delivered).toEqual(['missed']));
    abort.abort(); await run;
  });

  it('renews before expiry and keeps the old stream until the new history is drained', async () => {
    vi.useFakeTimers();
    let finishHistory!: (value: unknown) => void;
    const run = start({ request: async (opts) => {
      if (urls.length < 2 || opts.path.endsWith('/stream')) return request(opts);
      return new Promise((resolve) => { finishHistory = resolve; });
    } });
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    await vi.advanceTimersByTimeAsync(55 * 60_000);
    await vi.waitFor(() => expect(streams).toHaveLength(2));
    expect(cancelled).not.toContain(0);
    send(1, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(finishHistory).toBeTypeOf('function'));
    expect(cancelled).not.toContain(0);
    send(0, record('overlap')); send(1, record('overlap'));
    finishHistory({ data: [record('overlap')], meta: { paginate: { has_next: false } } });
    await vi.waitFor(() => expect(cancelled).toContain(0));
    expect(delivered).toEqual(['overlap']);
    abort.abort(); await run;
  });

  it('does not open a third connection when the old stream expires during renewal', async () => {
    vi.useFakeTimers();
    const run = start();
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    await vi.advanceTimersByTimeAsync(55 * 60_000);
    await vi.waitFor(() => expect(streams).toHaveLength(2));
    send(0, {}, 'disconnect');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(streams).toHaveLength(2);
    send(1, {}, 'confirm_subscription');
    await vi.waitFor(() => expect(requests.filter((r) => r.path === '/webhooks/events')).toHaveLength(2));
    abort.abort(); await run;
  });

  it('does not acknowledge an event when stopped during processing', async () => {
    const run = start({ acknowledge: true, onEvent: async () => { abort.abort(); } });
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription'); send(0, record('one'));
    await run;
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false);
  });

  it('fails on cyclic pagination instead of dropping pending history', async () => {
    const run = start({ request: async (opts) => {
      if (opts.path.endsWith('/stream')) return request(opts);
      return { data: [record('one')], meta: { paginate: { has_next: true, next_page: 'same' } } };
    } });
    const outcome = expect(run).rejects.toThrow(/пагинац/i);
    await vi.waitFor(() => expect(streams).toHaveLength(1));
    send(0, {}, 'confirm_subscription');
    await outcome;
    expect(delivered).toEqual([]);
  });
});
