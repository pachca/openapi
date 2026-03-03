// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ChatsCreate extends BaseCommand {
  static override description = "Новый чат";

  static override examples = [
      "Найти чат по имени и отправить сообщение:\n  $ pachca chats list",
      "Создать канал и пригласить участников:\n  $ pachca chats create",
      "Создать проектную беседу из шаблона:\n  $ pachca chats create"
  ];

  static scope = "chats:create";
  static apiMethod = "POST";
  static apiPath = "/chats";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Название",
    }),
    'member-ids': Flags.string({
      description: "Массив идентификаторов пользователей, которые станут участниками",
    }),
    'group-tag-ids': Flags.string({
      description: "Массив идентификаторов тегов, которые станут участниками",
    }),
    'channel': Flags.boolean({
      description: "Является каналом",
    }),
    'public': Flags.boolean({
      description: "Открытый доступ",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'name', label: "Название", type: 'string' },
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

    this.checkScope("chats:create");

    const body: Record<string, unknown> = { chat: {
      name: flags['name'],
      member_ids: flags['member-ids'] ? this.parseJSON(flags['member-ids'], 'member-ids') : undefined,
      group_tag_ids: flags['group-tag-ids'] ? this.parseJSON(flags['group-tag-ids'], 'group-tag-ids') : undefined,
      channel: flags['channel'],
      public: flags['public'],
    } };
    // Clean undefined fields
    const inner = body['chat'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/chats',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
