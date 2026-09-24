// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsMarkUnread extends BaseCommand {
  static override description = "Отметка чата непрочитанным";

  static scope = "chats:mark_unread";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/unread";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата или треда (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'message-id': Flags.integer({
      description: "Идентификатор сообщения, с которого чат становится непрочитанным: оно и все сообщения после него. Если не передать, непрочитанным становится последнее сообщение. (pachca messages list)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsMarkUnread);
    this.parsedFlags = flags;

    const body: Record<string, unknown> = {
      message_id: flags['message-id'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    if (Object.keys(body).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/unread`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
