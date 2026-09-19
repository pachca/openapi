// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as fs from 'node:fs';
import { formatSize } from '../../utils.js';

export default class FilesGet extends BaseCommand {
  static override description = "Скачивание файла";

  static scope = "files:read";
  static apiMethod = "GET";
  static apiPath = "/files/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор файла из поля `id` вложения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'target': Flags.string({
      description: "Что отдать вместо исходного файла: `pdf_preview` — документ, переведённый в PDF, `pdf_first_page` — первая страница картинкой, `thumb` — уменьшенная копия изображения, `image` — изображение как есть. Без параметра приходит исходный файл. Вариант, которого у этого файла нет, приводит к `400`.",
      options: ["pdf_preview","pdf_first_page","thumb","image"],
    }),
    save: Flags.string({
      description: 'Путь для сохранения файла',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(FilesGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/files/${args.id}`,
      query: {
      target: flags['target'],
      },
      isBinary: true,
    });

    const fileBody = Buffer.isBuffer(data) ? data : Buffer.from(String(data ?? ''));
    fs.writeFileSync(flags.save, fileBody);
    this.success(`Сохранено: ${flags.save} (${formatSize(fileBody.length)})`);

  }
}
