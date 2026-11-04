// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ReactionsRemove extends BaseCommand {
  static override description = "Удаление реакции";
  static scope = "reactions:write";
  static apiMethod = "DELETE";
  static apiPath = "/messages/{id}/reactions";

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'code': Flags.string({
      description: "Emoji символ реакции. Обязателен без `name`: нужен именно символ, текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи. С `name` не используется.",
    }),
    'name': Flags.string({
      description: "Имя реакции, как в её поле `name`. С ним реакция ищется по имени, так снимается и кастомный эмодзи пространства.",
    }),
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReactionsRemove);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca reactions remove <id> --force" },
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
      path: `/messages/${args.id}/reactions`,
      query: {
      code: flags['code'],
      name: flags['name'],
      },
    });

    this.success('Удалено');
  }
}
