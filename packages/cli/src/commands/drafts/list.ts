// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class DraftsList extends BaseCommand {
  static override description = "Список черновиков";

  static scope = "drafts:read";
  static apiMethod = "GET";
  static apiPath = "/drafts";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'type': Flags.string({
      description: "Что возвращать: `regular` — обычные черновики, `scheduled` — отложенные сообщения, `all` — и те и другие",
      options: ["regular","scheduled","all"],
      default: "regular",
    }),
    'entity-type': Flags.string({
      description: "Тип чата для фильтра по одному чату. Указывается вместе с `entity_id`: если прислать только один из двух, ответ будет `422`.",
      options: ["discussion","thread","user"],
    }),
    'entity-id': Flags.integer({
      description: "Идентификатор того, что названо в `entity_type`. Указывается вместе с ним.",
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
    const { args, flags } = await this.parse(DraftsList);
    this.parsedFlags = flags;

    if (flags.all) {
      // Auto-pagination
      const allData: unknown[] = [];
      let nextCursor: string | undefined = undefined;
      let pages = 0;
      const seenCursors = new Set<string>();

      while (pages < 500) {
        const query: Record<string, string | number | boolean | string[] | undefined> = {
        type: flags['type'],
        'entity_type': flags['entity-type'],
        'entity_id': flags['entity-id'],
        limit: flags.limit,
          cursor: nextCursor,
        };
        const response = await this.apiRequest({ method: 'GET', path: '/drafts', query });
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
      path: '/drafts',
      query: {
      type: flags['type'],
      'entity_type': flags['entity-type'],
      'entity_id': flags['entity-id'],
      limit: flags.limit,
      cursor: flags.cursor,
      },
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const items = responseBody.data ?? responseBody;
    this.output(items);
  }
}
