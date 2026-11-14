// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsDeleteToken extends BaseCommand {
  static override summary = "Удаление токена бота";
  static override description = "Удаляет токен: запросы с ним сразу перестают проходить. Остальные токены бота продолжают работать.\n\nПолное описание: pachca api DELETE /bots/{id}/tokens/{token_id} --docs";
  static scope = "bots:write";
  static apiMethod = "DELETE";
  static apiPath = "/bots/{id}/tokens/{token_id}";

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
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsDeleteToken);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca bots delete-token <id> <token_id> --force" },
        );
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/bots/${args.id}/tokens/${args.token_id}`,
    });

    this.success('Удалено');
  }
}
