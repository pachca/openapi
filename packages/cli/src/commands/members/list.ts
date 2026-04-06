// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MembersList extends BaseCommand {
  static override description = "Список участников чата";

  static override examples = [
      "Подписаться на тред сообщения:\n  $ pachca members add",
      "Упомянуть пользователя по имени:\n  $ pachca members list",
      "Создать канал и пригласить участников:\n  $ pachca members add"
  ];

  static scope = "chat_members:read";
  static apiMethod = "GET";
  static apiPath = "/chats/{id}/members";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'role': Flags.string({
      description: "Роль в чате",
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
    const { args, flags } = await this.parse(MembersList);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | string[] | undefined> = {
        role: flags['role'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: `/chats/${args.id}/members`, query });
        const body = response.data as Record<string, unknown>;
        const items = body.data as unknown[];
        if (items) allData.push(...items);
        if (!items || items.length === 0) break;
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
      path: `/chats/${args.id}/members`,
      query: {
      role: flags['role'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
