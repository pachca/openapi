// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsList extends BaseCommand {
  static override description = "Список чатов";

  static override examples = [
      "Найти чат по имени и отправить сообщение:\n  $ pachca chats list",
      "Создать канал и пригласить участников:\n  $ pachca chats create",
      "Создать проектную беседу из шаблона:\n  $ pachca chats create"
  ];

  static scope = "chats:read";
  static apiMethod = "GET";
  static apiPath = "/chats";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'sort-id': Flags.string({
      description: "Идентификатор чата",
    }),
    'sort-last_message_at': Flags.string({
      description: "Дата и время создания последнего сообщения",
    }),
    'availability': Flags.string({
      description: "Параметр, который отвечает за доступность и выборку чатов для пользователя",
    }),
    'last-message-at-after': Flags.string({
      description: "Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не раньше чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).",
    }),
    'last-message-at-before': Flags.string({
      description: "Фильтрация по времени создания последнего сообщения. Будут возвращены те чаты, время последнего созданного сообщения в которых не позже чем указанное (в формате YYYY-MM-DDThh:mm:ss.sssZ).",
    }),
    'personal': Flags.boolean({
      description: "Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты.",
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
    const { args, flags } = await this.parse(ChatsList);
    this.parsedFlags = flags;

    this.checkScope("chats:read");

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | undefined> = {
        'sort[id]': flags['sort-id'],
        'sort[last_message_at]': flags['sort-last_message_at'],
        availability: flags['availability'],
        'last_message_at_after': flags['last-message-at-after'],
        'last_message_at_before': flags['last-message-at-before'],
        personal: flags['personal'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/chats', query });
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
      path: '/chats',
      query: {
      'sort[id]': flags['sort-id'],
      'sort[last_message_at]': flags['sort-last_message_at'],
      availability: flags['availability'],
      'last_message_at_after': flags['last-message-at-after'],
      'last_message_at_before': flags['last-message-at-before'],
      personal: flags['personal'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = data as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
