import { Args, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseCommand } from '../base-command.js';

interface UploadParams {
  'Content-Disposition': string;
  acl: string;
  policy: string;
  'x-amz-credential': string;
  'x-amz-algorithm': string;
  'x-amz-date': string;
  'x-amz-signature': string;
  key: string;
  direct_url: string;
}

export default class Upload extends BaseCommand {
  static override description = 'Загрузить файл (получает подпись и загружает автоматически)';

  static override examples = [
    '<%= config.bin %> upload photo.jpg',
    'cat data.csv | <%= config.bin %> upload -',
  ];

  static scope = 'uploads:write';

  static override args = {
    file: Args.string({
      description: 'Путь к файлу или - для stdin',
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Upload);
    this.parsedFlags = flags;


    // Step 1: Get upload params
    const { data: uploadData } = await this.apiRequest({
      method: 'POST',
      path: '/uploads',
    });

    const params = uploadData as UploadParams;

    // Step 2: Read file
    let fileBlob: Blob;
    let fileName: string;

    if (args.file === '-') {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
      fileBlob = new Blob([Buffer.concat(chunks)]);
      fileName = 'stdin';
    } else {
      if (!fs.existsSync(args.file)) {
        this.validationError(
          [{ message: `Файл не найден: ${args.file}` }],
          { type: 'PACHCA_USAGE_ERROR' },
        );
      }
      fileBlob = new Blob([fs.readFileSync(args.file)]);
      fileName = path.basename(args.file);
    }

    // Step 3: Replace ${filename} in key
    const key = params.key.replace('${filename}', fileName);

    // Step 4: Build FormData
    const formData = new FormData();
    formData.append('Content-Disposition', params['Content-Disposition']);
    formData.append('acl', params.acl);
    formData.append('policy', params.policy);
    formData.append('x-amz-credential', params['x-amz-credential']);
    formData.append('x-amz-algorithm', params['x-amz-algorithm']);
    formData.append('x-amz-date', params['x-amz-date']);
    formData.append('x-amz-signature', params['x-amz-signature']);
    formData.append('key', key);
    formData.append('file', fileBlob, fileName);

    // Step 5: Upload to external URL (no auth)
    await this.apiRequest({
      method: 'POST',
      path: params.direct_url,
      formData,
      noAuth: true,
    });

    // Output the key for use in messages
    this.output({ key });
  }
}
