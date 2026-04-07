// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesUpdate extends BaseCommand {
  static override description = "Редактирование сообщения";

  static override examples = [
      "Получить вложения из сообщения:\n  $ pachca messages get",
      "Отредактировать сообщение:\n  $ pachca messages update",
      "Изменить вложения сообщения:\n  $ pachca messages get"
  ];

  static scope = "messages:update";
  static apiMethod = "PUT";
  static apiPath = "/messages/{id}";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения (pachca messages list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'content': Flags.string({
      description: "Текст сообщения. Поддерживает упоминания: `@nickname` или `<@user_id>` (будет автоматически преобразовано в `@nickname`).",
    }),
    'files': Flags.string({
      description: "Прикрепляемые файлы",
    }),
    'buttons': Flags.string({
      description: "Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив.",
    }),
    'display-avatar-url': Flags.string({
      description: "Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.",
    }),
    'display-name': Flags.string({
      description: "Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesUpdate);
    this.parsedFlags = flags;

    // Read from stdin if --content not provided and stdin is not TTY
    if (!flags['content'] && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      flags['content'] = Buffer.concat(chunks).toString('utf-8').trimEnd();
    }

    const body: Record<string, unknown> = { message: {
      content: flags['content'],
      files: flags['files'] ? this.parseJSON(flags['files'], 'files') : undefined,
      buttons: flags['buttons'] ? this.parseJSON(flags['buttons'], 'buttons') : undefined,
      display_avatar_url: flags['display-avatar-url'],
      display_name: flags['display-name'],
    } };
    // Clean undefined fields
    const inner = body['message'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/messages/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
