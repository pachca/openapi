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

/** A failure worth reconnecting over: no answer, a timeout, a throttle or a server error. */
function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const code = error.details.code;
  return code === null || code === 429 || (code ?? 0) >= 500;
}

// Without acknowledgements the history only grows, so a re-read stops at records older than
// the newest one already handled, minus this margin for records committed out of order.
const REREAD_MARGIN_MS = 5 * 60_000;

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
  let newest: number | undefined;
  const connections = new Map<EventSource, { renew: ReturnType<typeof setTimeout>; confirm?: ReturnType<typeof setTimeout> }>();
  let current: EventSource | undefined;
  let candidate: EventSource | undefined;
  let connecting = false;
  // A failure closes every link and starts over: a connect() begun before it must not open one more.
  let generation = 0;
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
    queue = queue.then(async () => { if (!stopped) await work(); }).catch(fail);
  }

  // A transient API failure while reading history or acknowledging is a lost connection:
  // reconnect, and the next confirmation re-reads the history, where unacknowledged records wait.
  function fail(error: unknown) {
    if (stopped) return;
    if (!isTransient(error) || options.retry === false) { stop(error); return; }
    generation++;
    // Including a stream being replaced: its successor failed before closing it.
    for (const stream of [...connections.keys()]) close(stream);
    current = undefined;
    candidate = undefined;
    connecting = false;
    retry();
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
    const created = Date.parse(event.created_at);
    if (Number.isFinite(created) && (newest === undefined || created > newest)) newest = created;
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
      const page = body.data.map(eventRecord);
      records.push(...page);
      if (!body.meta?.paginate?.has_next) break;
      // History comes newest first. Records already printed stay in it, so stop once a page
      // reaches past the newest handled one. With acknowledgements the history holds only the rest.
      const oldest = Date.parse(page.at(-1)?.created_at ?? '');
      if (!options.acknowledge && newest !== undefined && oldest < newest - REREAD_MARGIN_MS) break;
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
    const started = generation;
    try {
      const body = await request({ method: 'GET', path: '/webhooks/events/stream' }) as {
        data: { url: string; expires_at: string };
      };
      if (stopped || started !== generation) return;
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
        timers.confirm = undefined;
        if (candidate === stream) { candidate = undefined; connecting = false; }
        ready = false;
        const previous = current;
        current = stream;
        enqueue(async () => {
          await readHistory();
          // Events keep arriving while earlier ones are handled: drain until the buffer is empty.
          while (pending.length) await consume(pending.shift()!);
          ready = true;
          if (previous && previous !== stream) close(previous);
        });
      });
      stream.addEventListener('disconnect', lost);
      stream.addEventListener('error', () => {
        ready = false;
        if (options.retry === false || stream.readyState === EventSource.CLOSED) { lost(); return; }
        // EventSource retries network failures itself; confirmation triggers another history read.
        // The deadline is armed once per unconfirmed period, so endless failures end in a new link.
        timers.confirm ??= setTimeout(lost, timeoutMs);
      });
    } catch (error) {
      if (started !== generation) return;
      connecting = false;
      if (isTransient(error)) retry();
      else {
        if (error instanceof ApiError && error.details.code === 404) {
          error.details.hint = 'Нужен токен бота с включённой историей событий: ' +
            '«Сохранять историю событий» в настройках бота или events_history_enabled';
        }
        stop(error);
      }
    }
  }

  void connect();
  await finished;
}
