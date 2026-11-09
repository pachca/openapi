import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { listenWebhookEvents } from '../../webhook-listener.js';

export default class BotsListenEvents extends BaseCommand {
  static override summary = 'Слушать события бота в реальном времени';
  static override description = `Слушать события бота: JSONL в stdout или пересылка payload на HTTP-обработчик.

Нужен токен бота с webhooks:events:read и включённая история событий.
Без --forward-to история сохраняется. С --forward-to запись удаляется только после HTTP 2xx;
нужно право webhooks:events:delete. Ошибка обработчика останавливает команду.
Повторы после перезапуска возможны: обработчик должен быть идемпотентным.`;
  static scope = 'webhooks:events:read';
  static override examples = [
    '<%= config.bin %> bots listen-events',
    '<%= config.bin %> bots listen-events --forward-to http://localhost:3000/webhook',
  ];
  static override flags = {
    ...BaseCommand.baseFlags,
    'forward-to': Flags.string({ description: 'HTTP(S)-адрес обработчика: POST payload, подтверждение после 2xx' }),
  };

  // The stream response contains a capability URL: suppress HTTP body diagnostics for this command.
  protected override getClientFlags() {
    return { ...super.getClientFlags(), verbose: false, quiet: true };
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

    const controller = new AbortController();
    const stop = () => controller.abort();
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    try {
      await listenWebhookEvents({
        signal: controller.signal,
        retry: !flags['no-retry'],
        timeoutMs: (this.getClientFlags().timeout ?? 30) * 1_000,
        acknowledge: !!target,
        request: async (opts) => (await this.apiRequest(opts)).data,
        onReconnect: () => { process.stderr.write('Переподключение к потоку событий…\n'); },
        onEvent: async (event) => {
          if (!target) {
            await new Promise<void>((resolve, reject) => {
              process.stdout.write(JSON.stringify(event) + '\n', (error) => error ? reject(error) : resolve());
            });
            return;
          }
          let response: Response;
          try {
            response = await fetch(target, {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify(event.payload), redirect: 'manual',
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout((this.getClientFlags().timeout ?? 30) * 1_000)]),
            });
          } catch {
            if (controller.signal.aborted) return;
            throw new Error('Не удалось переслать событие; запись сохранена в истории');
          }
          await response.body?.cancel();
          if (!response.ok) throw new Error(`Обработчик ответил HTTP ${response.status}; запись сохранена в истории`);
        },
      });
    } finally {
      controller.abort();
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
    }
  }
}
