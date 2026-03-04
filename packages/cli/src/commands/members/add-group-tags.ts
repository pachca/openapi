// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersAddGroupTags extends BaseCommand {
  static override description = "Добавление тегов";

  static scope = "chat_members:write";
  static apiMethod = "POST";
  static apiPath = "/chats/{id}/group_tags";
  static requiredFlags = ["group-tag-ids"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'group-tag-ids': Flags.string({
      description: "Массив идентификаторов тегов, которые станут участниками",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MembersAddGroupTags);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'group-tag-ids', label: "Массив идентификаторов тегов, которые станут участниками", type: 'string' },
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
          { hint: "Обязательные: --group-tag-ids <string>. pachca introspect members add-group-tags" },
        );
      }
    }

    this.checkScope("chat_members:write");

    const body: Record<string, unknown> = {
      group_tag_ids: flags['group-tag-ids'] ? this.parseJSON(flags['group-tag-ids'], 'group-tag-ids') : undefined,
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/chats/${args.id}/group_tags`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
