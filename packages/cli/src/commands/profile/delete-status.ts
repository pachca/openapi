// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ProfileDeleteStatus extends BaseCommand {
  static override description = "Удаление статуса";

  static override examples = [
      "Установить статус:\n  $ pachca profile update-status",
      "Сбросить статус:\n  $ pachca profile delete-status"
  ];

  static scope = "profile_status:write";
  static apiMethod = "DELETE";
  static apiPath = "/profile/status";

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileDeleteStatus);
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

    this.checkScope("profile_status:write");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: '/profile/status',
    });

    this.success('Удалено');
  }
}
