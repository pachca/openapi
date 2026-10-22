// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class UsersUpdateStatus extends BaseCommand {
  static override description = "Новый статус сотрудника";
  static scope = "user_status:write";
  static apiMethod = "PUT";
  static apiPath = "/users/{user_id}/status";
  static defaultColumns = ["title","emoji","expires_at","is_away"];

  static override args = {
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'emoji': Flags.string({
      description: "Emoji символ статуса. Обязателен, если статуса ещё нет.",
    }),
    'title': Flags.string({
      description: "Текст статуса. Обязателен, если статуса ещё нет. (макс. 50 символов)",
    }),
    'expires-at': Flags.string({
      description: "Срок жизни статуса (ISO-8601). Смещение вида `+03:00` учитывается, время без смещения считается UTC.",
    }),
    'is-away': Flags.boolean({
      description: "Режим «Нет на месте»",
      allowNo: true,
    }),
    'away-message': Flags.string({
      description: "Текст сообщения при режиме «Нет на месте». Отображается в профиле и при личных сообщениях/упоминаниях. (макс. 1024 символов)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersUpdateStatus);
    this.parsedFlags = flags;

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['title'] && String(flags['title']).length > 50) {
      validationErrors.push({ message: `--title: максимум 50 символов (передано: ${String(flags['title']).length})`, flag: 'title' });
    }
    if (flags['away-message'] && String(flags['away-message']).length > 1024) {
      validationErrors.push({ message: `--away-message: максимум 1024 символов (передано: ${String(flags['away-message']).length})`, flag: 'away-message' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = { status: {
      emoji: flags['emoji'],
      title: flags['title'],
      expires_at: flags['expires-at'],
      is_away: flags['is-away'],
      away_message: flags['away-message'],
    } };
    // Clean undefined fields
    const inner = body['status'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/users/${args.user_id}/status`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
