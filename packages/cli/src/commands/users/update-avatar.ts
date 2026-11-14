// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

export default class UsersUpdateAvatar extends BaseCommand {
  static override summary = "Загрузка аватара сотрудника";
  static override description = "Ставит или заменяет аватар другому сотруднику. Доступно владельцу пространства и администратору, боту метод недоступен. Аватар владельца пространства меняет только он сам.\n\nПолное описание: pachca api PUT /users/{user_id}/avatar --docs";
  static scope = "user_avatar:write";
  static apiMethod = "PUT";
  static apiPath = "/users/{user_id}/avatar";
  static defaultColumns = ["image_url"];

  static override args = {
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    file: Flags.string({
      description: "Файл изображения для аватара",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersUpdateAvatar);
    this.parsedFlags = flags;

    let formData: FormData | undefined;
    if (flags.file) {
      formData = new FormData();
      if (flags.file === '-') {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
        const blob = new Blob([Buffer.concat(chunks)]);
        formData.append('image', blob, 'stdin');
      } else {
        const blob = new Blob([fs.readFileSync(flags.file)]);
        formData.append('image', blob, path.basename(flags.file));
      }
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/users/${args.user_id}/avatar`,
      formData,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
