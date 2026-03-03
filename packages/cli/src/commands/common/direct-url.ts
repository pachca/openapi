// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';
import * as fs from 'node:fs';
import * as path from 'node:path';

export default class CommonDirectUrl extends BaseCommand {
  static override description = "Загрузка файла";

  static apiMethod = "POST";
  static apiPath = "/direct_url";
  static requiresAuth = false;

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'contentDisposition': Flags.string({
      description: "Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'acl': Flags.string({
      description: "Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'policy': Flags.string({
      description: "Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'xAmzCredential': Flags.string({
      description: "Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'xAmzAlgorithm': Flags.string({
      description: "Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'xAmzDate': Flags.string({
      description: "Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'xAmzSignature': Flags.string({
      description: "Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    'key': Flags.string({
      description: "Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)",
    }),
    file: Flags.string({
      description: "Файл для загрузки",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CommonDirectUrl);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'contentDisposition', label: "Параметр Content-Disposition, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'acl', label: "Параметр acl, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'policy', label: "Параметр policy, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'xAmzCredential', label: "Параметр x-amz-credential, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'xAmzAlgorithm', label: "Параметр x-amz-algorithm, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'xAmzDate', label: "Параметр x-amz-date, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'xAmzSignature', label: "Параметр x-amz-signature, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
      { flag: 'key', label: "Параметр key, полученный в ответе на запрос [Получение подписи, ключа и других параметров](POST /uploads)", type: 'string' },
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

    let formData: FormData | undefined;
    if (flags.file) {
      formData = new FormData();
      if (flags.file === '-') {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
        const blob = new Blob([Buffer.concat(chunks)]);
        formData.append('file', blob, 'stdin');
      } else {
        const blob = new Blob([fs.readFileSync(flags.file)]);
        formData.append('file', blob, path.basename(flags.file));
      }
      if (flags['contentDisposition']) formData.append('contentDisposition', String(flags['contentDisposition']));
      if (flags['acl']) formData.append('acl', String(flags['acl']));
      if (flags['policy']) formData.append('policy', String(flags['policy']));
      if (flags['xAmzCredential']) formData.append('xAmzCredential', String(flags['xAmzCredential']));
      if (flags['xAmzAlgorithm']) formData.append('xAmzAlgorithm', String(flags['xAmzAlgorithm']));
      if (flags['xAmzDate']) formData.append('xAmzDate', String(flags['xAmzDate']));
      if (flags['xAmzSignature']) formData.append('xAmzSignature', String(flags['xAmzSignature']));
      if (flags['key']) formData.append('key', String(flags['key']));
    }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/direct_url',
      formData,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
