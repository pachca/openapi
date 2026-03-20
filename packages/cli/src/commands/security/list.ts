// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class SecurityList extends BaseCommand {
  static override description = "Журнал аудита событий";

  static override examples = [
      "Получить журнал аудита событий:\n  $ pachca security list",
      "Мониторинг подозрительных входов:\n  $ pachca security list",
      "Экспорт логов за период:\n  $ pachca security list"
  ];

  static scope = "audit_events:read";
  static plan = "corporation";
  static apiMethod = "GET";
  static apiPath = "/audit_events";
  static defaultColumns = ["id","created_at","event_key","entity_id","entity_type"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'start-time': Flags.string({
      description: "Начальная метка времени (включительно)",
    }),
    'end-time': Flags.string({
      description: "Конечная метка времени (исключительно)",
    }),
    'event-key': Flags.string({
      description: "Фильтр по конкретному типу события",
      options: ["user_login","user_logout","user_2fa_fail","user_2fa_success","user_created","user_deleted","user_role_changed","user_updated","tag_created","tag_deleted","user_added_to_tag","user_removed_from_tag","chat_created","chat_renamed","chat_permission_changed","user_chat_join","user_chat_leave","tag_added_to_chat","tag_removed_from_chat","message_updated","message_deleted","message_created","reaction_created","reaction_deleted","thread_created","access_token_created","access_token_updated","access_token_destroy","kms_encrypt","kms_decrypt","audit_events_accessed","dlp_violation_detected","search_users_api","search_chats_api","search_messages_api"],
    }),
    'actor-id': Flags.string({
      description: "Идентификатор пользователя, выполнившего действие",
    }),
    'actor-type': Flags.string({
      description: "Тип актора",
    }),
    'entity-id': Flags.string({
      description: "Идентификатор затронутой сущности",
    }),
    'entity-type': Flags.string({
      description: "Тип сущности",
    }),
    limit: Flags.integer({
      description: 'Количество результатов на страницу',
    }),
    cursor: Flags.string({
      description: 'Курсор для следующей страницы',
    }),
    all: Flags.boolean({
      description: 'Загрузить все страницы автоматически',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SecurityList);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | undefined> = {
        'start_time': flags['start-time'],
        'end_time': flags['end-time'],
        'event_key': flags['event-key'],
        'actor_id': flags['actor-id'],
        'actor_type': flags['actor-type'],
        'entity_id': flags['entity-id'],
        'entity_type': flags['entity-type'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/audit_events', query });
        const body = response.data as Record<string, unknown>;
        const items = body.data as unknown[];
        if (items) allData.push(...items);
        const meta = body.meta as Record<string, unknown> | undefined;
        const paginate = meta?.paginate as Record<string, unknown> | undefined;
        nextCursor = paginate?.next_page as string | undefined;
        pages++;

        if (process.stderr.isTTY) {
          const total = (paginate as Record<string, unknown> | undefined)?.total;
          const progress = total ? `${allData.length} / ${total}` : String(allData.length);
          process.stderr.write(`\r  Загружено: ${progress}...`);
        }

        if (!nextCursor) break;
        if (seenCursors.has(nextCursor)) {
          process.stderr.write('\n⚠ Обнаружен цикл пагинации, остановка.\n');
          break;
        }
        seenCursors.add(nextCursor);
      }

      if (pages >= 500) {
        process.stderr.write('\n⚠ Достигнут лимит 500 страниц.\n');
      }
      if (process.stderr.isTTY) process.stderr.write('\n');
      this.output(allData);
      return;
    }

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/audit_events',
      query: {
      'start_time': flags['start-time'],
      'end_time': flags['end-time'],
      'event_key': flags['event-key'],
      'actor_id': flags['actor-id'],
      'actor_type': flags['actor-type'],
      'entity_id': flags['entity-id'],
      'entity_type': flags['entity-type'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
