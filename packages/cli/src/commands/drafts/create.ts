// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class DraftsCreate extends BaseCommand {
  static override description = "Новый черновик";

  static override examples = [
      "Отправить сообщение позже или по расписанию — Создай отложенное сообщение: `schedule.start_date` — когда отправить, `schedule.repetition.interval` — как повторять (`once`, если один раз):\n  $ pachca drafts create"
  ];

  static scope = "drafts:write";
  static apiMethod = "POST";
  static apiPath = "/drafts";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];
  static requiredFlags = ["entity-type","entity-id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'entity-type': Flags.string({
      description: "Куда пишется черновик: в беседу или канал, в тред либо в личную переписку с сотрудником",
    }),
    'entity-id': Flags.integer({
      description: "Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника (pachca chats list | pachca users list)",
    }),
    'content': Flags.string({
      description: "Текст черновика. Можно не передавать, если есть вложения, но пустым черновик быть не может.",
    }),
    'parent-message-id': Flags.integer({
      description: "Идентификатор сообщения, ответом на которое уйдёт черновик. Сообщение должно быть в том же чате.",
    }),
    'files': Flags.string({
      description: "Прикрепляемые файлы, не больше десяти",
    }),
    'schedule': Flags.string({
      description: "Расписание отправки. С ним создаётся отложенное сообщение, без него — обычный черновик.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DraftsCreate);
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
      { flag: 'entity-type', label: "Куда пишется черновик: в беседу или канал, в тред либо в личную переписку с сотрудником", type: 'string' },
      { flag: 'entity-id', label: "Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника", type: 'integer' },
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
          { hint: "Обязательные: --entity-type <string>, --entity-id <integer>. pachca introspect drafts create" },
        );
      }
    }

    const body: Record<string, unknown> = { draft: {
      entity_type: flags['entity-type'],
      entity_id: flags['entity-id'],
      content: flags['content'],
      parent_message_id: flags['parent-message-id'],
      files: flags['files'] ? this.parseJSON(flags['files'], 'files') : undefined,
      schedule: flags['schedule'] ? this.parseJSON(flags['schedule'], 'schedule') : undefined,
    } };
    // Clean undefined fields
    const inner = body['draft'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/drafts',
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
