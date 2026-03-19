// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsUpdate extends BaseCommand {
  static override description = "Обновление чата";

  static override examples = [
      "Переименовать или обновить чат:\n  $ pachca chats update"
  ];

  static scope = "chats:update";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Название",
    }),
    'public': Flags.boolean({
      description: "Открытый доступ",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsUpdate);
    this.parsedFlags = flags;

    const body: Record<string, unknown> = { chat: {
      name: flags['name'],
      public: flags['public'],
    } };
    // Clean undefined fields
    const inner = body['chat'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
