// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsListCompany extends BaseCommand {
  static override description = "Список чатов пространства";

  static override examples = [
      "Выгрузить все чаты пространства, включая закрытые — Получи беседы и каналы всего пространства, включая закрытые, где владелец токена не состоит:\n  $ pachca chats list-company"
  ];

  static scope = "company_chats:read";
  static plan = "corporation";
  static apiMethod = "GET";
  static apiPath = "/company/chats";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'activity': Flags.string({
      description: "Состояние чатов. Если параметр не указан, возвращаются и активные, и архивные чаты.",
      options: ["active","archived"],
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
    const { args, flags } = await this.parse(ChatsListCompany);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | string[] | undefined> = {
        activity: flags['activity'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/company/chats', query });
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
      path: '/company/chats',
      query: {
      activity: flags['activity'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
