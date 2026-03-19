// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersUpdateStatus extends BaseCommand {
  static override description = "Новый статус сотрудника";

  static override examples = [
      "Управление статусом сотрудника:\n  $ pachca users get-status",
      "Управление статусом сотрудника:\n  $ pachca users update-status",
      "Управление статусом сотрудника:\n  $ pachca users remove-status"
  ];

  static scope = "user_status:write";
  static apiMethod = "PUT";
  static apiPath = "/users/{user_id}/status";
  static defaultColumns = ["title","emoji","expires_at","is_away"];
  static requiredFlags = ["emoji","title"];

  static override args = {
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'emoji': Flags.string({
      description: "Emoji символ статуса",
    }),
    'title': Flags.string({
      description: "Текст статуса",
    }),
    'expires-at': Flags.string({
      description: "Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ",
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

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'emoji', label: "Emoji символ статуса", type: 'string' },
      { flag: 'title', label: "Текст статуса", type: 'string' },
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
          { hint: "Обязательные: --emoji <string>, --title <string>. pachca introspect users update-status" },
        );
      }
    }

    const validationErrors: { message: string; flag: string }[] = [];
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

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
