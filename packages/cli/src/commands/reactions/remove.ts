// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ReactionsRemove extends BaseCommand {
  static override description = "Удаление реакции";

  static override examples = [
      "Добавить реакцию на сообщение:\n  $ pachca reactions add",
      "Добавить реакцию на сообщение:\n  $ pachca reactions remove"
  ];

  static scope = "reactions:write";
  static apiMethod = "DELETE";
  static apiPath = "/messages/{id}/reactions";
  static requiredFlags = ["code"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'code': Flags.string({
      description: "Emoji символ реакции",
    }),
    'name': Flags.string({
      description: "Текстовое имя эмодзи (используется для кастомных эмодзи)",
    }),
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReactionsRemove);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'code', label: "Emoji символ реакции", type: 'string' },
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
          { hint: "Обязательные: --code <string>. pachca introspect reactions remove" },
        );
      }
    }

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
