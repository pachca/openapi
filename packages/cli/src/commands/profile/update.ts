// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ProfileUpdate extends BaseCommand {
  static override summary = "Редактирование своего профиля";
  static override description = "Меняет карточку владельца токена: перезаписываются только переданные поля. Метод доступен любому сотруднику и мульти-гостю, право `users:update` для него не нужно. Идентификаторы дополнительных полей отдаёт Список дополнительных полей.\n\nПолное описание: pachca api PUT /profile --docs";
  static scope = "profile:write";
  static apiMethod = "PUT";
  static apiPath = "/profile";
  static defaultColumns = ["id","title","first_name","last_name","email"];

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
    'phone-number': Flags.string({
      description: "Телефон (макс. 255 символов)",
    }),
    'nickname': Flags.string({
      description: "Имя пользователя: латинские и кириллические буквы, цифры, `_`, `-` и `.`. Ники `here` и `all` зарезервированы. Ник, занятый другим сотрудником без учёта регистра, отвечает ошибкой с кодом `already_exists`, в том числе у сотрудника с `sso: true`. (макс. 255 символов)",
    }),
    'department': Flags.string({
      description: "Департамент (макс. 255 символов)",
    }),
    'title': Flags.string({
      description: "Должность (макс. 255 символов)",
    }),
    'time-zone': Flags.string({
      description: "Часовой пояс: идентификатор IANA, например `Europe/Moscow`, иначе ответ `422` с кодом `invalid`. Заданный пояс выключает его автоопределение по устройству.",
    }),
    'custom-properties': Flags.string({
      description: "Задаваемые дополнительные поля. Каждое поле указывается один раз. Поля типов «Файл» и «Множественный выбор» через API не меняются: ответ `422` с кодом `not_applicable`. Неизвестный `id` отвечает кодом `not_found`. Какое поле не прошло проверку, говорит `payload.id` ошибки.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileUpdate);
    this.parsedFlags = flags;

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['first-name'] && String(flags['first-name']).length > 255) {
      validationErrors.push({ message: `--first-name: максимум 255 символов (передано: ${String(flags['first-name']).length})`, flag: 'first-name' });
    }
    if (flags['last-name'] && String(flags['last-name']).length > 255) {
      validationErrors.push({ message: `--last-name: максимум 255 символов (передано: ${String(flags['last-name']).length})`, flag: 'last-name' });
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
    if (flags['title'] && String(flags['title']).length > 255) {
      validationErrors.push({ message: `--title: максимум 255 символов (передано: ${String(flags['title']).length})`, flag: 'title' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = { user: {
      first_name: flags['first-name'],
      last_name: flags['last-name'],
      phone_number: flags['phone-number'],
      nickname: flags['nickname'],
      department: flags['department'],
      title: flags['title'],
      time_zone: flags['time-zone'],
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
      path: '/profile',
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
