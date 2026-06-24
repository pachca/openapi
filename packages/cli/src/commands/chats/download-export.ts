// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { downloadFile } from '../../client.js';
import { formatSize } from '../../utils.js';

export default class ChatsDownloadExport extends BaseCommand {
  static override description = "Скачать архив экспорта";

  static override examples = [
      "Экспорт истории чата:\n  $ pachca chats download-export"
  ];

  static override hiddenAliases = ["common:get-exports"];
  static scope = "chat_exports:read";
  static plan = "corporation";
  static apiMethod = "GET";
  static apiPath = "/chats/exports/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор экспорта (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    save: Flags.string({
      description: 'Путь для сохранения файла',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsDownloadExport);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/chats/exports/${args.id}`,
      isRedirect: true,
    });

    const redirectUrl = (data as Record<string, unknown>)?.url as string;
    if (redirectUrl && flags.save) {
      const result = await downloadFile(redirectUrl, flags.save);
      this.success(`Сохранено: ${flags.save} (${formatSize(result.size)})`);
      return;
    }

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
