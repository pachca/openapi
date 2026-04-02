import type {
  ICredentialDataDecryptedObject,
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  INodeExecutionData,
  IN8nHttpFullResponse,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
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
  chat: ['id', 'name', 'channel', 'public', 'members_count', 'created_at'],
  user: ['id', 'first_name', 'last_name', 'nickname', 'email', 'role', 'suspended'],
  task: ['id', 'content', 'kind', 'status', 'priority', 'due_at', 'created_at'],
  bot: ['id', 'name', 'created_at'],
  groupTag: ['id', 'name', 'users_count'],
  reaction: ['id', 'code', 'user_id', 'created_at'],
  export: ['id', 'status', 'created_at'],
};

// ============================================================================
// FORM TEMPLATES
// ============================================================================

/**
 * Predefined form templates for the template builder mode.
 * Each template is an array of ViewBlock objects matching the Pachca forms API.
 */
export const FORM_TEMPLATES: Record<string, IDataObject[]> = {
  feedback: [
    { type: 'header', text: 'Обратная связь' },
    {
      type: 'input',
      name: 'feedback',
      label: 'Ваш отзыв',
      multiline: true,
      required: true,
      placeholder: 'Опишите ваш опыт...',
    },
    {
      type: 'select',
      name: 'rating',
      label: 'Оценка',
      required: true,
      options: [
        { text: '⭐ Отлично', value: '5' },
        { text: '👍 Хорошо', value: '4' },
        { text: '👌 Нормально', value: '3' },
        { text: '👎 Плохо', value: '2' },
        { text: '❌ Ужасно', value: '1' },
      ],
    },
  ],
  timeoff: [
    { type: 'header', text: 'Заявка на отпуск' },
    { type: 'date', name: 'date_start', label: 'Дата начала', required: true },
    { type: 'date', name: 'date_end', label: 'Дата окончания', required: true },
    {
      type: 'radio',
      name: 'accessibility',
      label: 'Доступность',
      options: [
        { text: 'Только телефон', value: 'phone_only' },
        { text: 'Телефон и мессенджер', value: 'phone_and_messenger' },
        { text: 'Недоступен', value: 'unavailable' },
      ],
    },
    {
      type: 'input',
      name: 'info',
      label: 'Комментарий',
      multiline: true,
      placeholder: 'Дополнительная информация...',
    },
    {
      type: 'file_input',
      name: 'documents',
      label: 'Документы',
      max_files: 5,
    },
  ],
  survey: [
    { type: 'header', text: 'Опрос' },
    {
      type: 'radio',
      name: 'satisfaction',
      label: 'Насколько вы довольны?',
      required: true,
      options: [
        { text: 'Полностью доволен', value: 'very_satisfied' },
        { text: 'Скорее доволен', value: 'satisfied' },
        { text: 'Скорее недоволен', value: 'dissatisfied' },
        { text: 'Совсем не доволен', value: 'very_dissatisfied' },
      ],
    },
    {
      type: 'checkbox',
      name: 'features',
      label: 'Какие функции вы используете?',
      options: [
        { text: 'Чаты', value: 'chats' },
        { text: 'Задачи', value: 'tasks' },
        { text: 'Боты', value: 'bots' },
        { text: 'Формы', value: 'forms' },
      ],
    },
    {
      type: 'input',
      name: 'suggestions',
      label: 'Предложения по улучшению',
      multiline: true,
    },
  ],
  bug_report: [
    { type: 'header', text: 'Отчёт об ошибке' },
    {
      type: 'input',
      name: 'title',
      label: 'Краткое описание',
      required: true,
      placeholder: 'Что произошло?',
    },
    {
      type: 'input',
      name: 'steps',
      label: 'Шаги воспроизведения',
      multiline: true,
      required: true,
      placeholder: '1. Открыть...\n2. Нажать...\n3. Увидеть ошибку',
    },
    {
      type: 'select',
      name: 'severity',
      label: 'Серьёзность',
      required: true,
      options: [
        { text: 'Критическая', value: 'critical' },
        { text: 'Высокая', value: 'high' },
        { text: 'Средняя', value: 'medium' },
        { text: 'Низкая', value: 'low' },
      ],
    },
    {
      type: 'file_input',
      name: 'screenshots',
      label: 'Скриншоты',
      filetypes: ['png', 'jpg', 'gif', 'webp'],
      max_files: 5,
    },
  ],
};

// v1 backward compat: old template keys → same blocks as v2 equivalents
FORM_TEMPLATES.timeoff_request = FORM_TEMPLATES.timeoff;
FORM_TEMPLATES.feedback_form = FORM_TEMPLATES.feedback;
FORM_TEMPLATES.survey_form = FORM_TEMPLATES.survey;
FORM_TEMPLATES.task_request = FORM_TEMPLATES.bug_report;
FORM_TEMPLATES.access_request = FORM_TEMPLATES.feedback;

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
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ============================================================================
// S3 FILE UPLOAD UTILITIES
// ============================================================================

/** Detect MIME type from file extension */
export function detectMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const MIME_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
  };
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
): { body: Buffer; contentType: string } {
  const boundary = `----WebKitFormBoundary${crypto.randomBytes(16).toString('hex')}`;
  const parts: Buffer[] = [];

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
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ),
  );
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

// ============================================================================
// BOT ID AUTO-DETECTION
// ============================================================================

/**
 * Resolve bot ID: use explicit credential value, or auto-detect via /oauth/token/info.
 * Returns the bot's user_id if the token belongs to a bot, or 0 if it's a personal token.
 */
export async function resolveBotId(
  context: IHookFunctions,
  credentials: ICredentialDataDecryptedObject,
): Promise<number> {
  if (credentials.botId && Number(credentials.botId) > 0) {
    return Number(credentials.botId);
  }
  try {
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
  } catch {
    return 0;
  }
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
  const options: IHttpRequestOptions = {
    method,
    url: `${credentials.baseUrl}${endpoint}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    qs,
    body,
    returnFullResponse: true,
  };

  const response = (await this.helpers.httpRequestWithAuthentication.call(
    this, 'pachcaApi', options,
  )) as IN8nHttpFullResponse;

  if (response.statusCode >= 400) {
    const resBody = response.body as IDataObject;
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

    throw new NodeApiError(this.getNode(), resBody as JsonObject, {
      message,
      httpCode: String(response.statusCode),
      description,
      itemIndex,
    });
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
  let retryCount = 0;
  const MAX_RETRIES = 5;

  do {
    const pageQs: IDataObject = { ...qs, limit: 50 };
    if (cursor) pageQs.cursor = cursor;

    let response: IDataObject;
    try {
      response = await makeApiRequest.call(this, method, endpoint, undefined, pageQs, itemIndex);
      retryCount = 0;
    } catch (error: unknown) {
      const err = error as { httpCode?: string; response?: { headers?: Record<string, string> } };
      if (err.httpCode === '429' && retryCount < MAX_RETRIES) {
        retryCount++;
        const retryAfter = parseInt(err.response?.headers?.['retry-after'] ?? '1', 10);
        // eslint-disable-next-line @n8n/community-nodes/no-restricted-globals
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw error;
    }

    const items = (response.data as IDataObject[]) ?? [];
    results.push(...items);
    const meta = response.meta as IDataObject | undefined;
    const paginate = meta?.paginate as IDataObject | undefined;
    cursor = (paginate?.next_page as string) ?? undefined;
  } while (cursor && (returnAll || results.length < limit));

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

  return finalResults.map(item => ({ json: item }));
}

/** Simplify a single item by keeping only key fields for the resource */
export function simplifyItem(item: IDataObject, resource: string): IDataObject {
  const keyFields = SIMPLIFY_FIELDS[resource];
  if (!keyFields) return item;
  return Object.fromEntries(Object.entries(item).filter(([k]) => keyFields.includes(k)));
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
    return (value as IDataObject).value as number | string;
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
 * Resolve form blocks from builder mode, template, or JSON input.
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

  if (builderMode === 'template') {
    let templateName: string;
    try { templateName = ctx.getNodeParameter('formTemplate', itemIndex, '') as string; } catch { return []; }
    return FORM_TEMPLATES[templateName] ?? [];
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

  if (fileSource === 'url') {
    const fileUrl = ctx.getNodeParameter('fileUrl', itemIndex, '') as string;
    fileBuffer = (await ctx.helpers.httpRequest({
      method: 'GET',
      url: fileUrl,
      encoding: 'arraybuffer',
    })) as Buffer;
    resolvedFileName = userFileName || fileUrl.split('/').pop()?.split('?')[0] || 'file';
  } else {
    const binaryProperty = ctx.getNodeParameter('binaryProperty', itemIndex, 'data') as string;
    const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryProperty);
    fileBuffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryProperty);
    resolvedFileName = userFileName || binaryData.fileName || 'file';
  }

  const contentType = userContentType || detectMimeType(resolvedFileName);

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
      key: String(presigned.key).replace('${filename}', resolvedFileName),
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

  const fileKey = String(presigned.key).replace('${filename}', resolvedFileName);
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
    const invalid = arr.filter(id => isNaN(Number(id)));
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
