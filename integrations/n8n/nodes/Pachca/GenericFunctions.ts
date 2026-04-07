import type {
  ICredentialDataDecryptedObject,
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeListSearchResult,
  INodePropertyOptions,
  IN8nHttpFullResponse,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';
import * as crypto from 'crypto';

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

/** Human-readable field name mapping for error messages */
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  entity_id: 'Entity ID',
  entity_type: 'Entity Type',
  member_ids: 'Member IDs',
  group_tag_ids: 'Group Tag IDs',
  performer_ids: 'Performer IDs',
  parent_message_id: 'Parent Message ID',
  chat_id: 'Chat ID',
  user_id: 'User ID',
  first_name: 'First Name',
  last_name: 'Last Name',
  file_type: 'File Type',
  due_at: 'Due Date',
  callback_id: 'Callback ID',
  trigger_id: 'Trigger ID',
  outgoing_url: 'Webhook URL',
};

/** Friendly descriptions for common HTTP status codes */
const STATUS_HINTS: Record<number, string> = {
  401: 'Authentication failed. Check your API token in Pachca credentials.',
  403: 'Insufficient permissions. This operation may require an admin token or additional scopes.',
  404: 'The requested resource was not found. Check the ID value.',
  422: 'Validation error. Check the field values below.',
  429: 'Rate limit exceeded. Please wait and try again.',
};

/** Key fields per resource for Simplify mode — only these fields are returned */
const SIMPLIFY_FIELDS: Record<string, string[]> = {
  message: ['id', 'entity_id', 'chat_id', 'content', 'user_id', 'created_at'],
  chat: ['id', 'name', 'channel', 'public', 'member_ids', 'created_at'],
  user: ['id', 'first_name', 'last_name', 'nickname', 'email', 'role', 'suspended'],
  task: ['id', 'content', 'kind', 'status', 'priority', 'due_at', 'created_at'],
  bot: ['id', 'webhook'],
  groupTag: ['id', 'name', 'users_count'],
  reaction: ['code', 'name', 'user_id', 'created_at'],
  export: ['id', 'status', 'created_at'],
};

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verifies HMAC-SHA256 signature of incoming webhook requests.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expected = hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// S3 FILE UPLOAD UTILITIES
// ============================================================================

/** MIME type lookup table (module-level to avoid re-creation per call) */
const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
};

/** Detect MIME type from file extension */
export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Build multipart/form-data body for S3 upload.
 * Field order matters for S3: all policy fields first, then file last.
 */
export function buildMultipartBody(
  fields: Record<string, string>,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  fileFieldName = 'file',
): { body: Buffer; contentType: string } {
  const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
  const parts: Buffer[] = [];
  // Sanitize filename: strip CRLF and quotes to prevent header injection
  // eslint-disable-next-line no-control-regex
  const safeName = fileName.replace(/[\x00-\x1f\x7f\\"]/g, '_').slice(0, 255);

  // Policy fields first (order matters for S3)
  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

  // File last
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${fileFieldName}"; filename="${safeName}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
  );
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

/**
 * Upload avatar image via multipart/form-data.
 * Reads binary data from the input and sends it to the avatar endpoint.
 */
export async function uploadAvatar(
  ctx: IExecuteFunctions,
  itemIndex: number,
  url: string,
): Promise<IDataObject> {
  const binaryProperty = ctx.getNodeParameter('image', itemIndex, 'data') as string;
  const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryProperty);
  const fileBuffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
  const fileName = binaryData.fileName || 'avatar.jpg';
  const mimeType = binaryData.mimeType || detectMimeType(fileName);

  const multipart = buildMultipartBody({}, fileBuffer, fileName, mimeType, 'image');

  const credentials = await ctx.getCredentials('pachcaApi');
  const base = sanitizeBaseUrl(credentials.baseUrl as string);

  const response = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'pachcaApi', {
    method: 'PUT',
    url: `${base}${url}`,
    body: multipart.body,
    headers: { 'Content-Type': multipart.contentType },
  });

  if (typeof response === 'object' && response !== null) {
    const data = (response as IDataObject).data;
    return (data as IDataObject) ?? (response as IDataObject);
  }
  return { success: true } as unknown as IDataObject;
}

// ============================================================================
// BOT ID AUTO-DETECTION
// ============================================================================

/**
 * Resolve bot ID: use explicit credential value, or auto-detect via /oauth/token/info.
 * Returns the bot's user_id if the token belongs to a bot, or 0 if it's a personal token.
 * Throws on network/auth errors so callers can distinguish "not a bot" from "failed to check".
 */
export async function resolveBotId(
  context: IHookFunctions,
  credentials: ICredentialDataDecryptedObject,
): Promise<number> {
  if (credentials.botId && Number(credentials.botId) > 0) {
    return Number(credentials.botId);
  }
  const response = (await context.helpers.httpRequestWithAuthentication.call(
    context,
    'pachcaApi',
    {
      method: 'GET',
      url: `${credentials.baseUrl}/oauth/token/info`,
    },
  )) as IDataObject;
  const data = response.data as IDataObject | undefined;
  // Bot tokens have name: null, personal tokens have a user-defined name
  if (data && data.name === null && data.user_id) {
    return Number(data.user_id);
  }
  return 0;
}

/** Sanitize baseUrl: strip trailing slashes, validate protocol */
export function sanitizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error(`Invalid Base URL: must start with http:// or https://. Got: ${trimmed}`);
  }
  return trimmed;
}

// ============================================================================
// EXECUTE() MODE HELPERS
// ============================================================================

/**
 * Make an authenticated API request to Pachca.
 * Handles error responses with rich context (field names, status hints).
 */
export async function makeApiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  qs?: IDataObject,
  itemIndex?: number,
): Promise<IDataObject> {
  const credentials = await this.getCredentials('pachcaApi');
  const baseUrl = sanitizeBaseUrl(credentials.baseUrl as string);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
  }
  // Separate array params from scalar params — arrays need []= format for Rails
  let scalarQs: IDataObject | undefined = qs;
  let arrayQuerySuffix = '';
  if (qs) {
    const scalarEntries: [string, unknown][] = [];
    const arrayParts: string[] = [];
    for (const [key, value] of Object.entries(qs)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          arrayParts.push(`${encodeURIComponent(key + '[]')}=${encodeURIComponent(String(v))}`);
        }
      } else {
        scalarEntries.push([key, value]);
      }
    }
    scalarQs = scalarEntries.length > 0 ? Object.fromEntries(scalarEntries) as IDataObject : undefined;
    arrayQuerySuffix = arrayParts.join('&');
  }

  let url = `${baseUrl}${endpoint}`;
  if (arrayQuerySuffix) {
    url += (url.includes('?') ? '&' : '?') + arrayQuerySuffix;
  }

  const options: IHttpRequestOptions = {
    method,
    url,
    headers,
    qs: scalarQs,
    body: (method !== 'GET' && method !== 'DELETE') ? body : undefined,
    returnFullResponse: true,
    ignoreHttpStatusErrors: true,
  };

  const response = (await this.helpers.httpRequestWithAuthentication.call(
    this, 'pachcaApi', options,
  )) as IN8nHttpFullResponse;

  // Handle empty/null body (e.g. 204 No Content)
  if (!response.body || typeof response.body !== 'object') {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return { success: true } as unknown as IDataObject;
    }
  }

  if (response.statusCode >= 400) {
    const resBody = (response.body ?? {}) as IDataObject;
    const errors = resBody.errors as Array<{ key: string; value: string }> | undefined;

    let message: string;
    if (errors?.length) {
      message = errors.map(e => {
        const displayName = FIELD_DISPLAY_NAMES[e.key] || e.key;
        return `${displayName}: ${e.value}`;
      }).join('; ');
    } else {
      message = ((resBody.message || resBody.error || `Request failed with status ${response.statusCode}`) as string);
    }

    const hint = STATUS_HINTS[response.statusCode];
    const description = hint ? `${hint}\n${message}` : message;

    const apiError = new NodeApiError(this.getNode(), resBody as JsonObject, {
      message,
      httpCode: String(response.statusCode),
      description,
      itemIndex,
    });
    // Attach Retry-After for pagination retry logic
    const headers = response.headers as Record<string, string> | undefined;
    if (headers?.['retry-after']) {
      (apiError as NodeApiError & { retryAfter?: number }).retryAfter = parseInt(headers['retry-after'], 10) || 2;
    }
    throw apiError;
  }

  return response.body as IDataObject;
}

/**
 * Paginated API request with cursor-based pagination and 429 retry.
 * Handles returnAll/limit, v1 legacy per/page, and simplify.
 */
export async function makeApiRequestAllPages(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  qs: IDataObject,
  itemIndex: number,
  resource: string,
  nodeVersion: number,
): Promise<INodeExecutionData[]> {
  // v1 legacy offset-based pagination
  if (nodeVersion === 1) {
    let legacyPer: number | undefined;
    let legacyPage: number | undefined;
    try {
      const paginationOptions = this.getNodeParameter('paginationOptions', itemIndex, null) as
        | { per?: number; page?: number }
        | null;
      if (paginationOptions) {
        legacyPer = paginationOptions.per;
        legacyPage = paginationOptions.page;
      }
    } catch { /* parameter doesn't exist */ }

    if (legacyPer || legacyPage) {
      const pageQs = { ...qs, per: legacyPer ?? 25, page: legacyPage ?? 1 };
      const response = await makeApiRequest.call(this, method, endpoint, undefined, pageQs, itemIndex);
      const items = (response.data as IDataObject[]) ?? [];
      return items.map(item => ({ json: item }));
    }

    // V1-specific: collection pagination params already in qs (via optionalQueryMap + v1Collection).
    // Original V1 used single-page manual pagination for these endpoints.
    const hasV1CollectionPagination = ('per' in qs || 'page' in qs ||
      (qs.cursor !== undefined && qs.cursor !== '') ||
      (qs.limit !== undefined && qs.limit !== ''));
    if (hasV1CollectionPagination) {
      const response = await makeApiRequest.call(this, method, endpoint, undefined, qs, itemIndex);
      const items = (response.data as IDataObject[]) ?? [];
      return items.map(item => ({
        json: typeof item === 'object' && item !== null ? item : { value: item } as unknown as IDataObject,
      }));
    }
  }

  // Check returnAll / getAllUsersNoLimit (v1 alias)
  let returnAll = false;
  try { returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean; } catch { /* */ }
  if (!returnAll) {
    try { returnAll = this.getNodeParameter('getAllUsersNoLimit', itemIndex, false) as boolean; } catch { /* */ }
  }

  const limit = returnAll ? 0 : ((this.getNodeParameter('limit', itemIndex, 50) as number) || 50);
  const results: IDataObject[] = [];
  let cursor: string | undefined;
  let totalRetries = 0;
  const MAX_RETRIES = 5;
  const MAX_PAGES = 1000;
  let pageCount = 0;

  do {
    const perPage = returnAll ? 200 : limit;
    const pageQs: IDataObject = { ...qs, limit: perPage };
    if (cursor) pageQs.cursor = cursor;

    // Inner retry loop: avoids `continue` on the outer do-while, which
    // would re-evaluate `while(cursor && ...)` and exit prematurely when
    // cursor is undefined (e.g. 429 on the very first page).
    let response: IDataObject;
    for (;;) {
      try {
        response = await makeApiRequest.call(this, method, endpoint, undefined, pageQs, itemIndex);
        break;
      } catch (error: unknown) {
        const err = error instanceof NodeApiError ? error : null;
        const code = err?.httpCode;
        if ((code === '429' || code === '502' || code === '503') && totalRetries < MAX_RETRIES) {
          totalRetries++;
          const retryAfter = (err as NodeApiError & { retryAfter?: number })?.retryAfter;
          const waitSec = retryAfter ?? (code === '429' ? 2 : 1);
          await sleep(waitSec * 1000);
          continue;
        }
        throw error;
      }
    }

    const items = (response.data as IDataObject[]) ?? [];
    results.push(...items);
    const meta = response.meta as IDataObject | undefined;
    const paginate = meta?.paginate as IDataObject | undefined;
    const nextCursor = (paginate?.next_page as string) ?? undefined;

    // Guard against infinite loops: server returned the same cursor we just sent
    if (nextCursor && nextCursor === cursor) break;
    cursor = nextCursor;
    pageCount++;
  } while (cursor && (returnAll || results.length < limit) && pageCount < MAX_PAGES);

  const finalResults = returnAll ? results : results.slice(0, limit);

  // Apply simplify if enabled (v2 only)
  if (nodeVersion >= 2) {
    let simplify = false;
    try { simplify = this.getNodeParameter('simplify', itemIndex, false) as boolean; } catch { /* */ }
    if (simplify) {
      const keyFields = SIMPLIFY_FIELDS[resource];
      if (keyFields) {
        return finalResults.map(item => ({
          json: Object.fromEntries(Object.entries(item).filter(([k]) => keyFields.includes(k))),
        }));
      }
    }
  }

  return finalResults.map(item => ({
    json: typeof item === 'object' && item !== null ? item : { value: item } as unknown as IDataObject,
  }));
}

/** Simplify a single item by keeping only key fields for the resource */
export function simplifyItem(item: IDataObject, resource: string): IDataObject {
  const keyFields = SIMPLIFY_FIELDS[resource];
  if (!keyFields) return item;
  const simplified = Object.fromEntries(Object.entries(item).filter(([k]) => keyFields.includes(k)));
  // If no fields matched (e.g. status response with user resource), return original
  return Object.keys(simplified).length > 0 ? simplified : item;
}

/**
 * Extract value from resourceLocator parameter (v2) or plain number/string (v1).
 * ResourceLocator returns { mode, value, __rl: true }.
 */
export function resolveResourceLocator(
  ctx: IExecuteFunctions,
  paramName: string,
  itemIndex: number,
  fallbackParam?: string,
): number | string {
  let value: unknown;
  try {
    value = ctx.getNodeParameter(paramName, itemIndex);
  } catch {
    if (fallbackParam) {
      value = ctx.getNodeParameter(fallbackParam, itemIndex);
    } else {
      throw new NodeOperationError(ctx.getNode(), `Missing required parameter: ${paramName}`, { itemIndex });
    }
  }
  if (typeof value === 'object' && value !== null && (value as IDataObject).__rl) {
    const rlValue = (value as IDataObject).value;
    if (rlValue === null || rlValue === undefined || rlValue === '') {
      throw new NodeOperationError(ctx.getNode(), `Parameter "${paramName}" is empty`, { itemIndex });
    }
    return rlValue as number | string;
  }
  if (value === null || value === undefined || value === '') {
    throw new NodeOperationError(ctx.getNode(), `Parameter "${paramName}" is empty`, { itemIndex });
  }
  return value as number | string;
}

/**
 * Build button rows from visual builder or raw JSON parameters.
 * Returns Button[][] ready for API body.
 */
export function buildButtonRows(
  ctx: IExecuteFunctions,
  itemIndex: number,
): IDataObject[][] {
  let buttonLayout: string;
  try { buttonLayout = ctx.getNodeParameter('buttonLayout', itemIndex, 'none') as string; } catch { return []; }
  if (buttonLayout === 'none') return [];

  if (buttonLayout === 'raw_json') {
    let rawJson: string;
    try { rawJson = ctx.getNodeParameter('rawJsonButtons', itemIndex, '') as string; } catch { return []; }
    if (!rawJson || rawJson.trim() === '' || rawJson.trim() === '[]') return [];

    let parsed: unknown;
    try { parsed = JSON.parse(rawJson); } catch {
      throw new NodeOperationError(ctx.getNode(),
        'The buttons JSON is not valid. Expected format: [{"text": "Click me"}] or [[{"text": "Row 1"}, {"text": "Row 2"}]]',
        { itemIndex },
      );
    }
    if (!Array.isArray(parsed)) {
      throw new NodeOperationError(ctx.getNode(), 'Buttons JSON must be an array', { itemIndex });
    }
    if (parsed.length > 0 && parsed.every((item: unknown) => Array.isArray(item))) {
      return parsed as IDataObject[][];
    }
    return [parsed as IDataObject[]];
  }

  // Visual mode (single_row / multiple_rows)
  let buttonsParam: { button?: IDataObject[]; buttonRow?: IDataObject[] } | undefined;
  try { buttonsParam = ctx.getNodeParameter('buttons', itemIndex, {}) as typeof buttonsParam; } catch { return []; }
  const items = buttonsParam?.button ?? buttonsParam?.buttonRow ?? [];
  if (items.length === 0) return [];

  if (buttonLayout === 'single_row') {
    return [items.map(btn => buildButton(btn))];
  }
  // multiple_rows
  return items.map(btn => [buildButton(btn)]);
}

function buildButton(btn: IDataObject): IDataObject {
  const result: IDataObject = { text: btn.text as string };
  if (btn.type === 'url' && btn.url) {
    result.url = btn.url as string;
  } else if (btn.data) {
    result.data = btn.data as string;
  }
  return result;
}

/**
 * Clean up file attachments from fixedCollection format.
 * Removes empty/zero fields and maps camelCase to snake_case.
 */
export function cleanFileAttachments(
  ctx: IExecuteFunctions,
  itemIndex: number,
): IDataObject[] {
  let filesRaw: unknown;
  try {
    const additional = ctx.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
    filesRaw = additional.files;
  } catch { return []; }
  if (!filesRaw) return [];

  let files: IDataObject[];
  if (Array.isArray(filesRaw)) {
    files = filesRaw as IDataObject[];
  } else if (typeof filesRaw === 'object' && (filesRaw as IDataObject).file) {
    files = (filesRaw as IDataObject).file as IDataObject[];
  } else {
    return [];
  }

  const keyMap: Record<string, string> = { fileType: 'file_type' };
  return files.map(f => {
    const clean: IDataObject = {};
    for (const [k, v] of Object.entries(f)) {
      if ((k === 'height' || k === 'width') && (v === 0 || v === '')) continue;
      if (v === '' || v === undefined || v === null) continue;
      clean[keyMap[k] || k] = v;
    }
    return clean;
  });
}

/**
 * Resolve form blocks from builder mode or JSON input.
 * Works with IExecuteFunctions context (execute() mode).
 */
export function resolveFormBlocksFromParams(
  ctx: IExecuteFunctions,
  itemIndex: number,
): IDataObject[] {
  let builderMode: string;
  try { builderMode = ctx.getNodeParameter('formBuilderMode', itemIndex, 'json') as string; } catch { builderMode = 'json'; }

  if (builderMode === 'builder') {
    let rawBlocks: IDataObject | undefined;
    try { rawBlocks = ctx.getNodeParameter('formBlocks', itemIndex, {}) as IDataObject; } catch { return []; }
    const blockEntries = (rawBlocks?.block ?? []) as IDataObject[];
    if (blockEntries.length === 0) return [];

    const blocks: IDataObject[] = [];
    for (const entry of blockEntries) {
      const block: IDataObject = { type: entry.type };
      const blockType = entry.type as string;

      if (['header', 'plain_text', 'markdown'].includes(blockType)) {
        if (entry.text) block.text = entry.text;
      }
      if (blockType === 'divider') { blocks.push(block); continue; }

      if (['input', 'select', 'radio', 'checkbox', 'date', 'time', 'file_input'].includes(blockType)) {
        if (entry.name) block.name = entry.name;
        if (entry.label) block.label = entry.label;
        if (entry.required === true) block.required = true;
        if (entry.hint && (entry.hint as string).trim()) block.hint = entry.hint;
      }

      if (blockType === 'input') {
        if (entry.placeholder && (entry.placeholder as string).trim()) block.placeholder = entry.placeholder;
        if (entry.multiline === true) block.multiline = true;
        if (entry.initial_value && (entry.initial_value as string).trim()) block.initial_value = entry.initial_value;
        if (entry.min_length && (entry.min_length as number) > 0) block.min_length = entry.min_length;
        if (entry.max_length && (entry.max_length as number) > 0) block.max_length = entry.max_length;
      }

      if (['select', 'radio', 'checkbox'].includes(blockType) && entry.options) {
        const optionsData = entry.options as IDataObject;
        const optionEntries = (optionsData?.option ?? []) as IDataObject[];
        if (optionEntries.length > 0) {
          block.options = optionEntries.map(opt => {
            const cleanOpt: IDataObject = { text: opt.text, value: opt.value };
            if (opt.description && (opt.description as string).trim()) cleanOpt.description = opt.description;
            if (blockType === 'select' && opt.selected === true) cleanOpt.selected = true;
            if (['radio', 'checkbox'].includes(blockType) && opt.checked === true) cleanOpt.checked = true;
            return cleanOpt;
          });
        }
      }

      if (blockType === 'date' && entry.initial_date && (entry.initial_date as string).trim()) {
        block.initial_date = entry.initial_date;
      }
      if (blockType === 'time' && entry.initial_time && (entry.initial_time as string).trim()) {
        block.initial_time = entry.initial_time;
      }

      if (blockType === 'file_input') {
        if (entry.filetypes && (entry.filetypes as string).trim()) {
          block.filetypes = (entry.filetypes as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (entry.max_files && (entry.max_files as number) > 0) block.max_files = entry.max_files;
      }

      blocks.push(block);
    }
    return blocks;
  }

  // JSON mode
  let rawBlocks: string;
  try { rawBlocks = ctx.getNodeParameter('formBlocks', itemIndex, '') as string; } catch { rawBlocks = ''; }
  // v1 compat: old parameter name was customFormJson
  if (!rawBlocks || !rawBlocks.trim()) {
    try { rawBlocks = ctx.getNodeParameter('customFormJson', itemIndex, '') as string; } catch { rawBlocks = ''; }
  }
  if (!rawBlocks || !rawBlocks.trim()) return [];

  let parsed: unknown;
  try { parsed = JSON.parse(rawBlocks); } catch {
    throw new NodeOperationError(ctx.getNode(),
      'The JSON is not valid. Paste an array of blocks or the full form JSON from the playground at https://dev.pachca.com/guides/forms/overview',
      { itemIndex },
    );
  }
  if (Array.isArray(parsed)) return parsed as IDataObject[];
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as IDataObject).blocks)) {
    return (parsed as IDataObject).blocks as IDataObject[];
  }
  throw new NodeOperationError(ctx.getNode(),
    'Expected a JSON array of blocks or a form object with a "blocks" array',
    { itemIndex },
  );
}

/**
 * Upload file to S3 using presigned params from POST /uploads.
 * Supports URL and binary data sources. Retries on S3 failure.
 */
export async function uploadFileToS3(
  ctx: IExecuteFunctions,
  itemIndex: number,
): Promise<IDataObject> {
  // Step 1: Get presigned S3 params
  const uploadParams = await makeApiRequest.call(ctx, 'POST', '/uploads', undefined, undefined, itemIndex);
  const presigned = uploadParams as IDataObject;

  const fileSource = ctx.getNodeParameter('fileSource', itemIndex, 'binary') as string;
  // V2 stores in additionalFields collection; V1 stores as top-level params
  const additional = ctx.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
  const userFileName = (additional.fileName ?? ctx.getNodeParameter('fileName', itemIndex, '')) as string;
  const userContentType = (additional.contentType ?? ctx.getNodeParameter('contentType', itemIndex, '')) as string;

  let fileBuffer: Buffer;
  let resolvedFileName: string;

  let binaryMimeType: string | undefined;
  if (fileSource === 'url') {
    const fileUrl = ctx.getNodeParameter('fileUrl', itemIndex, '') as string;
    fileBuffer = (await ctx.helpers.httpRequest({
      method: 'GET',
      url: fileUrl,
      encoding: 'arraybuffer',
    })) as Buffer;
    const rawName = fileUrl.split('/').pop()?.split('?')[0]?.split('#')[0] || 'file';
    resolvedFileName = userFileName || decodeURIComponent(rawName);
  } else {
    const binaryProperty = ctx.getNodeParameter('binaryProperty', itemIndex, 'data') as string;
    const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryProperty);
    fileBuffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
    resolvedFileName = userFileName || binaryData.fileName || 'file';
    binaryMimeType = binaryData.mimeType;
  }

  // Treat 'application/octet-stream' as unset (V1 default) — fall through to auto-detection
  const effectiveUserType = (userContentType && userContentType !== 'application/octet-stream') ? userContentType : '';
  const contentType = effectiveUserType || binaryMimeType || detectMimeType(resolvedFileName);

  // Step 2: Upload to S3 with retry
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const s3Fields: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': String(presigned['Content-Disposition']),
      acl: String(presigned.acl),
      policy: String(presigned.policy),
      'x-amz-credential': String(presigned['x-amz-credential']),
      'x-amz-algorithm': String(presigned['x-amz-algorithm']),
      'x-amz-date': String(presigned['x-amz-date']),
      'x-amz-signature': String(presigned['x-amz-signature']),
      key: String(presigned.key).replace('${filename}', () => resolvedFileName),
    };

    const multipart = buildMultipartBody(s3Fields, fileBuffer, resolvedFileName, contentType);

    try {
      await ctx.helpers.httpRequest({
        method: 'POST',
        url: String(presigned.direct_url),
        body: multipart.body,
        headers: { 'Content-Type': multipart.contentType },
        ignoreHttpStatusErrors: false,
      });
      break;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      // Re-request presigned URL on retry (it may have expired)
      const retryParams = await makeApiRequest.call(ctx, 'POST', '/uploads', undefined, undefined, itemIndex);
      Object.assign(presigned, retryParams);
    }
  }

  const fileKey = String(presigned.key).replace('${filename}', () => resolvedFileName);
  return {
    key: fileKey,
    file_name: resolvedFileName,
    content_type: contentType,
    size: fileBuffer.length,
  };
}

/**
 * Validate and split a comma-separated string into a typed array.
 * Throws NodeOperationError with descriptive message for invalid values.
 */
export function splitAndValidateCommaList(
  ctx: IExecuteFunctions,
  value: string,
  fieldName: string,
  type: 'int' | 'string',
  itemIndex: number,
): (number | string)[] {
  const arr = value.split(',').map(s => s.trim()).filter(Boolean);
  if (type === 'int') {
    const invalid = arr.filter(id => !Number.isInteger(Number(id)));
    if (invalid.length) {
      throw new NodeOperationError(ctx.getNode(),
        `${fieldName} must be numbers. Invalid values: ${invalid.join(', ')}`,
        { itemIndex },
      );
    }
    return arr.map(Number);
  }
  return arr;
}

// ============================================================================
// SHARED LIST-SEARCH & LOAD-OPTIONS METHODS (used by V2 node)
// ============================================================================

/** Format user name for display in resource locator dropdowns */
export function formatUserName(u: { first_name: string; last_name: string; nickname: string }): string {
  const fullName = [u.first_name, u.last_name]
    .filter((v) => v != null && v !== '' && v !== 'null')
    .join(' ');
  const display = fullName || u.nickname || 'User';
  return u.nickname ? `${display} (@${u.nickname})` : display;
}

/**
 * Search chats with cursor-based pagination.
 * When filtering — uses search endpoint (returns all matches).
 * When listing — fetches multiple pages up to 200 results.
 */
export async function searchChats(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: unknown,
): Promise<INodeListSearchResult> {
  const credentials = await this.getCredentials('pachcaApi');

  if (filter) {
    const url = `${credentials.baseUrl}/search/chats?query=${encodeURIComponent(filter)}`;
    const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
      method: 'GET',
      url,
    });
    const items = response.data ?? [];
    return {
      results: items.map((c: { id: number; name: string }) => ({
        name: c.name,
        value: c.id,
      })),
    };
  }

  // No filter — paginated listing
  const cursor = paginationToken as string | undefined;
  const qs = cursor ? `per=50&cursor=${cursor}` : 'per=50';
  const url = `${credentials.baseUrl}/chats?${qs}`;
  const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
    method: 'GET',
    url,
  });
  const items = response.data ?? [];
  const nextCursor = response.meta?.paginate?.next_page as string | undefined;
  return {
    results: items.map((c: { id: number; name: string }) => ({
      name: c.name,
      value: c.id,
    })),
    paginationToken: nextCursor,
  };
}

/** Search users by name/nickname */
export async function searchUsers(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const credentials = await this.getCredentials('pachcaApi');
  if (!filter) return { results: [] };
  const url = `${credentials.baseUrl}/search/users?query=${encodeURIComponent(filter)}`;
  const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
    method: 'GET',
    url,
  });
  const items = response.data ?? [];
  return {
    results: items.map((u: { id: number; first_name: string; last_name: string; nickname: string }) => ({
      name: formatUserName(u),
      value: u.id,
    })),
  };
}

/** Search entities — dispatches to chats or users based on entityType parameter */
export async function searchEntities(
  this: ILoadOptionsFunctions,
  filter?: string,
  paginationToken?: unknown,
): Promise<INodeListSearchResult> {
  let entityType = 'discussion';
  try {
    entityType = (this.getNodeParameter('entityType') as string) || 'discussion';
  } catch {
    try {
      entityType = (this.getCurrentNodeParameter('entityType') as string) || 'discussion';
    } catch { /* parameter may not exist yet */ }
  }

  if (entityType === 'user') {
    return searchUsers.call(this, filter);
  }
  if (entityType === 'thread') {
    return { results: [] };
  }
  return searchChats.call(this, filter, paginationToken);
}

/** Load custom properties for the current resource (User or Task) */
export async function getCustomProperties(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const credentials = await this.getCredentials('pachcaApi');
  const resource = this.getNodeParameter('resource') as string;
  const entityType = resource === 'task' ? 'Task' : 'User';
  const response = await this.helpers.httpRequestWithAuthentication.call(this, 'pachcaApi', {
    method: 'GET',
    url: `${credentials.baseUrl}/custom_properties?entity_type=${entityType}`,
  });
  const items = response.data ?? [];
  return items.map((p: { id: number; name: string }) => ({
    name: p.name,
    value: p.id,
  }));
}
