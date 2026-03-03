// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class GroupTagsDelete extends BaseCommand {
  static override description = "Удаление тега";

  static scope = "group_tags:write";
  static apiMethod = "DELETE";
  static apiPath = "/group_tags/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор тега",
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
    const { args, flags } = await this.parse(GroupTagsDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        process.stderr.write('✗ Деструктивная операция требует флага --force в неинтерактивном режиме\n');
        this.exit(2);
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    this.checkScope("group_tags:write");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/group_tags/${args.id}`,
    });

    this.success('Удалено');
  }
}
