// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesGetHistory extends BaseCommand {
  static override summary = "История сообщения";
  static override description = "Сохранённые состояния сообщения от раннего к последнему: текст и файлы до каждой правки текста или файлов и на момент удаления, кто и когда их изменил. В историю входят 50 последних изменений.\n\nПолное описание: pachca api GET /company/messages/{id}/history --docs";
  static scope = "company_messages:read";
  static plan = "corporation";
  static apiMethod = "GET";
  static apiPath = "/company/messages/{id}/history";
  static defaultColumns = ["content","version_id","editor_id","changed_at","action"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения (pachca messages list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesGetHistory);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/company/messages/${args.id}/history`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
    this.warnMetaFlag(responseBody.meta, "history_is_partial", "История неполная", "Ранние состояния сообщения известны не полностью: оно создано до 22 апреля 2026 года, удалено до 15 августа 2026 года или изменения его файлов нельзя восстановить однозначно.");
    this.warnMetaFlag(responseBody.meta, "truncated", "История обрезана", "Изменений больше 50, в ответ вошли только 50 последних.");
  }
}
