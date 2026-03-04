// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MessagesCreate extends BaseCommand {
  static override description = "Новое сообщение";

  static override examples = [
      "Найти чат по имени и отправить сообщение:\n  $ pachca messages create",
      "Отправить сообщение в канал или беседу (если chat_id известен):\n  $ pachca messages create",
      "Отправить личное сообщение пользователю:\n  $ pachca messages create"
  ];

  static scope = "messages:create";
  static apiMethod = "POST";
  static apiPath = "/messages";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];
  static requiredFlags = ["entity-id","content"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'entity-type': Flags.string({
      description: "Тип сущности",
    }),
    'entity-id': Flags.integer({
      description: "Идентификатор сущности (pachca chats list | pachca users list)",
    }),
    'content': Flags.string({
      description: "Текст сообщения",
    }),
    'files': Flags.string({
      description: "Прикрепляемые файлы",
    }),
    'buttons': Flags.string({
      description: "Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке.",
    }),
    'parent-message-id': Flags.integer({
      description: "Идентификатор сообщения. Указывается в случае, если вы отправляете ответ на другое сообщение.",
    }),
    'display-avatar-url': Flags.string({
      description: "Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. (макс. 255 символов)",
    }),
    'display-name': Flags.string({
      description: "Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота. (макс. 255 символов)",
    }),
    'skip-invite-mentions': Flags.boolean({
      description: "Пропуск добавления упоминаемых пользователей в тред. Работает только при отправке сообщения в тред.",
      allowNo: true,
    }),
    'link-preview': Flags.boolean({
      description: "Отображение предпросмотра первой найденной ссылки в тексте сообщения",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesCreate);
    this.parsedFlags = flags;

    // Read from stdin if --content not provided and stdin is not TTY
    if (!flags['content'] && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      flags['content'] = Buffer.concat(chunks).toString('utf-8').trimEnd();
    }

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'entity-id', label: "Идентификатор сущности", type: 'integer' },
      { flag: 'content', label: "Текст сообщения", type: 'string' },
    ].filter((f) => (flags as Record<string, unknown>)[f.flag] === undefined || (flags as Record<string, unknown>)[f.flag] === null);

    if (missingRequired.length > 0) {
      if (this.isInteractive()) {
        for (const field of missingRequired) {
          const value = await clack.text({ message: field.label, validate: (v) => v.length === 0 ? 'Обязательное поле' : undefined });
          if (clack.isCancel(value)) { process.stderr.write('Отменено.\n'); this.exit(0); }
          if (field.type === 'integer') { (flags as Record<string, unknown>)[field.flag] = Number.parseInt(value, 10); }
          else if (field.type === 'boolean') { (flags as Record<string, unknown>)[field.flag] = value === 'true'; }
          else { (flags as Record<string, unknown>)[field.flag] = value; }
        }
      } else {
        this.validationError(
          missingRequired.map((f) => ({ message: `Обязательный флаг --${f.flag} не передан`, flag: f.flag })),
          { hint: "Обязательные: --entity-id <integer>, --content <string>. pachca introspect messages create" },
        );
      }
    }

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['display-avatar-url'] && String(flags['display-avatar-url']).length > 255) {
      validationErrors.push({ message: `--display-avatar-url: максимум 255 символов (передано: ${String(flags['display-avatar-url']).length})`, flag: 'display-avatar-url' });
    }
    if (flags['display-name'] && String(flags['display-name']).length > 255) {
      validationErrors.push({ message: `--display-name: максимум 255 символов (передано: ${String(flags['display-name']).length})`, flag: 'display-name' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    this.checkScope("messages:create");

    const body: Record<string, unknown> = { message: {
      entity_type: flags['entity-type'],
      entity_id: flags['entity-id'],
      content: flags['content'],
      files: flags['files'] ? this.parseJSON(flags['files'], 'files') : undefined,
      buttons: flags['buttons'] ? this.parseJSON(flags['buttons'], 'buttons') : undefined,
      parent_message_id: flags['parent-message-id'],
      display_avatar_url: flags['display-avatar-url'],
      display_name: flags['display-name'],
      skip_invite_mentions: flags['skip-invite-mentions'],
      link_preview: flags['link-preview'],
    } };
    // Clean undefined fields
    const inner = body['message'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/messages',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
