// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class SearchListMessages extends BaseCommand {
  static override description = "Поиск сообщений";

  static override examples = [
      "Найти сообщение по тексту:\n  $ pachca search list-messages"
  ];

  static scope = "search:messages";
  static apiMethod = "GET";
  static apiPath = "/search/messages";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'query': Flags.string({
      description: "Текст поискового запроса",
    }),
    'order': Flags.string({
      description: "Направление сортировки",
      options: ["asc","desc"],
    }),
    'created-from': Flags.string({
      description: "Фильтр по дате создания (от)",
    }),
    'created-to': Flags.string({
      description: "Фильтр по дате создания (до)",
    }),
    'chat-ids': Flags.string({
      description: "Фильтр по ID чатов" + " (через запятую)",
    }),
    'user-ids': Flags.string({
      description: "Фильтр по ID авторов сообщений" + " (через запятую)",
    }),
    'active': Flags.boolean({
      description: "Фильтр по активности чата",
      allowNo: true,
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
    const { args, flags } = await this.parse(SearchListMessages);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | undefined> = {
        query: flags['query'],
        order: flags['order'],
        'created_from': flags['created-from'],
        'created_to': flags['created-to'],
        'chat_ids': flags['chat-ids'],
        'user_ids': flags['user-ids'],
        active: flags['active'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/search/messages', query });
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
      path: '/search/messages',
      query: {
      query: flags['query'],
      order: flags['order'],
      'created_from': flags['created-from'],
      'created_to': flags['created-to'],
      'chat_ids': flags['chat-ids'],
      'user_ids': flags['user-ids'],
      active: flags['active'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
