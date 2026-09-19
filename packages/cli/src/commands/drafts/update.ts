// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class DraftsUpdate extends BaseCommand {
  static override description = "Редактирование черновика";

  static scope = "drafts:write";
  static apiMethod = "PUT";
  static apiPath = "/drafts/{id}";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор черновика",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'content': Flags.string({
      description: "Текст черновика",
    }),
    'parent-message-id': Flags.integer({
      description: "Идентификатор сообщения, ответом на которое уйдёт черновик. `null` снимает ответ.",
    }),
    'files': Flags.string({
      description: "Прикрепляемые файлы, не больше десяти. Переданный массив заменяет прежний состав: пустой снимает все вложения, а чтобы сохранить уже прикреплённый файл, передайте его с `id`. Без этого поля вложения остаются как были.",
    }),
    'schedule': Flags.string({
      description: "Расписание отправки. У обычного черновика оно превращает его в отложенное сообщение. У отложенного расписание можно изменить, но не снять: `null` в ответ даст `422` с кодом `draft_type_change_forbidden`.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DraftsUpdate);
    this.parsedFlags = flags;

    // Read from stdin if --content not provided and stdin is not TTY
    if (!flags['content'] && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      flags['content'] = Buffer.concat(chunks).toString('utf-8').trimEnd();
    }

    const body: Record<string, unknown> = { draft: {
      content: flags['content'],
      parent_message_id: flags['parent-message-id'],
      files: flags['files'] ? this.parseJSON(flags['files'], 'files') : undefined,
      schedule: flags['schedule'] ? this.parseJSON(flags['schedule'], 'schedule') : undefined,
    } };
    // Clean undefined fields
    const inner = body['draft'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/drafts/${args.id}`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
