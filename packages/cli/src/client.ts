import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spinner } from '@clack/prompts';
import ansis from 'ansis';
import { isInteractive } from './utils.js';

const BASE_URL = 'https://api.pachca.com/api/shared/v1';

export type ErrorType =
  | 'PACHCA_AUTH_ERROR'
  | 'PACHCA_API_ERROR'
  | 'PACHCA_NETWORK_ERROR'
  | 'PACHCA_TIMEOUT_ERROR'
  | 'PACHCA_SCOPE_ERROR'
  | 'PACHCA_VALIDATION_ERROR'
  | 'PACHCA_COMMAND_NOT_FOUND'
  | 'PACHCA_DESTRUCTIVE_OP_ERROR'
  | 'PACHCA_USAGE_ERROR'
  | 'PACHCA_AUTH_LOGIN_ERROR';

export interface PachcaError {
  error: string;
  code: number | null;
  type: ErrorType;
  message?: string;
  request_id?: string;
  hint?: string;
  [key: string]: unknown;
}

export interface RequestOptions {
  method: string;
  path: string;
  token: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
  noRetry?: boolean;
  isRedirect?: boolean;
  formData?: FormData;
}

export interface ClientFlags {
  output?: string;
  quiet?: boolean;
  verbose?: boolean;
  'dry-run'?: boolean;
  'no-retry'?: boolean;
  timeout?: number;
}

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30;

function buildUrl(apiPath: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(apiPath.startsWith('/') ? `${BASE_URL}${apiPath}` : `${BASE_URL}/${apiPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function maskToken(token: string): string {
  return '••••••••';
}

export function formatDryRun(opts: RequestOptions, isJson: boolean): string | object {
  const url = buildUrl(opts.path, opts.query);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${maskToken(opts.token)}`,
    ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    ...opts.headers,
  };

  if (isJson) {
    return {
      dry_run: true,
      method: opts.method,
      url,
      headers,
      body: opts.body || undefined,
    };
  }

  const lines = [
    `  ${ansis.bold(opts.method)} ${url}`,
    ...Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`),
  ];
  if (opts.body) {
    lines.push('');
    lines.push('  ' + JSON.stringify(opts.body, null, 2).split('\n').join('\n  '));
  }
  return lines.join('\n');
}

export async function request(
  opts: RequestOptions,
  clientFlags?: ClientFlags,
): Promise<{ data: unknown; status: number; headers: Headers }> {
  const url = buildUrl(opts.path, opts.query);
  const rawEnvTimeout = process.env.PACHCA_TIMEOUT ? Number(process.env.PACHCA_TIMEOUT) : undefined;
  const envTimeout = rawEnvTimeout && !Number.isNaN(rawEnvTimeout) ? rawEnvTimeout : undefined;
  const timeoutSeconds = opts.timeout ?? clientFlags?.timeout ?? envTimeout ?? DEFAULT_TIMEOUT;
  const noRetry = opts.noRetry ?? clientFlags?.['no-retry'] ?? false;

  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/json',
    ...opts.headers,
  };

  let fetchBody: BodyInit | undefined;
  if (opts.formData) {
    fetchBody = opts.formData;
    // Let fetch set Content-Type with boundary for FormData
    delete fetchHeaders['Content-Type'];
  } else if (opts.body) {
    fetchHeaders['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(opts.body);
  }

  const showSpinner = isInteractive() && !clientFlags?.quiet && !clientFlags?.['dry-run'];
  const s = showSpinner ? spinner() : null;
  s?.start('Загрузка...');

  if (clientFlags?.verbose) {
    process.stderr.write(`${ansis.dim(`→ ${opts.method} ${url}`)}\n`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (noRetry ? 0 : MAX_RETRIES); attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

      const response = await fetch(url, {
        method: opts.method,
        headers: fetchHeaders,
        body: fetchBody,
        signal: controller.signal,
        redirect: opts.isRedirect ? 'manual' : 'follow',
      });

      clearTimeout(timer);

      if (clientFlags?.verbose) {
        process.stderr.write(`${ansis.dim(`← ${response.status} ${response.statusText}`)}\n`);
      }

      // Handle 302 redirect
      if (response.status === 302) {
        const location = response.headers.get('location');
        s?.stop('');
        return {
          data: { url: location },
          status: 302,
          headers: response.headers,
        };
      }

      // Handle rate limiting (429)
      if (response.status === 429 && !noRetry && attempt < MAX_RETRIES) {
        const retryAfter = response.headers.get('retry-after');
        const parsed = retryAfter ? Number.parseInt(retryAfter, 10) : NaN;
        const waitMs = Number.isNaN(parsed) ? 1000 : parsed * 1000;
        if (clientFlags?.verbose) {
          process.stderr.write(`${ansis.dim(`⏳ Rate limited, retrying in ${waitMs}ms...`)}\n`);
        }
        await sleep(waitMs);
        continue;
      }

      // Handle 503 with backoff
      if (response.status === 503 && !noRetry && attempt < MAX_RETRIES) {
        const baseMs = 1000;
        const waitMs = baseMs * Math.pow(2, attempt) + Math.random() * baseMs;
        if (clientFlags?.verbose) {
          process.stderr.write(`${ansis.dim(`⏳ Service unavailable, retrying in ${Math.round(waitMs)}ms...`)}\n`);
        }
        await sleep(waitMs);
        continue;
      }

      // Parse response body
      const contentType = response.headers.get('content-type') || '';
      let data: unknown;

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        data = null;
      } else if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        s?.stop('');
        const requestId = response.headers.get('x-request-id') || undefined;
        throw createApiError(response.status, data, requestId);
      }

      s?.stop('');
      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        s?.stop('');
        throw new ApiError({
          error: 'Request timed out',
          code: null,
          type: 'PACHCA_TIMEOUT_ERROR',
          message: `Request timed out after ${timeoutSeconds}s`,
        });
      }

      lastError = error as Error;
      // Only retry network errors for idempotent methods (not POST/DELETE)
      const safeMethod = ['GET', 'HEAD', 'OPTIONS', 'PUT'].includes(opts.method);
      if (!safeMethod || noRetry || attempt >= MAX_RETRIES) {
        break;
      }
    }
  }

  s?.stop('');
  throw new ApiError({
    error: 'Network error',
    code: null,
    type: 'PACHCA_NETWORK_ERROR',
    message: lastError?.message || 'Failed to connect to server',
  });
}

function createApiError(status: number, body: unknown, requestId?: string): ApiError {
  // OAuthError format: {error: string, error_description: string}
  if (isRecord(body) && typeof body.error === 'string' && typeof body.error_description === 'string') {
    const type: ErrorType = 'PACHCA_AUTH_ERROR';
    return new ApiError({
      error: body.error_description as string,
      code: status,
      type,
      message: body.error as string,
      request_id: requestId,
    });
  }

  // ApiError format: {errors: [{message: string}]}
  if (isRecord(body) && Array.isArray(body.errors) && body.errors.length > 0) {
    const firstError = body.errors[0] as { message?: string };
    return new ApiError({
      error: firstError.message || `HTTP ${status}`,
      code: status,
      type: 'PACHCA_API_ERROR',
      request_id: requestId,
    });
  }

  // Fallback
  const messages: Record<number, string> = {
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    422: 'Validation error',
    500: 'Internal server error',
  };

  return new ApiError({
    error: messages[status] || `HTTP ${status}`,
    code: status,
    type: status === 401 || status === 403 ? 'PACHCA_AUTH_ERROR' : 'PACHCA_API_ERROR',
    request_id: requestId,
  });
}

export function getExitCode(error: ApiError): number {
  if (error.details.type === 'PACHCA_AUTH_ERROR' || error.details.type === 'PACHCA_AUTH_LOGIN_ERROR') return 3;
  if (error.details.code === 404) return 4;
  if (error.details.type === 'PACHCA_VALIDATION_ERROR' || error.details.type === 'PACHCA_USAGE_ERROR') return 2;
  return 1;
}

export class ApiError extends Error {
  constructor(public details: PachcaError) {
    super(details.error);
    this.name = 'ApiError';
  }
}

export async function downloadFile(url: string, savePath: string): Promise<{ size: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    // If savePath is a directory, derive filename
    let finalPath = savePath;
    if (savePath.endsWith('/') || (fs.existsSync(savePath) && fs.statSync(savePath).isDirectory())) {
      const disposition = response.headers.get('content-disposition');
      let filename = '';
      if (disposition) {
        const match = disposition.match(/filename="?([^";\n]+)"?/);
        if (match) filename = match[1];
      }
      if (!filename) {
        const urlPath = new URL(url).pathname;
        filename = path.basename(urlPath.split('?')[0]);
      }
      if (!filename) filename = 'download';

      if (!fs.existsSync(savePath)) {
        throw new Error(`Directory does not exist: ${savePath}`);
      }
      finalPath = path.join(savePath, filename);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const nodeStream = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
    await pipeline(nodeStream, fs.createWriteStream(finalPath));

    const stat = fs.statSync(finalPath);
    return { size: stat.size };
  } finally {
    clearTimeout(timer);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
