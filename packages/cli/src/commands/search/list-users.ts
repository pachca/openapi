// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class SearchListUsers extends BaseCommand {
  static override description = "Поиск сотрудников";

  static override examples = [
      "Найти сотрудника по имени:\n  $ pachca search list-users"
  ];

  static scope = "search:users";
  static apiMethod = "GET";
  static apiPath = "/search/users";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'query': Flags.string({
      description: "Текст поискового запроса",
    }),
    'sort': Flags.string({
      description: "Сортировка результатов",
      options: ["by_score","alphabetical"],
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
    'company-roles': Flags.string({
      description: "Фильтр по ролям сотрудников",
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
    const { args, flags } = await this.parse(SearchListUsers);
    this.parsedFlags = flags;

    this.checkScope("search:users");

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | undefined> = {
        query: flags['query'],
        sort: flags['sort'],
        order: flags['order'],
        'created_from': flags['created-from'],
        'created_to': flags['created-to'],
        'company_roles': flags['company-roles'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/search/users', query });
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
      path: '/search/users',
      query: {
      query: flags['query'],
      sort: flags['sort'],
      order: flags['order'],
      'created_from': flags['created-from'],
      'created_to': flags['created-to'],
      'company_roles': flags['company-roles'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
