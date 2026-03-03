// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class GroupTagsUpdate extends BaseCommand {
  static override description = "Редактирование тега";

  static scope = "group_tags:write";
  static apiMethod = "PUT";
  static apiPath = "/group_tags/{id}";
  static defaultColumns = ["id","name","users_count"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор тега",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Название тега",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GroupTagsUpdate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'name', label: "Название тега", type: 'string' },
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

    this.checkScope("group_tags:write");

    const body: Record<string, unknown> = { group_tag: {
      name: flags['name'],
    } };
    // Clean undefined fields
    const inner = body['group_tag'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/group_tags/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
