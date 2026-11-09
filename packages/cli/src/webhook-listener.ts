import { EventSource } from 'eventsource';
import { ApiError } from './client.js';

export interface WebhookEvent {
  id: string;
  event_type: string;
  payload: unknown;
  created_at: string;
}

interface ListenerOptions {
  request: (opts: { method: string; path: string; query?: Record<string, string | number> }) => Promise<unknown>;
  onEvent: (event: WebhookEvent) => Promise<void>;
  signal: AbortSignal;
  acknowledge?: boolean;
  retry?: boolean;
  timeoutMs?: number;
  onReconnect?: () => void;
}

function eventRecord(value: unknown): WebhookEvent {
  const event = value as WebhookEvent | null;
  if (!event || typeof event.id !== 'string' || !event.id ||
      typeof event.event_type !== 'string' || typeof event.created_at !== 'string' ||
      !Object.hasOwn(event, 'payload')) {
    throw new Error('Некорректная запись истории событий');
  }
  return event;
}

/** A single serial consumer for history and live events, including overlapping connections. */
export async function listenWebhookEvents(options: ListenerOptions): Promise<void> {
  const { request, signal } = options;
  if (signal.aborted) return;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const processed = new Set<string>();
  const connections = new Map<EventSource, { renew: ReturnType<typeof setTimeout>; confirm?: ReturnType<typeof setTimeout> }>();
  let current: EventSource | undefined;
  let candidate: EventSource | undefined;
  let connecting = false;
  let stopped = false;
  let reconnect: ReturnType<typeof setTimeout> | undefined;
  let queue = Promise.resolve();
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const finished = new Promise<void>((ok, fail) => { resolve = ok; reject = fail; });

  function close(stream: EventSource) {
    const timers = connections.get(stream);
    clearTimeout(timers?.renew);
    clearTimeout(timers?.confirm);
    connections.delete(stream);
    stream.close();
  }

  function stop(error?: unknown) {
    if (stopped) return;
    stopped = true;
    clearTimeout(reconnect);
    for (const stream of connections.keys()) close(stream);
    signal.removeEventListener('abort', onAbort);
    if (error) reject(error); else resolve();
  }
  const onAbort = () => stop();
  signal.addEventListener('abort', onAbort, { once: true });

  function enqueue(work: () => Promise<void>) {
    queue = queue.then(async () => { if (!stopped) await work(); }).catch(stop);
  }

  async function consume(event: WebhookEvent) {
    if (stopped || processed.has(event.id)) return;
    await options.onEvent(event);
    if (stopped) return;
    if (options.acknowledge) {
      try {
        await request({ method: 'DELETE', path: `/webhooks/events/${encodeURIComponent(event.id)}` });
      } catch (error) {
        // 404: already deleted (a retried DELETE whose first attempt went through, or another consumer).
        if (!(error instanceof ApiError && error.details.code === 404)) throw error;
      }
    }
    processed.add(event.id);
    // Bound memory in an indefinitely running observer. Consumers still need payload idempotency.
    if (processed.size > 10_000) processed.delete(processed.values().next().value!);
  }

  async function readHistory() {
    const records: WebhookEvent[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      if (stopped) return;
      const body = await request({
        method: 'GET', path: '/webhooks/events', query: { limit: 50, ...(cursor ? { cursor } : {}) },
      }) as { data: unknown[]; meta?: { paginate?: { has_next?: boolean; next_page?: string } } };
      if (!Array.isArray(body?.data)) throw new Error('Некорректный ответ истории событий');
      records.push(...body.data.map(eventRecord));
      if (!body.meta?.paginate?.has_next) break;
      cursor = body.meta.paginate.next_page;
      if (!cursor || cursors.has(cursor)) throw new Error('Некорректная пагинация истории событий');
      cursors.add(cursor);
    } while (true);
    for (const record of records.reverse()) await consume(record);
  }

  function retry() {
    if (stopped || connecting || reconnect) return;
    if (options.retry === false) { stop(new Error('Соединение с потоком событий прервано')); return; }
    options.onReconnect?.();
    reconnect = setTimeout(() => {
      reconnect = undefined;
      void connect();
    }, 5_000);
  }

  async function connect() {
    if (stopped || connecting) return;
    connecting = true;
    try {
      const body = await request({ method: 'GET', path: '/webhooks/events/stream' }) as {
        data: { url: string; expires_at: string };
      };
      if (stopped) return;
      let url: URL;
      const expires = Date.parse(body?.data?.expires_at);
      try { url = new URL(body?.data?.url); } catch { throw new Error('Некорректная ссылка потока событий'); }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
          !Number.isFinite(expires) || expires <= Date.now()) {
        throw new Error('Некорректная ссылка потока событий');
      }
      // Never pass the API bearer token or log this capability URL, even on fetch errors.
      const stream = new EventSource(url, {
        fetch: (input, init) => fetch(input, { ...init, redirect: 'error' }),
      });
      let ready = false;
      const pending: WebhookEvent[] = [];
      function lost() {
        if (!connections.has(stream)) return;
        const wasCurrent = current === stream;
        const wasCandidate = candidate === stream;
        close(stream);
        if (wasCurrent) current = undefined;
        if (wasCandidate) { candidate = undefined; connecting = false; }
        if (wasCurrent || wasCandidate) retry();
      }
      const timers = {
        renew: setTimeout(() => { if (current === stream) void connect(); }, Math.max(1_000, expires - Date.now() - 300_000)),
        confirm: setTimeout(lost, timeoutMs) as ReturnType<typeof setTimeout> | undefined,
      };
      candidate = stream;
      connections.set(stream, timers);
      stream.addEventListener('message', (message) => {
        try {
          const event = eventRecord(JSON.parse(message.data));
          if (ready) enqueue(() => consume(event)); else pending.push(event);
        } catch { stop(new Error('Некорректное событие в потоке')); }
      });
      stream.addEventListener('confirm_subscription', () => {
        clearTimeout(timers.confirm);
        if (candidate === stream) { candidate = undefined; connecting = false; }
        ready = false;
        const previous = current;
        current = stream;
        enqueue(async () => {
          await readHistory();
          for (const event of pending.splice(0)) await consume(event);
          ready = true;
          if (previous && previous !== stream) close(previous);
        });
      });
      stream.addEventListener('disconnect', lost);
      stream.addEventListener('error', () => {
        ready = false;
        if (options.retry === false || stream.readyState === EventSource.CLOSED) { lost(); return; }
        // EventSource retries network failures itself; confirmation triggers another history read.
        clearTimeout(timers.confirm);
        timers.confirm = setTimeout(lost, timeoutMs);
      });
    } catch (error) {
      connecting = false;
      if (error instanceof ApiError &&
          (error.details.code === null || error.details.code === 429 || (error.details.code ?? 0) >= 500)) {
        retry();
      } else stop(error);
    }
  }

  void connect();
  await finished;
}
