import * as fs from 'node:fs';
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { outputError } from '../output.js';

export default class Api extends BaseCommand {
  static override description = 'Произвольный запрос к API';

  static override examples = [
    '<%= config.bin %> api GET /messages --query chat_id=123',
    '<%= config.bin %> api POST /messages -F message[chat_id]=12345 -f message[content]="Привет"',
    '<%= config.bin %> api POST /messages --input payload.json',
    '<%= config.bin %> api GET /profile -o yaml',
  ];

  static override strict = false;

  static override args = {
    method: Args.string({
      description: 'HTTP method (GET, POST, PUT, DELETE)',
      required: true,
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    }),
    path: Args.string({
      description: 'API path (e.g., /messages)',
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'raw-field': Flags.string({
      char: 'f',
      description: 'String field (key=value)',
      multiple: true,
    }),
    field: Flags.string({
      char: 'F',
      description: 'Typed field (numbers/bools auto-converted, @file reads file)',
      multiple: true,
    }),
    input: Flags.string({
      description: 'JSON file to send as body (- for stdin)',
    }),
    query: Flags.string({
      description: 'Query parameter (key=value)',
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Api);
    this.parsedFlags = flags;

    const format = this.getOutputFormat();

    // Validate mutually exclusive flags
    const hasFields = (flags['raw-field']?.length || 0) + (flags.field?.length || 0) > 0;
    if (hasFields && flags.input) {
      outputError(
        { error: '-f/-F and --input are mutually exclusive', type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    // Build query params
    const query: Record<string, string> = {};
    if (flags.query) {
      for (const q of flags.query) {
        const [key, ...rest] = q.split('=');
        query[key] = rest.join('=');
      }
    }

    // Build request body
    let body: unknown = undefined;

    if (flags.input) {
      const inputPath = flags.input;
      let raw: string;
      if (inputPath === '-') {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString('utf-8');
      } else {
        if (!fs.existsSync(inputPath)) {
          outputError(
            { error: `File not found: ${inputPath}`, type: 'PACHCA_USAGE_ERROR', code: null },
            format,
          );
          this.exit(2);
        }
        raw = fs.readFileSync(inputPath, 'utf-8');
      }
      try {
        body = JSON.parse(raw);
      } catch {
        outputError(
          { error: `Invalid JSON in ${inputPath === '-' ? 'stdin' : inputPath}`, type: 'PACHCA_USAGE_ERROR', code: null },
          format,
        );
        this.exit(2);
      }
    } else if (hasFields) {
      const merged: Record<string, unknown> = {};

      // Process -f (raw string fields)
      if (flags['raw-field']) {
        for (const field of flags['raw-field']) {
          const [key, ...rest] = field.split('=');
          const value = rest.join('=');
          setBracketNotation(merged, key, value);
        }
      }

      // Process -F (typed fields)
      if (flags.field) {
        for (const field of flags.field) {
          const [key, ...rest] = field.split('=');
          const rawValue = rest.join('=');
          const value = parseTypedValue(rawValue);
          setBracketNotation(merged, key, value);
        }
      }

      body = merged;
    }

    const { data } = await this.apiRequest({
      method: args.method,
      path: args.path,
      body,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    // pachca api outputs raw response (with data/meta wrapper)
    // No table mode for raw API
    const outFormat = format === 'table' ? 'json' : format;
    const { outputData } = await import('../output.js');
    outputData(data, { ...this.getOutputOptions(), format: outFormat as 'json' | 'yaml' | 'csv' });
  }
}

/**
 * Parse a bracket notation key and set the value in the target object.
 * Supports: a[b][c] → {a: {b: {c: value}}}, a[] → array push, a[0] → array index
 */
export function setBracketNotation(target: Record<string, unknown>, key: string, value: unknown): void {
  const parts = parseBracketKey(key);
  if (parts.length === 0) return;
  if (parts.length > 5) {
    throw new Error(`Key depth exceeds maximum of 5: ${key}`);
  }

  let current: unknown = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextArray = nextPart === '' || /^\d+$/.test(nextPart);

    if (typeof current !== 'object' || current === null) return;

    if (part === '' || /^\d+$/.test(part)) {
      // Array index
      const arr = current as unknown[];
      const idx = part === '' ? arr.length : Number.parseInt(part, 10);
      if (arr[idx] === undefined) {
        arr[idx] = isNextArray ? [] : {};
      }
      current = arr[idx];
    } else {
      const obj = current as Record<string, unknown>;
      if (obj[part] === undefined) {
        obj[part] = isNextArray ? [] : {};
      }
      current = obj[part];
    }
  }

  const lastPart = parts[parts.length - 1];
  if (typeof current !== 'object' || current === null) return;

  if (lastPart === '') {
    // Push to array
    (current as unknown[]).push(value);
  } else if (/^\d+$/.test(lastPart)) {
    (current as unknown[])[Number.parseInt(lastPart, 10)] = value;
  } else {
    (current as Record<string, unknown>)[lastPart] = value;
  }
}

function parseBracketKey(key: string): string[] {
  const parts: string[] = [];
  const match = key.match(/^([^[]+)/);
  if (!match) return [key];

  parts.push(match[1]);
  const brackets = key.slice(match[1].length);

  const bracketRegex = /\[([^\]]*)\]/g;
  let m;
  while ((m = bracketRegex.exec(brackets)) !== null) {
    parts.push(m[1]);
  }

  return parts;
}

export function parseTypedValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // @file reads file contents
  if (value.startsWith('@')) {
    const filePath = value.slice(1);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  // Try to parse as number
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value);
  }

  return value;
}
