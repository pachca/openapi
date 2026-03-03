// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsUpdate extends BaseCommand {
  static override description = "Редактирование бота";

  static override examples = [
      "Обновить Webhook URL бота:\n  $ pachca bots update"
  ];

  static scope = "bots:write";
  static apiMethod = "PUT";
  static apiPath = "/bots/{id}";
  static defaultColumns = ["id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'webhook': Flags.string({
      description: "Объект параметров вебхука",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsUpdate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'webhook', label: "Объект параметров вебхука", type: 'string' },
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
        for (const field of missingRequired) {
          process.stderr.write(`✗ Обязательный флаг --${field.flag} не передан\n`);
        }
        this.exit(2);
      }
    }

    this.checkScope("bots:write");

    const body: Record<string, unknown> = { bot: {
      webhook: flags['webhook'] ? this.parseJSON(flags['webhook'], 'webhook') : undefined,
    } };
    // Clean undefined fields
    const inner = body['bot'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/bots/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
