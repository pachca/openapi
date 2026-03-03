// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersCreate extends BaseCommand {
  static override description = "Создать сотрудника";

  static override examples = [
      "Отправить личное сообщение пользователю:\n  $ pachca users list",
      "Упомянуть пользователя по имени:\n  $ pachca users list",
      "Проверить, кто прочитал сообщение:\n  $ pachca users list"
  ];

  static scope = "users:create";
  static apiMethod = "POST";
  static apiPath = "/users";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'user': Flags.string({
      description: "user",
    }),
    'skip-email-notify': Flags.boolean({
      description: "Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'user', label: "user", type: 'string' },
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

    this.checkScope("users:create");

    const body: Record<string, unknown> = {
      user: flags['user'] ? this.parseJSON(flags['user'], 'user') : undefined,
      skip_email_notify: flags['skip-email-notify'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/users',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
