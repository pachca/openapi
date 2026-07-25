// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersCreate extends BaseCommand {
  static override description = "Новый сотрудник";

  static override examples = [
      "Массовое создание сотрудников с тегами — Для каждого сотрудника: создай аккаунт с тегами:\n  $ pachca users create",
      "Создать гостя в чат — Создай гостя: роль `guest` и ровно один чат в `--chat-ids`:\n  $ pachca users create",
      "Онбординг нового сотрудника — Создай аккаунт:\n  $ pachca users create"
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
      description: "Имя (макс. 255 символов)",
    }),
    'last-name': Flags.string({
      description: "Фамилия (макс. 255 символов)",
    }),
    'email': Flags.string({
      description: "Электронная почта (макс. 255 символов)",
    }),
    'phone-number': Flags.string({
      description: "Телефон (макс. 255 символов)",
    }),
    'nickname': Flags.string({
      description: "Имя пользователя (макс. 255 символов)",
    }),
    'department': Flags.string({
      description: "Департамент (макс. 255 символов)",
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
    'chat-ids': Flags.string({
      description: "Идентификаторы чатов, в которые сотрудник будет добавлен сразу при создании. Для роли `guest` параметр обязателен и должен содержать ровно один активный чат.",
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

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['first-name'] && String(flags['first-name']).length > 255) {
      validationErrors.push({ message: `--first-name: максимум 255 символов (передано: ${String(flags['first-name']).length})`, flag: 'first-name' });
    }
    if (flags['last-name'] && String(flags['last-name']).length > 255) {
      validationErrors.push({ message: `--last-name: максимум 255 символов (передано: ${String(flags['last-name']).length})`, flag: 'last-name' });
    }
    if (flags['email'] && String(flags['email']).length > 255) {
      validationErrors.push({ message: `--email: максимум 255 символов (передано: ${String(flags['email']).length})`, flag: 'email' });
    }
    if (flags['phone-number'] && String(flags['phone-number']).length > 255) {
      validationErrors.push({ message: `--phone-number: максимум 255 символов (передано: ${String(flags['phone-number']).length})`, flag: 'phone-number' });
    }
    if (flags['nickname'] && String(flags['nickname']).length > 255) {
      validationErrors.push({ message: `--nickname: максимум 255 символов (передано: ${String(flags['nickname']).length})`, flag: 'nickname' });
    }
    if (flags['department'] && String(flags['department']).length > 255) {
      validationErrors.push({ message: `--department: максимум 255 символов (передано: ${String(flags['department']).length})`, flag: 'department' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
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
      chat_ids: flags['chat-ids'] ? this.parseJSON(flags['chat-ids'], 'chat-ids') : undefined,
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
