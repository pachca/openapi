import { createHmac } from 'node:crypto';
import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { ApiError, resolveTimeoutSeconds } from '../../client.js';
import { listenWebhookEvents, type WebhookEvent } from '../../webhook-listener.js';

interface FormSubmit {
  view_id: string;
  submit_id: string;
}

/** A `view_submit` payload carries what the answer to the form needs. */
function formSubmit(payload: unknown): FormSubmit | undefined {
  const p = payload as Record<string, unknown> | null;
  if (!p || p.type !== 'view' || p.event !== 'submit') return undefined;
  if (typeof p.view_id !== 'string' || typeof p.submit_id !== 'string') return undefined;
  return { view_id: p.view_id, submit_id: p.submit_id };
}

/** Pachca stamps every delivery attempt anew, so a record replayed from the history gets the time of forwarding. */
function withFreshTimestamp(payload: unknown): unknown {
  const p = payload as Record<string, unknown> | null;
  if (!p || typeof p !== 'object' || Array.isArray(p) || typeof p.webhook_timestamp !== 'number') return payload;
  return { ...p, webhook_timestamp: Math.floor(Date.now() / 1000) };
}

// Pachca takes the answer to a form for 5 seconds and then shows the employee a sending error.
// A submission older than this is one the employee saw fail. The age is measured on Pachca's clock,
// from the Date header of the last API response: 10 s leave room for its whole seconds and transit.
const FORM_STALE_MS = 10_000;
// With no Date header the local clock may differ from Pachca's, so the margin is wider.
const FORM_STALE_LOCAL_MS = 60_000;

export default class BotsListenEvents extends BaseCommand {
  static override summary = 'Слушать события бота в реальном времени';
  static override description = `Слушать события бота: JSONL в stdout или пересылка на локальный HTTP-обработчик.

Нужен токен бота с webhooks:events:read и включённая история событий.
Без --forward-to записи остаются в истории. С --forward-to запись удаляется из истории после ответа 2xx.
Для этого нужно право webhooks:events:delete. Если задан PACHCA_SIGNING_SECRET, запрос подписан им, как вебхук.
Ответ обработчика на отправку формы CLI передаёт в Пачку, для этого нужно право views:write.
Ошибка обработчика останавливает команду. После перезапуска событие может прийти снова.`;
  static scope = 'webhooks:events:read';
  static override examples = [
    'PACHCA_TOKEN=$PACHCA_BOT_TOKEN <%= config.bin %> bots listen-events',
    'PACHCA_TOKEN=$PACHCA_BOT_TOKEN PACHCA_SIGNING_SECRET=$PACHCA_SIGNING_SECRET <%= config.bin %> bots listen-events --forward-to http://localhost:3000/webhook',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    'forward-to': Flags.string({ description: 'HTTP(S)-адрес обработчика: событие уходит POST, запись удаляется из истории после 2xx' }),
    'no-retry': Flags.boolean({
      description: 'Не переподключаться к потоку после обрыва. Запросы к API по-прежнему повторяются при 429 и 5xx',
      default: false,
    }),
  };

  /** Without views:write the answer to a form cannot reach Pachca, and trying would fail the record. */
  private answerForms = true;

  /** Pachca's clock minus the local one, from the Date header of the last API response, with the local stamps it was taken at. */
  private serverClock: { offset: number; wall: number; mono: number } | undefined;

  // The stream response contains a capability URL: suppress HTTP body diagnostics for this command.
  // --no-retry here means «do not reconnect»: single API calls keep their retries on 429 and 5xx.
  protected override getClientFlags() {
    return { ...super.getClientFlags(), verbose: false, quiet: true, 'no-retry': false };
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(BotsListenEvents);
    this.parsedFlags = flags;
    let target: URL | undefined;
    if (flags['forward-to']) {
      try { target = new URL(flags['forward-to']); } catch { /* validation below */ }
      if (!target || !['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
        this.validationError([{ message: 'Нужен HTTP(S)-адрес без логина и пароля', flag: 'forward-to' }]);
      }
    }
    if ((flags.output && flags.output !== 'json') || flags.plain || flags.columns || flags.quiet) {
      this.validationError([{ message: 'События выводятся в JSONL; форматирование и --quiet не поддерживаются' }]);
    }
    if (flags['dry-run']) {
      await this.apiRequest({ method: 'GET', path: '/webhooks/events/stream' });
      return;
    }
    if (target) await this.checkForwardingScopes();

    // The same rule as API calls: --timeout, defaults.timeout, PACHCA_TIMEOUT, 30 seconds.
    const timeoutMs = Math.ceil(resolveTimeoutSeconds(this.getClientFlags().timeout) * 1_000);
    const secret = process.env.PACHCA_SIGNING_SECRET || undefined;
    if (target && !secret) {
      process.stderr.write('PACHCA_SIGNING_SECRET не задан: события уходят без заголовка Pachca-Signature\n');
    }

    const controller = new AbortController();
    let interrupted = false;
    const stop = () => { interrupted = true; controller.abort(); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    try {
      await listenWebhookEvents({
        signal: controller.signal,
        retry: !flags['no-retry'],
        timeoutMs,
        acknowledge: !!target,
        request: async (opts) => {
          const response = await this.apiRequest(opts);
          const date = Date.parse(response.headers?.get('date') ?? '');
          if (Number.isFinite(date)) {
            const wall = Date.now();
            this.serverClock = { offset: date - wall, wall, mono: performance.now() };
          }
          return response.data;
        },
        onReconnect: () => { process.stderr.write('Переподключение к потоку событий…\n'); },
        onEvent: async (event) => {
          if (!target) {
            await new Promise<void>((resolve, reject) => {
              process.stdout.write(JSON.stringify(event) + '\n', (error) => error ? reject(error) : resolve());
            });
            return;
          }
          await this.forward(event, target, secret, controller.signal, timeoutMs);
        },
      });
    } finally {
      controller.abort();
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
    }
    if (interrupted) {
      // An API call in flight would keep the process alive until its timeout and retries end.
      // A JSONL line may still wait in the pipe: let it out, but do not wait on a stuck reader.
      await Promise.race([
        new Promise<void>((resolve) => { process.stdout.write('', () => resolve()); }),
        new Promise<void>((resolve) => { setTimeout(resolve, 1_000); }),
      ]);
      process.exit(0);
    }
  }

  /** Without webhooks:events:delete every forwarded event would come again on the next run. */
  private async checkForwardingScopes(): Promise<void> {
    const body = (await this.apiRequest({ method: 'GET', path: '/oauth/token/info' })).data as { data?: { scopes?: string[] } };
    const scopes = body?.data?.scopes ?? [];
    const has = (scope: string) => scopes.includes(scope) || scopes.includes('all');
    if (!has('webhooks:events:delete')) {
      throw new ApiError({
        error: 'Для --forward-to токену нужно право webhooks:events:delete: без него события придут снова при каждом запуске',
        code: null,
        type: 'PACHCA_SCOPE_ERROR',
        scope: 'webhooks:events:delete',
      });
    }
    this.answerForms = has('views:write');
    if (!this.answerForms) {
      process.stderr.write('У токена нет права views:write: ответ обработчика на отправку формы не дойдёт до Пачки, и сотрудник увидит ошибку отправки\n');
    }
  }

  private async forward(event: WebhookEvent, target: URL, secret: string | undefined, signal: AbortSignal, timeoutMs: number): Promise<void> {
    const name = `${event.id} (${event.event_type})`;
    const form = formSubmit(event.payload);
    const clock = this.serverClock;
    // A local clock that jumped (time sync, a virtual machine catching up, a manual change) or a machine
    // that slept since the stamp breaks the offset: the wider margin on the local clock applies then.
    const offset = clock && Math.abs((Date.now() - clock.wall) - (performance.now() - clock.mono)) <= 1_000
      ? clock.offset : undefined;
    const age = Date.now() + (offset ?? 0) - Date.parse(event.created_at);
    if (form && age > (offset === undefined ? FORM_STALE_LOCAL_MS : FORM_STALE_MS)) {
      // The record is acknowledged: no answer reaches Pachca now, and the employee may have sent the form again.
      process.stderr.write(`Отправка формы ${name} пропущена: срок ответа вышел, сотрудник уже видел ошибку отправки\n`);
      return;
    }
    const payload = withFreshTimestamp(event.payload);
    const body = JSON.stringify(payload);
    // The record id stays the same for every attempt and every run, like the key of one webhook delivery.
    const headers: Record<string, string> = { 'content-type': 'application/json', 'idempotency-key': event.id };
    if (secret) headers['pachca-signature'] = createHmac('sha256', secret).update(body).digest('hex');

    let response: Response;
    try {
      response = await fetch(target, {
        method: 'POST', headers, body, redirect: 'manual',
        signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
      });
    } catch {
      if (signal.aborted) return;
      throw new Error(`Не удалось переслать событие ${name}, запись сохранена в истории`);
    }

    if (form && (response.status === 400 || response.status === 422)) {
      const errors = await this.formErrors(response);
      if (!errors) throw new Error(`Обработчик ответил HTTP ${response.status} на форму ${name} без объекта errors, запись сохранена в истории`);
      await this.answerForm(form, errors);
      return;
    }
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Обработчик ответил HTTP ${response.status} на событие ${name}, запись сохранена в истории`);
    if (form) await this.answerForm(form);
  }

  /** `errors` from a 400 or 422 reply: field name to the text shown under that field. */
  private async formErrors(response: Response): Promise<Record<string, string> | undefined> {
    try {
      const body = await response.json() as { errors?: unknown };
      const errors = body?.errors;
      if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;
      const entries = Object.entries(errors as Record<string, unknown>);
      if (!entries.length || !entries.every(([, value]) => typeof value === 'string')) return undefined;
      return Object.fromEntries(entries) as Record<string, string>;
    } catch {
      return undefined;
    }
  }

  /**
   * A bot without a webhook URL closes the form with a method: the reply a handler gives to a
   * webhook goes on to Pachca the same way, closing the form or showing errors under its fields.
   * The handler has already acted on the submission, and the 5 seconds for an answer do not come
   * back, so a refused answer is reported and the record is still acknowledged.
   */
  private async answerForm(form: FormSubmit, errors?: Record<string, string>): Promise<void> {
    if (!this.answerForms) return;
    // 503: Pachca kept the submission open, so the same call a moment later can still close the form.
    // Repeating is safe: an answer already taken, or one past the 5 seconds, gets 410.
    for (let attempt = 0; ; attempt++) {
      try {
        await this.apiRequest({
          method: 'POST',
          path: `/views/${encodeURIComponent(form.view_id)}/submit_response`,
          body: { submit_id: form.submit_id, ...(errors ? { errors } : {}) },
        });
        return;
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        if (error.details.code === 503 && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        const reason = error.details.code === 410
          ? 'время вышло или ответ уже отправлен'
          : `HTTP ${error.details.code ?? 'без ответа'}: ${error.details.error}`;
        process.stderr.write(`Ответ на форму ${form.submit_id} не передан в Пачку: ${reason}\n`);
        return;
      }
    }
  }
}
