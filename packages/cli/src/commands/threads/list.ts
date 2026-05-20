// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ThreadsList extends BaseCommand {
  static override description = "Список тредов";

  static override examples = [
      "Получить список активных тредов за период:\n  $ pachca threads list"
  ];

  static scope = "threads:read";
  static apiMethod = "GET";
  static apiPath = "/threads";
  static defaultColumns = ["id","chat_id","message_id","message_chat_id","updated_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'last-message-at-after': Flags.string({
      description: "Фильтрация по времени последнего сообщения в треде. Будут возвращены только те треды, время последнего сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).",
    }),
    'last-message-at-before': Flags.string({
      description: "Фильтрация по времени последнего сообщения в треде. Будут возвращены только те треды, время последнего сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).",
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
    const { args, flags } = await this.parse(ThreadsList);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | string[] | undefined> = {
        'last_message_at_after': flags['last-message-at-after'],
        'last_message_at_before': flags['last-message-at-before'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/threads', query });
        const body = response.data as Record<string, unknown>;
        const items = body.data as unknown[];
        if (items) allData.push(...items);
        const meta = body.meta as Record<string, unknown> | undefined;
        const paginate = meta?.paginate as Record<string, unknown> | undefined;
        nextCursor = paginate?.next_page as string | undefined;
        pages++;
        // Условие конца: списочные методы — has_next === false; методы поиска и /users?query= (без has_next) — пустой data
        const hasNext = paginate?.has_next;
        if (typeof hasNext === 'boolean') {
          if (!hasNext) break;
        } else if (!items || items.length === 0) {
          break;
        }

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
      path: '/threads',
      query: {
      'last_message_at_after': flags['last-message-at-after'],
      'last_message_at_before': flags['last-message-at-before'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
