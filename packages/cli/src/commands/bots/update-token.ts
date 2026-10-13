// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsUpdateToken extends BaseCommand {
  static override description = "Изменение токена бота";

  static scope = "bots:write";
  static apiMethod = "PUT";
  static apiPath = "/bots/{id}/tokens/{token_id}";
  static defaultColumns = ["id","name","created_at","token","user_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота (pachca bots list)",
      required: true,
    }),
    token_id: Args.integer({
      description: "Идентификатор токена",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Новое имя токена (макс. 255 символов)",
    }),
    'scopes': Flags.string({
      description: "Новые права токена. Список заменяется целиком и действует сразу, перевыпускать токен не нужно.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsUpdateToken);
    this.parsedFlags = flags;

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['name'] && String(flags['name']).length > 255) {
      validationErrors.push({ message: `--name: максимум 255 символов (передано: ${String(flags['name']).length})`, flag: 'name' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = {
      name: flags['name'],
      scopes: flags['scopes'] ? this.parseJSON(flags['scopes'], 'scopes') : undefined,
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    if (Object.keys(body).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/bots/${args.id}/tokens/${args.token_id}`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
