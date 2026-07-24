// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class UsersUpdate extends BaseCommand {
  static override description = "Редактирование сотрудника";

  static override examples = [
      "Массовое создание сотрудников с тегами:\n  $ pachca users update",
      "Offboarding сотрудника:\n  $ pachca users update"
  ];

  static scope = "users:update";
  static apiMethod = "PUT";
  static apiPath = "/users/{id}";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
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
    'custom-properties': Flags.string({
      description: "Задаваемые дополнительные поля",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersUpdate);
    this.parsedFlags = flags;

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

    const body: Record<string, unknown> = { user: {
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
    } };
    // Clean undefined fields
    const inner = body['user'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/users/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
