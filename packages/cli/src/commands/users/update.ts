// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class UsersUpdate extends BaseCommand {
  static override description = "Редактирование сотрудника";

  static override examples = [
      "Получить сотрудника по ID:\n  $ pachca users get",
      "Массовое создание сотрудников с тегами:\n  $ pachca users update",
      "Offboarding сотрудника:\n  $ pachca users update"
  ];

  static scope = "users:update";
  static apiMethod = "PUT";
  static apiPath = "/users/{id}";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор пользователя",
      required: true,
    }),
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

    this.checkScope("users:update");

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
