// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersCreate extends BaseCommand {
  static override description = "Создать сотрудника";

  static override examples = [
      "Проверить, кто прочитал сообщение:\n  $ pachca users list",
      "Разослать уведомление нескольким пользователям:\n  $ pachca users list",
      "Массовое создание сотрудников с тегами:\n  $ pachca users create"
  ];

  static scope = "users:create";
  static apiMethod = "POST";
  static apiPath = "/users";
  static defaultColumns = ["id","title","first_name","last_name","email"];
  static requiredFlags = ["email"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'first-name': Flags.string({
      description: "Имя",
    }),
    'last-name': Flags.string({
      description: "Фамилия",
    }),
    'email': Flags.string({
      description: "Электронная почта",
    }),
    'phone-number': Flags.string({
      description: "Телефон",
    }),
    'nickname': Flags.string({
      description: "Имя пользователя",
    }),
    'department': Flags.string({
      description: "Департамент",
    }),
    'title': Flags.string({
      description: "Должность",
    }),
    'role': Flags.string({
      description: "Уровень доступа",
    }),
    'suspended': Flags.boolean({
      description: "Деактивация пользователя",
      allowNo: true,
    }),
    'list-tags': Flags.string({
      description: "Массив тегов, привязываемых к сотруднику",
    }),
    'custom-properties': Flags.string({
      description: "Задаваемые дополнительные поля",
    }),
    'skip-email-notify': Flags.boolean({
      description: "Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'email', label: "Электронная почта", type: 'string' },
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
          { hint: "Обязательные: --email <string>. pachca introspect users create" },
        );
      }
    }

    const body: Record<string, unknown> = {
      user: {
      first_name: flags['first-name'],
      last_name: flags['last-name'],
      email: flags['email'],
      phone_number: flags['phone-number'],
      nickname: flags['nickname'],
      department: flags['department'],
      title: flags['title'],
      role: flags['role'],
      suspended: flags['suspended'],
      list_tags: flags['list-tags'] ? this.parseJSON(flags['list-tags'], 'list-tags') : undefined,
      custom_properties: flags['custom-properties'] ? this.parseJSON(flags['custom-properties'], 'custom-properties') : undefined,
      },
      skip_email_notify: flags['skip-email-notify'],
    };
    // Clean undefined fields
    const inner = body['user'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }
    for (const [k, v] of Object.entries(body)) { if (k !== 'user' && v === undefined) delete body[k]; }

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
