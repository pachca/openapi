import { Args, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseCommand } from '../base-command.js';

interface UploadParams {
  'Content-Disposition': string;
  acl?: string;
  policy: string;
  'x-amz-credential': string;
  'x-amz-algorithm': string;
  'x-amz-date': string;
  'x-amz-signature': string;
  key: string;
  bucket?: string;
  direct_url: string;
}

export default class Upload extends BaseCommand {
  static override description = 'Загрузить файл (получает подпись и загружает автоматически)';

  static override examples = [
    '<%= config.bin %> upload photo.jpg',
    'cat data.csv | <%= config.bin %> upload - --name data.csv',
    '<%= config.bin %> upload ./build/out.pdf --name report.pdf',
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
    name: Flags.string({
      description:
        'Имя файла, которым заканчивается key. Расширение name при отправке файла в сообщении должно совпадать с расширением этого имени. По умолчанию это имя загружаемого файла, а у данных из stdin имя stdin без расширения',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Upload);
    this.parsedFlags = flags;

    const fromStdin = args.file === '-';
    if (flags.name !== undefined && !isPlainFileName(flags.name)) {
      this.validationError(
        [{ message: 'Имя файла в --name не может быть пустым и содержать / или \\', flag: 'name' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }
    if (!fromStdin && !fs.existsSync(args.file)) {
      this.validationError(
        [{ message: `Файл не найден: ${args.file}` }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    // Step 1: Get upload params
    const { data: uploadData } = await this.apiRequest({
      method: 'POST',
      path: '/uploads',
    });

    const params = uploadData as UploadParams;

    // Step 2: Read file
    let fileBlob: Blob;
    let fileName: string;

    // The key ends in this name, and the API checks the extension of `name` in
    // a message's `files` against it. Data from stdin has no name of its own.
    if (fromStdin) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
      fileBlob = new Blob([Buffer.concat(chunks)]);
      fileName = flags.name ?? 'stdin';
    } else {
      fileBlob = new Blob([fs.readFileSync(args.file)]);
      fileName = flags.name ?? path.basename(args.file);
    }

    // Step 3: Replace ${filename} in key
    const key = params.key.replace('${filename}', fileName);

    // Step 4: Build FormData. A workspace gets `acl` or `bucket`, depending on its storage
    const formData = new FormData();
    formData.append('Content-Disposition', params['Content-Disposition']);
    if (params.acl !== undefined) formData.append('acl', params.acl);
    formData.append('policy', params.policy);
    formData.append('x-amz-credential', params['x-amz-credential']);
    formData.append('x-amz-algorithm', params['x-amz-algorithm']);
    formData.append('x-amz-date', params['x-amz-date']);
    formData.append('x-amz-signature', params['x-amz-signature']);
    formData.append('key', key);
    if (params.bucket !== undefined) formData.append('bucket', params.bucket);
    formData.append('file', fileBlob, fileName);

    // Step 5: Upload to external URL (no auth)
    await this.apiRequest({
      method: 'POST',
      path: params.direct_url,
      formData,
      noAuth: true,
    });

    // Said after the upload succeeds, so a failed one does not report a file as uploaded.
    if (fromStdin && flags.name === undefined && !flags.quiet) {
      process.stderr.write(
        '⚠ Файл из stdin загружен под именем stdin без расширения: в name файла в сообщении расширения тоже не должно быть.\n' +
          '  Имя с расширением задаёт флаг --name, например --name report.csv\n',
      );
    }

    // Output the key for use in messages
    this.output({ key });
  }
}

/** A bare file name: the key keeps its folder, so a path separator would move the file out of it. */
function isPlainFileName(name: string): boolean {
  return name.trim() !== '' && !/[\\/]/.test(name);
}
