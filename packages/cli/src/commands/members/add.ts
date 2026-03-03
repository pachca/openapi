// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersAdd extends BaseCommand {
  static override description = "Добавление пользователей";

  static override examples = [
      "Подписаться на тред сообщения:\n  $ pachca members add",
      "Упомянуть пользователя по имени:\n  $ pachca members list",
      "Создать канал и пригласить участников:\n  $ pachca members add"
  ];

  static scope = "chat_members:write";
  static apiMethod = "POST";
  static apiPath = "/chats/{id}/members";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата (беседа, канал или чат треда)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'member-ids': Flags.string({
      description: "Массив идентификаторов пользователей, которые станут участниками",
    }),
    'silent': Flags.boolean({
      description: "Не создавать в чате системное сообщение о добавлении участника",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MembersAdd);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'member-ids', label: "Массив идентификаторов пользователей, которые станут участниками", type: 'string' },
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
      member_ids: flags['member-ids'] ? JSON.parse(flags['member-ids']) : undefined,
      silent: flags['silent'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/chats/${args.id}/members`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
