// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CommonUploads extends BaseCommand {
  static override description = "Получение подписи, ключа и других параметров";

  static override examples = [
      "Изменить вложения сообщения:\n  $ pachca common uploads"
  ];

  static scope = "uploads:write";
  static apiMethod = "POST";
  static apiPath = "/uploads";
  static defaultColumns = ["Content-Disposition","acl","policy","x-amz-credential","x-amz-algorithm"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CommonUploads);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/uploads',
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
