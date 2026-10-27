// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ImportantMessagesCreate extends BaseCommand {
  static override description = "Добавление сообщения в важные";
  static scope = "important_messages:write";
  static apiMethod = "POST";
  static apiPath = "/important_messages";
  static requiredFlags = ["message-id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'message-id': Flags.integer({
      description: "Идентификатор сообщения (pachca messages list)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ImportantMessagesCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'message-id', label: "Идентификатор сообщения", type: 'integer' },
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
          { hint: "Обязательные: --message-id <integer>. pachca introspect important-messages create" },
        );
      }
    }

    const body: Record<string, unknown> = {
      message_id: flags['message-id'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/important_messages',
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
