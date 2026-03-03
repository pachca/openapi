// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersUpdate extends BaseCommand {
  static override description = "Редактирование роли";

  static override examples = [
      "Архивация и управление чатом:\n  $ pachca members update",
      "Архивация и управление чатом:\n  $ pachca members remove"
  ];

  static scope = "chat_members:write";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/members/{user_id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
    user_id: Args.integer({
      description: "Идентификатор пользователя",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'role': Flags.string({
      description: "Роль",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MembersUpdate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'role', label: "Роль", type: 'string' },
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
        for (const field of missingRequired) {
          process.stderr.write(`✗ Обязательный флаг --${field.flag} не передан\n`);
        }
        this.exit(2);
      }
    }

    this.checkScope("chat_members:write");

    const body: Record<string, unknown> = {
      role: flags['role'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    if (Object.keys(body).length === 0) {
      process.stderr.write('⚠ Не указаны поля для обновления. Используйте --help для списка флагов.\n');
      return;
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/members/${args.user_id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
