// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ProfileUpdateStatus extends BaseCommand {
  static override description = "Новый статус";

  static override examples = [
      "Установить статус:\n  $ pachca profile update-status",
      "Сбросить статус:\n  $ pachca profile delete-status"
  ];

  static scope = "profile_status:write";
  static apiMethod = "PUT";
  static apiPath = "/profile/status";
  static defaultColumns = ["title","emoji","expires_at","is_away"];

  static override args = {

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
    }),
    'away-message': Flags.string({
      description: "Текст сообщения при режиме «Нет на месте». Отображается в профиле и при личных сообщениях/упоминаниях. (макс. 1024 символов)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileUpdateStatus);
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
        for (const field of missingRequired) {
          process.stderr.write(`✗ Обязательный флаг --${field.flag} не передан\n`);
        }
        this.exit(2);
      }
    }

    if (flags['away-message'] && String(flags['away-message']).length > 1024) {
      process.stderr.write(`✗ --away-message: максимум 1024 символов (передано: ${String(flags['away-message']).length})\n`);
      this.exit(2);
    }

    this.checkScope("profile_status:write");

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

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: '/profile/status',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
