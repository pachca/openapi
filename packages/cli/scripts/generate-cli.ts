/**
 * CLI Command Generator
 *
 * Reads openapi.yaml and generates oclif commands in src/commands/*\/*.ts.
 * Also generates src/data/workflows.json, src/data/alternatives.json, and README.md.
 *
 * Usage: tsx scripts/generate-cli.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  type Schema, type Parameter, type RequestBody, type Response, type Endpoint,
  parseOpenAPI, resolveAllOf, getSchemaType,
} from './openapi-parser.js';

export { type Schema, type Parameter, type RequestBody, type Response, type Endpoint, parseOpenAPI };

// ----- Configuration -----

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const CLI_SRC = path.join(ROOT, 'packages', 'cli', 'src');
const COMMANDS_DIR = path.join(CLI_SRC, 'commands');
const DATA_DIR = path.join(CLI_SRC, 'data');

// URL generation — single source of truth from apps/docs/lib/openapi/mapper.ts
import { generateUrlFromOperation } from '../../../apps/docs/lib/openapi/mapper.js';

// Entity ID → related list command (for agent hints in descriptions)
const ENTITY_HINTS: Record<string, string> = {
  chats: 'pachca chats list',
  users: 'pachca users list',
  tags: 'pachca tags list',
  tasks: 'pachca tasks list',
  messages: 'pachca messages list',
  bots: 'pachca bots list',
};

// ----- Code Generation -----

interface GeneratedCommand {
  section: string;
  action: string;
  filename: string;
  code: string;
  summary: string;
}

function generateCommand(endpoint: Endpoint, examples?: string[]): GeneratedCommand {
  const url = generateUrlFromOperation(endpoint).replace(/^\/api\//, '/');
  const [, section, action] = url.split('/');
  const filename = `${action}.ts`;
  const className = toPascalCase(section) + toPascalCase(action);
  const summary = endpoint.summary || endpoint.description?.split('\n')[0] || '';

  // Determine path params → positional args
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');

  // Determine body fields (from requestBody)
  const bodyFields = extractBodyFields(endpoint.requestBody);

  // Determine if this endpoint supports pagination (from x-paginated)
  const hasPagination = !!endpoint.paginated;
  const isList = hasPagination;

  // Determine if this is a redirect command
  const isRedirect = !!endpoint.responses['302'];

  // Determine if this is a DELETE command
  const isDelete = endpoint.method === 'DELETE';

  // Determine if this is a binary upload
  const hasBinaryField = bodyFields.some((f) => f.format === 'binary');

  // Determine if auth is required
  const requiresAuth = endpoint.requirements?.auth !== false &&
    !(endpoint.security && Array.isArray(endpoint.security) && endpoint.security.length === 0);

  // Determine scope and plan
  const scope = endpoint.requirements?.scope || null;
  const plan = endpoint.requirements?.plan || null;

  // Build defaultColumns for response
  const defaultColumns = computeDefaultColumns(endpoint);

  // Check if endpoint has a content/text field for stdin support
  const stdinField = bodyFields.find(
    (f) => ['content', 'description', 'text', 'status_text'].includes(f.name) && f.type === 'string',
  );

  // Generate code
  const code = generateCommandCode({
    className,
    section,
    action,
    endpoint,
    pathParams,
    queryParams,
    bodyFields,
    isList,
    hasPagination,
    isRedirect,
    isDelete,
    hasBinaryField,
    requiresAuth,
    scope,
    plan,
    summary,
    defaultColumns,
    stdinField,
    examples,
  });

  return { section, action, filename, code, summary };
}

export interface BodyField {
  name: string;
  type: string;
  format?: string;
  required: boolean;
  description?: string;
  enum?: unknown[];
  maxLength?: number;
  maximum?: number;
  minimum?: number;
  isSibling?: boolean;
}

/** Wire names for multipart/form-data fields that differ from schema property names */
export const MULTIPART_WIRE_NAMES: Record<string, string> = {
  contentDisposition: 'Content-Disposition',
  xAmzCredential: 'x-amz-credential',
  xAmzAlgorithm: 'x-amz-algorithm',
  xAmzDate: 'x-amz-date',
  xAmzSignature: 'x-amz-signature',
};

/** Convert camelCase/snake_case to kebab-case for flag names */
export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

export function extractBodyFields(requestBody?: RequestBody): BodyField[] {
  if (!requestBody) return [];

  const jsonContent = requestBody.content['application/json'];
  const multipartContent = requestBody.content['multipart/form-data'];
  const content = jsonContent || multipartContent;
  if (!content) return [];

  const schema = content.schema;
  if (!schema) return [];

  // Unwrap wrapper object (e.g., { message: { chat_id, content } })
  const resolved = resolveAllOf(schema);
  const properties = resolved.properties || {};
  const requiredFields = new Set(resolved.required || []);

  // Check if top-level has exactly one object property that can be unwrapped
  const topKeys = Object.keys(properties);
  const objectKeys = topKeys.filter((k) => {
    const inner = resolveAllOf(properties[k]);
    return inner.properties && Object.keys(inner.properties).length > 0;
  });

  if (objectKeys.length === 1) {
    const wrapperKey = objectKeys[0];
    const wrapper = properties[wrapperKey];
    const innerResolved = resolveAllOf(wrapper);
    if (innerResolved.properties) {
      const innerRequired = new Set(innerResolved.required || []);
      const fields: BodyField[] = Object.entries(innerResolved.properties)
        .filter(([, v]) => !v.readOnly)
        .map(([name, propSchema]) => ({
          name,
          type: getSchemaType(propSchema),
          format: propSchema.format,
          required: innerRequired.has(name),
          description: propSchema.description,
          enum: propSchema.enum,
          maxLength: propSchema.maxLength,
          maximum: propSchema.maximum,
          minimum: propSchema.minimum,
        }));

      // Add sibling scalar fields (non-object top-level properties)
      for (const key of topKeys) {
        if (key === wrapperKey) continue;
        const propSchema = resolveAllOf(properties[key]);
        fields.push({
          name: key,
          type: getSchemaType(propSchema),
          format: propSchema.format,
          required: requiredFields.has(key),
          description: propSchema.description,
          enum: propSchema.enum,
          maxLength: propSchema.maxLength,
          maximum: propSchema.maximum,
          minimum: propSchema.minimum,
          isSibling: true,
        });
      }

      return fields;
    }
  }

  // Flat properties
  return Object.entries(properties)
    .filter(([, v]) => !v.readOnly)
    .map(([name, propSchema]) => ({
      name,
      type: getSchemaType(propSchema),
      format: propSchema.format,
      required: requiredFields.has(name),
      description: propSchema.description,
      enum: propSchema.enum,
      maxLength: propSchema.maxLength,
      maximum: propSchema.maximum,
      minimum: propSchema.minimum,
    }));
}

// resolveAllOf and getSchemaType imported from ./openapi-parser.js

function computeDefaultColumns(endpoint: Endpoint): string[] {
  // Find response schema properties
  const okResponse = endpoint.responses['200'] || endpoint.responses['201'];
  if (!okResponse?.content?.['application/json']) return [];

  const schema = okResponse.content['application/json'].schema;
  const resolved = resolveAllOf(schema);

  // Unwrap { data: T } or { data: T[] }
  let itemSchema = resolved;
  if (resolved.properties?.data) {
    const dataSchema = resolveAllOf(resolved.properties.data);
    if (dataSchema.type === 'array' && dataSchema.items) {
      itemSchema = resolveAllOf(dataSchema.items);
    } else if (dataSchema.properties) {
      itemSchema = dataSchema;
    }
  }

  if (!itemSchema.properties) return [];

  // Select non-nullable scalar fields (string, integer, boolean, datetime)
  // Always include id and name/title; take up to 5
  const scalars: string[] = [];
  const priority = ['id', 'name', 'title', 'first_name', 'last_name', 'email', 'role', 'content', 'created_at'];

  for (const key of priority) {
    if (itemSchema.properties[key]) scalars.push(key);
  }

  for (const [key, prop] of Object.entries(itemSchema.properties)) {
    if (scalars.includes(key)) continue;
    const t = getSchemaType(prop);
    if (['string', 'integer', 'number', 'boolean'].includes(t) && !prop.readOnly) {
      scalars.push(key);
    }
    if (scalars.length >= 5) break;
  }

  return scalars.slice(0, 5);
}

interface CommandGenParams {
  className: string;
  section: string;
  action: string;
  endpoint: Endpoint;
  pathParams: Parameter[];
  queryParams: Parameter[];
  bodyFields: BodyField[];
  isList: boolean;
  hasPagination: boolean;
  isRedirect: boolean;
  isDelete: boolean;
  hasBinaryField: boolean;
  requiresAuth: boolean;
  scope: string | null;
  plan: string | null;
  summary: string;
  defaultColumns: string[];
  stdinField?: BodyField;
  examples?: string[];
}

function generateCommandCode(p: CommandGenParams): string {
  // Collect required flags for interactive prompting
  const requiredQueryFlags: { flagName: string; description: string; type: string }[] = [];
  for (const param of p.queryParams) {
    if (p.hasPagination && (param.name === 'cursor' || param.name === 'limit')) continue;
    if (param['x-param-names']) continue;
    if (param.required) {
      requiredQueryFlags.push({
        flagName: toKebabCase(param.name),
        description: param.description || param.name,
        type: getOclifFlagType(param.schema),
      });
    }
  }
  const requiredBodyFlags: { flagName: string; description: string; type: string }[] = [];
  for (const field of p.bodyFields) {
    if (p.hasBinaryField && field.format === 'binary') continue;
    if (field.required) {
      requiredBodyFlags.push({
        flagName: toKebabCase(field.name),
        description: field.description || field.name,
        type: getOclifFlagType({ type: field.type, enum: field.enum } as Schema),
      });
    }
  }
  const allRequiredFlags = [...requiredQueryFlags, ...requiredBodyFlags];
  const hasRequiredFlags = allRequiredFlags.length > 0;

  const imports: string[] = [
    `import { Args, Flags } from '@oclif/core';`,
    `import { BaseCommand } from '../../base-command.js';`,
  ];

  if (p.isDelete || hasRequiredFlags) {
    imports.push(`import * as clack from '@clack/prompts';`);
  }
  if (p.hasBinaryField) {
    imports.push(`import * as fs from 'node:fs';`);
    imports.push(`import * as path from 'node:path';`);
  }
  if (p.isRedirect) {
    imports.push(`import { downloadFile } from '../../client.js';`);
    imports.push(`import { formatSize } from '../../utils.js';`);
  }
  // Build args
  const argsCode = p.pathParams.map((param) => {
    const argName = param.name.replace(/[{}]/g, '');
    let desc = param.description || 'ID';
    // Add related list command hint for ID args
    if (argName === 'id') {
      const relatedCmd = ENTITY_HINTS[p.section];
      if (relatedCmd) desc += ` (${relatedCmd})`;
    } else if (argName.endsWith('_id')) {
      const entityKey = argName.replace(/_id$/, '') + 's';
      if (ENTITY_HINTS[entityKey]) desc += ` (${ENTITY_HINTS[entityKey]})`;
    }
    return `    ${argName}: Args.${getOclifArgType(param.schema)}({
      description: ${JSON.stringify(desc)},
      required: true,
    }),`;
  });

  // For list commands with a single required ID query param, add it as an optional positional arg
  // e.g., `pachca messages list 36988817` as a shortcut for `--chat-id=36988817`
  let shortcutArg: { paramName: string; flagName: string; argType: string } | null = null;
  if (p.isList && requiredQueryFlags.length === 1 && requiredQueryFlags[0].flagName.endsWith('-id')) {
    const param = p.queryParams.find((q) => q.required && toKebabCase(q.name) === requiredQueryFlags[0].flagName);
    if (param) {
      shortcutArg = {
        paramName: param.name,
        flagName: requiredQueryFlags[0].flagName,
        argType: getOclifArgType(param.schema),
      };
      argsCode.push(`    ${param.name}: Args.${shortcutArg.argType}({
      description: ${JSON.stringify(param.description || param.name)},
      required: false,
    }),`);
    }
  }

  // Build flags for query params
  const queryFlagLines: string[] = [];
  for (const param of p.queryParams) {
    // Skip native cursor/limit — replaced by CLI pagination flags
    if (p.hasPagination && (param.name === 'cursor' || param.name === 'limit')) continue;

    // Handle x-param-names (composite params like sort[{field}])
    if (param['x-param-names']) {
      const subs = param['x-param-names'] as { name: string; description?: string }[];
      const fields = subs.map((s) => {
        const field = s.name.replace(/.*\[/, '').replace(']', '');
        return { field, kebab: toKebabCase(field), description: s.description || field };
      });
      const sortOptions = fields.map((f) => f.kebab);
      const sortDescParts = fields.map((f) => `${f.kebab} — ${f.description.toLowerCase()}`);
      const enumValues = param.schema?.enum || (param.schema?.allOf?.[0] as Schema | undefined)?.enum || [];
      queryFlagLines.push(`    sort: Flags.string({
      description: ${JSON.stringify(`Поле сортировки (${sortDescParts.join(', ')})`)},
      options: ${JSON.stringify(sortOptions)},
    }),`);
      queryFlagLines.push(`    order: Flags.string({
      description: "Порядок сортировки",
      options: ${JSON.stringify(enumValues.length > 0 ? enumValues : ['asc', 'desc'])},
    }),`);
      continue;
    }

    const flagName = toKebabCase(param.name);
    // Resolve allOf to get enum/type/default from $ref schemas (e.g., SortOrder, ChatSortField)
    const resolvedParamSchema = resolveAllOf(param.schema);
    const flagType = getOclifFlagType(resolvedParamSchema);
    const extras: string[] = [];
    if (resolvedParamSchema.enum) extras.push(`      options: ${JSON.stringify(resolvedParamSchema.enum)},`);
    if (resolvedParamSchema.default !== undefined) extras.push(`      default: ${JSON.stringify(resolvedParamSchema.default)},`);
    if (flagType === 'boolean') extras.push(`      allowNo: true,`);
    const extrasStr = extras.length > 0 ? '\n' + extras.join('\n') : '';
    const arrayHint = resolvedParamSchema.type === 'array' ? ' (через запятую)' : '';
    queryFlagLines.push(`    '${flagName}': Flags.${flagType}({
      description: ${JSON.stringify(param.description || param.name)}${arrayHint ? ` + ${JSON.stringify(arrayHint)}` : ''},${extrasStr}
    }),`);
  }

  // Add pagination flags for list commands
  if (p.hasPagination) {
    queryFlagLines.push(`    limit: Flags.integer({
      description: 'Количество результатов на страницу',
    }),`);
    queryFlagLines.push(`    cursor: Flags.string({
      description: 'Курсор для следующей страницы',
    }),`);
    queryFlagLines.push(`    all: Flags.boolean({
      description: 'Загрузить все страницы автоматически',
      default: false,
    }),`);
  }

  // Add external URL flag for endpoints that send requests to a dynamic URL
  if (p.endpoint.externalUrl) {
    const externalFlagName = toKebabCase(p.endpoint.externalUrl);
    queryFlagLines.push(`    '${externalFlagName}': Flags.string({
      description: 'URL для отправки запроса (получается из ответа POST /uploads)',
      required: true,
    }),`);
  }

  // Build flags for body fields
  const bodyFlagLines: string[] = [];
  for (const field of p.bodyFields) {
    if (p.hasBinaryField && field.format === 'binary') {
      bodyFlagLines.push(`    file: Flags.string({
      description: ${JSON.stringify(field.description || 'File path')},
    }),`);
      continue;
    }

    const flagName = toKebabCase(field.name);
    const flagType = getOclifFlagType({ type: field.type, enum: field.enum } as Schema);
    const maxLenComment = field.maxLength ? ` (макс. ${field.maxLength} символов)` : '';
    // Add related command hint for entity ID fields
    let entityHint = '';
    if (field.name === 'entity_id') {
      // Polymorphic: can reference chats or users
      entityHint = ` (${ENTITY_HINTS['chats']} | ${ENTITY_HINTS['users']})`;
    } else if (field.name.endsWith('_id') || field.name.endsWith('Id')) {
      const entityKey = field.name.replace(/_id$|Id$/, '').replace(/_/g, '');
      // Try to match plural form
      const plural = entityKey + 's';
      if (ENTITY_HINTS[plural]) {
        entityHint = ` (${ENTITY_HINTS[plural]})`;
      }
    }
    const bodyExtras: string[] = [];
    if (field.enum) bodyExtras.push(`      options: ${JSON.stringify(field.enum)},`);
    if (flagType === 'boolean') bodyExtras.push(`      allowNo: true,`);
    const bodyExtrasStr = bodyExtras.length > 0 ? '\n' + bodyExtras.join('\n') : '';
    bodyFlagLines.push(`    '${flagName}': Flags.${flagType}({
      description: ${JSON.stringify((field.description || field.name) + maxLenComment + entityHint)},${bodyExtrasStr}
    }),`);
  }

  // Add --force for DELETE commands
  if (p.isDelete) {
    bodyFlagLines.push(`    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),`);
  }

  // Add --save for redirect commands
  if (p.isRedirect) {
    bodyFlagLines.push(`    save: Flags.string({
      description: 'Путь для сохранения файла',
    }),`);
  }

  // Build run() body
  const runBodyLines: string[] = [];

  // Parse args and flags
  runBodyLines.push(`    const { args, flags } = await this.parse(${p.className});`);
  runBodyLines.push(`    this.parsedFlags = flags;`);

  // Populate flag from positional arg shortcut (e.g., `messages list 123` → --chat-id=123)
  if (shortcutArg) {
    runBodyLines.push('');
    runBodyLines.push(`    if (args.${shortcutArg.paramName} !== undefined && (flags as Record<string, unknown>)['${shortcutArg.flagName}'] === undefined) {`);
    runBodyLines.push(`      (flags as Record<string, unknown>)['${shortcutArg.flagName}'] = args.${shortcutArg.paramName};`);
    runBodyLines.push(`    }`);
  }

  // Stdin support for text fields
  if (p.stdinField) {
    const flagName = toKebabCase(p.stdinField.name);
    runBodyLines.push('');
    runBodyLines.push(`    // Read from stdin if --${flagName} not provided and stdin is not TTY`);
    runBodyLines.push(`    if (!flags['${flagName}'] && !process.stdin.isTTY) {`);
    runBodyLines.push(`      const chunks: Buffer[] = [];`);
    runBodyLines.push(`      for await (const chunk of process.stdin) {`);
    runBodyLines.push(`        chunks.push(chunk as Buffer);`);
    runBodyLines.push(`      }`);
    runBodyLines.push(`      flags['${flagName}'] = Buffer.concat(chunks).toString('utf-8').trimEnd();`);
    runBodyLines.push(`    }`);
  }

  // Interactive prompts for missing required flags
  if (hasRequiredFlags) {
    runBodyLines.push('');
    // Build list of required flags to check
    const flagChecks = allRequiredFlags.map((f) => `      { flag: '${f.flagName}', label: ${JSON.stringify(f.description)}, type: '${f.type}' },`);
    runBodyLines.push(`    const missingRequired: { flag: string; label: string; type: string }[] = [`);
    runBodyLines.push(...flagChecks);
    runBodyLines.push(`    ].filter((f) => (flags as Record<string, unknown>)[f.flag] === undefined || (flags as Record<string, unknown>)[f.flag] === null);`);
    runBodyLines.push('');
    runBodyLines.push(`    if (missingRequired.length > 0) {`);
    runBodyLines.push(`      if (this.isInteractive()) {`);
    runBodyLines.push(`        for (const field of missingRequired) {`);
    runBodyLines.push(`          const value = await clack.text({ message: field.label, validate: (v) => v.length === 0 ? 'Обязательное поле' : undefined });`);
    runBodyLines.push(`          if (clack.isCancel(value)) { process.stderr.write('Отменено.\\n'); this.exit(0); }`);
    runBodyLines.push(`          if (field.type === 'integer') { (flags as Record<string, unknown>)[field.flag] = Number.parseInt(value, 10); }`);
    runBodyLines.push(`          else if (field.type === 'boolean') { (flags as Record<string, unknown>)[field.flag] = value === 'true'; }`);
    runBodyLines.push(`          else { (flags as Record<string, unknown>)[field.flag] = value; }`);
    runBodyLines.push(`        }`);
    runBodyLines.push(`      } else {`);
    const requiredFlagsList = allRequiredFlags
      .map((f) => `--${f.flagName} <${f.type}>`)
      .join(', ');
    const hintStr = `Обязательные: ${requiredFlagsList}. pachca introspect ${p.section} ${p.action}`;
    runBodyLines.push(`        this.validationError(`);
    runBodyLines.push(`          missingRequired.map((f) => ({ message: \`Обязательный флаг --\${f.flag} не передан\`, flag: f.flag })),`);
    runBodyLines.push(`          { hint: ${JSON.stringify(hintStr)} },`);
    runBodyLines.push(`        );`);
    runBodyLines.push(`      }`);
    runBodyLines.push(`    }`);
  }

  // Validation (batched)
  const validations: string[] = [];
  for (const field of p.bodyFields) {
    const flagName = toKebabCase(field.name);
    if (field.maxLength) {
      validations.push(`    if (flags['${flagName}'] && String(flags['${flagName}']).length > ${field.maxLength}) {
      validationErrors.push({ message: \`--${flagName}: максимум ${field.maxLength} символов (передано: \${String(flags['${flagName}']).length})\`, flag: '${flagName}' });
    }`);
    }
    if (field.enum) {
      validations.push(`    if (flags['${flagName}'] && !${JSON.stringify(field.enum)}.includes(flags['${flagName}'])) {
      validationErrors.push({ message: \`--${flagName}: допустимые значения — ${field.enum.map((e) => `"${e}"`).join(', ')}\`, flag: '${flagName}' });
    }`);
    }
  }
  if (validations.length > 0) {
    runBodyLines.push('');
    runBodyLines.push(`    const validationErrors: { message: string; flag: string }[] = [];`);
    runBodyLines.push(...validations);
    runBodyLines.push(`    if (validationErrors.length > 0) {`);
    runBodyLines.push(`      this.validationError(validationErrors);`);
    runBodyLines.push(`    }`);
  }

  // DELETE confirmation
  if (p.isDelete) {
    runBodyLines.push('');
    runBodyLines.push(`    if (!flags.force) {`);
    runBodyLines.push(`      if (!this.isInteractive()) {`);
    const deleteArgs = p.pathParams.map((pp) => `<${pp.name}>`).join(' ');
    const deleteHint = `pachca ${p.section} ${p.action} ${deleteArgs} --force`;
    runBodyLines.push(`        this.validationError(`);
    runBodyLines.push(`          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],`);
    runBodyLines.push(`          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: ${JSON.stringify(deleteHint)} },`);
    runBodyLines.push(`        );`);
    runBodyLines.push(`      }`);
    runBodyLines.push(`      const confirm = await clack.confirm({ message: 'Вы уверены?' });`);
    runBodyLines.push(`      if (clack.isCancel(confirm) || !confirm) {`);
    runBodyLines.push(`        process.stderr.write('Отменено.\\n');`);
    runBodyLines.push(`        this.exit(0);`);
    runBodyLines.push(`      }`);
    runBodyLines.push(`    }`);
  }

  // Build request path with path params
  let apiPath = `'${p.endpoint.path}'`;
  if (p.endpoint.externalUrl) {
    // External URL endpoints use a dynamic URL from a flag instead of base URL + path
    const externalFlagName = toKebabCase(p.endpoint.externalUrl);
    apiPath = `flags['${externalFlagName}']!`;
  } else if (p.pathParams.length > 0) {
    apiPath = '`' + p.endpoint.path.replace(/\{(\w+)\}/g, '${args.$1}') + '`';
  }

  // Build query object
  const queryEntries: string[] = [];
  for (const param of p.queryParams) {
    if (p.hasPagination && (param.name === 'cursor' || param.name === 'limit')) continue;
    if (param['x-param-names']) {
      // Map --sort <field> --order <dir> → sort[<field>]=<dir>
      queryEntries.push(`      ...(flags.sort ? { [\`sort[\${flags.sort.replace(/-/g, '_')}]\`]: flags.order || 'desc' } : {}),`);
      continue;
    }
    const flagName = toKebabCase(param.name);
    const isArrayParam = param.schema.type === 'array';
    const flagRef = flagName !== param.name ? `flags['${flagName}']` : `flags['${param.name}']`;
    const value = isArrayParam ? `${flagRef}?.split(',')` : flagRef;
    const key = flagName !== param.name ? `'${param.name}'` : param.name;
    queryEntries.push(`      ${key}: ${value},`);
  }
  if (p.hasPagination) {
    queryEntries.push(`      limit: flags.limit,`);
    queryEntries.push(`      cursor: flags.cursor,`);
  }

  // Build request body object
  const wrapperEntries: string[] = [];
  const siblingEntries: string[] = [];
  const jsonContent = p.endpoint.requestBody?.content['application/json'];
  const wrapperKey = jsonContent ? getWrapperKey(jsonContent.schema) : null;

  for (const field of p.bodyFields) {
    if (field.format === 'binary') continue;
    const flagName = toKebabCase(field.name);
    let entry: string;
    // Parse JSON array/object flags
    if (field.type === 'array' || field.type === 'object') {
      entry = `      ${field.name}: flags['${flagName}'] ? this.parseJSON(flags['${flagName}'], '${flagName}') : undefined,`;
    } else {
      entry = `      ${field.name}: flags['${flagName}'],`;
    }

    if (wrapperKey && field.isSibling) {
      siblingEntries.push(entry);
    } else {
      wrapperEntries.push(entry);
    }
  }

  // Handle pagination (--all)
  if (p.hasPagination) {
    runBodyLines.push('');
    runBodyLines.push(`    if (flags.all) {`);
    runBodyLines.push(`      // Auto-pagination`);
    runBodyLines.push(`      const allData: unknown[] = [];`);
    runBodyLines.push(`      let nextCursor: string | undefined = undefined;`);
    runBodyLines.push(`      let pages = 0;`);
    runBodyLines.push(`      const seenCursors = new Set<string>();`);
    runBodyLines.push('');
    runBodyLines.push(`      while (pages < 500) {`);
    runBodyLines.push(`        const query: Record<string, string | number | boolean | string[] | undefined> = {`);
    for (const entry of queryEntries) {
      if (!entry.includes('cursor:')) runBodyLines.push(`  ${entry}`);
    }
    runBodyLines.push(`          cursor: nextCursor,`);
    runBodyLines.push(`        };`);
    runBodyLines.push(`        const response = await this.apiRequest({ method: '${p.endpoint.method}', path: ${apiPath}, query });`);
    runBodyLines.push(`        const body = response.data as Record<string, unknown>;`);
    runBodyLines.push(`        const items = body.data as unknown[];`);
    runBodyLines.push(`        if (items) allData.push(...items);`);
    runBodyLines.push(`        if (!items || items.length === 0) break;`);
    runBodyLines.push(`        const meta = body.meta as Record<string, unknown> | undefined;`);
    runBodyLines.push(`        const paginate = meta?.paginate as Record<string, unknown> | undefined;`);
    runBodyLines.push(`        nextCursor = paginate?.next_page as string | undefined;`);
    runBodyLines.push(`        pages++;`);
    runBodyLines.push('');
    runBodyLines.push(`        if (process.stderr.isTTY) {`);
    runBodyLines.push(`          const total = (paginate as Record<string, unknown> | undefined)?.total;`);
    runBodyLines.push(`          const progress = total ? \`\${allData.length} / \${total}\` : String(allData.length);`);
    runBodyLines.push(`          process.stderr.write(\`\\r  Загружено: \${progress}...\`);`);
    runBodyLines.push(`        }`);
    runBodyLines.push('');
    runBodyLines.push(`        if (!nextCursor) break;`);
    runBodyLines.push(`        if (seenCursors.has(nextCursor)) {`);
    runBodyLines.push(`          process.stderr.write('\\n⚠ Обнаружен цикл пагинации, остановка.\\n');`);
    runBodyLines.push(`          break;`);
    runBodyLines.push(`        }`);
    runBodyLines.push(`        seenCursors.add(nextCursor);`);
    runBodyLines.push(`      }`);
    runBodyLines.push('');
    runBodyLines.push(`      if (pages >= 500) {`);
    runBodyLines.push(`        process.stderr.write('\\n⚠ Достигнут лимит 500 страниц.\\n');`);
    runBodyLines.push(`      }`);
    runBodyLines.push(`      if (process.stderr.isTTY) process.stderr.write('\\n');`);
    runBodyLines.push(`      this.output(allData);`);
    runBodyLines.push(`      return;`);
    runBodyLines.push(`    }`);
  }

  // Build the request
  runBodyLines.push('');

  if (p.hasBinaryField) {
    // Multipart upload
    const binaryField = p.bodyFields.find((f) => f.format === 'binary');
    runBodyLines.push(`    let formData: FormData | undefined;`);
    runBodyLines.push(`    if (flags.file) {`);
    runBodyLines.push(`      formData = new FormData();`);
    runBodyLines.push(`      if (flags.file === '-') {`);
    runBodyLines.push(`        const chunks: Buffer[] = [];`);
    runBodyLines.push(`        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);`);
    runBodyLines.push(`        const blob = new Blob([Buffer.concat(chunks)]);`);
    runBodyLines.push(`        formData.append('${binaryField?.name || 'file'}', blob, 'stdin');`);
    runBodyLines.push(`      } else {`);
    runBodyLines.push(`        const blob = new Blob([fs.readFileSync(flags.file)]);`);
    runBodyLines.push(`        formData.append('${binaryField?.name || 'file'}', blob, path.basename(flags.file));`);
    runBodyLines.push(`      }`);
    // Add other fields to FormData
    for (const field of p.bodyFields) {
      if (field.format === 'binary') continue;
      const flagName = toKebabCase(field.name);
      const wireName = MULTIPART_WIRE_NAMES[field.name] || field.name;
      runBodyLines.push(`      if (flags['${flagName}']) formData.append('${wireName}', String(flags['${flagName}']));`);
    }
    runBodyLines.push(`    }`);
    runBodyLines.push('');
    runBodyLines.push(`    const { data } = await this.apiRequest({`);
    runBodyLines.push(`      method: '${p.endpoint.method}',`);
    runBodyLines.push(`      path: ${apiPath},`);
    if (queryEntries.length > 0) {
      runBodyLines.push(`      query: {`);
      runBodyLines.push(...queryEntries);
      runBodyLines.push(`      },`);
    }
    runBodyLines.push(`      formData,`);
    if (p.endpoint.externalUrl) {
      runBodyLines.push(`      noAuth: true,`);
    }
    runBodyLines.push(`    });`);
  } else if (wrapperEntries.length > 0 || siblingEntries.length > 0) {
    let bodyObj: string;
    if (wrapperKey) {
      if (siblingEntries.length > 0) {
        bodyObj = `{\n      ${wrapperKey}: {\n${wrapperEntries.join('\n')}\n      },\n${siblingEntries.join('\n')}\n    }`;
      } else {
        bodyObj = `{ ${wrapperKey}: {\n${wrapperEntries.join('\n')}\n    } }`;
      }
    } else {
      bodyObj = `{\n${wrapperEntries.join('\n')}\n    }`;
    }

    // Clean undefined fields
    runBodyLines.push(`    const body: Record<string, unknown> = ${bodyObj};`);
    runBodyLines.push(`    // Clean undefined fields`);
    if (wrapperKey) {
      runBodyLines.push(`    const inner = body['${wrapperKey}'] as Record<string, unknown>;`);
      runBodyLines.push(`    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }`);
      if (siblingEntries.length > 0) {
        runBodyLines.push(`    for (const [k, v] of Object.entries(body)) { if (k !== '${wrapperKey}' && v === undefined) delete body[k]; }`);
      }
    } else {
      runBodyLines.push(`    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }`);
    }

    // Empty body warning for update commands
    if (p.endpoint.method === 'PUT' || p.endpoint.method === 'PATCH') {
      runBodyLines.push('');
      if (wrapperKey) {
        runBodyLines.push(`    if (Object.keys(inner).length === 0) {`);
      } else {
        runBodyLines.push(`    if (Object.keys(body).length === 0) {`);
      }
      runBodyLines.push(`      this.validationError(`);
      runBodyLines.push(`        [{ message: 'Не указаны поля для обновления' }],`);
      runBodyLines.push(`        { type: 'PACHCA_USAGE_ERROR' },`);
      runBodyLines.push(`      );`);
      runBodyLines.push(`    }`);
    }

    runBodyLines.push('');
    runBodyLines.push(`    const { data } = await this.apiRequest({`);
    runBodyLines.push(`      method: '${p.endpoint.method}',`);
    runBodyLines.push(`      path: ${apiPath},`);
    runBodyLines.push(`      body,`);
    if (queryEntries.length > 0) {
      runBodyLines.push(`      query: {`);
      runBodyLines.push(...queryEntries);
      runBodyLines.push(`      },`);
    }
    runBodyLines.push(`    });`);
  } else {
    runBodyLines.push(`    const { data } = await this.apiRequest({`);
    runBodyLines.push(`      method: '${p.endpoint.method}',`);
    runBodyLines.push(`      path: ${apiPath},`);
    if (queryEntries.length > 0) {
      runBodyLines.push(`      query: {`);
      runBodyLines.push(...queryEntries);
      runBodyLines.push(`      },`);
    }
    if (p.isRedirect) {
      runBodyLines.push(`      isRedirect: true,`);
    }
    runBodyLines.push(`    });`);
  }

  // Handle redirect response
  if (p.isRedirect) {
    runBodyLines.push('');
    runBodyLines.push(`    const redirectUrl = (data as Record<string, unknown>)?.url as string;`);
    runBodyLines.push(`    if (redirectUrl && flags.save) {`);
    runBodyLines.push(`      const result = await downloadFile(redirectUrl, flags.save);`);
    runBodyLines.push(`      this.success(\`Сохранено: \${flags.save} (\${formatSize(result.size)})\`);`);
    runBodyLines.push(`      return;`);
    runBodyLines.push(`    }`);
  }

  // Unwrap response data
  runBodyLines.push('');
  if (p.isList) {
    runBodyLines.push(`    const responseBody = data as Record<string, unknown>;`);
    runBodyLines.push(`    const items = responseBody.data ?? responseBody;`);
    runBodyLines.push(`    this.output(items);`);
  } else if (p.endpoint.method === 'DELETE') {
    runBodyLines.push(`    this.success('Удалено');`);
  } else {
    runBodyLines.push(`    const responseBody = data as Record<string, unknown>;`);
    runBodyLines.push(`    const result = responseBody.data ?? responseBody;`);
    runBodyLines.push(`    this.output(result);`);
  }

  // Put it all together
  const allFlags = [...queryFlagLines, ...bodyFlagLines];

  const staticMeta: string[] = [];
  if (p.scope) staticMeta.push(`  static scope = ${JSON.stringify(p.scope)};`);
  if (p.plan) staticMeta.push(`  static plan = ${JSON.stringify(p.plan)};`);
  staticMeta.push(`  static apiMethod = ${JSON.stringify(p.endpoint.method)};`);
  staticMeta.push(`  static apiPath = ${JSON.stringify(p.endpoint.path)};`);
  if (p.defaultColumns.length > 0) staticMeta.push(`  static defaultColumns = ${JSON.stringify(p.defaultColumns)};`);
  if (allRequiredFlags.length > 0) {
    staticMeta.push(`  static requiredFlags = ${JSON.stringify(allRequiredFlags.map((f) => f.flagName))};`);
  }

  // Build examples from workflows
  const examplesBlock = p.examples && p.examples.length > 0
    ? `\n  static override examples = ${JSON.stringify(p.examples, null, 4).replace(/\n/g, '\n  ')};\n`
    : '';

  return `// Auto-generated from openapi.yaml — DO NOT EDIT
${imports.join('\n')}

export default class ${p.className} extends BaseCommand {
  static override description = ${JSON.stringify(p.summary)};
${examplesBlock}
${staticMeta.join('\n')}

  static override args = {
${argsCode.join('\n')}
  };

  static override flags = {
    ...BaseCommand.baseFlags,
${allFlags.join('\n')}
  };

  async run(): Promise<void> {
${runBodyLines.join('\n')}
  }
}
`;
}

export function getWrapperKey(schema: Schema): string | null {
  const resolved = resolveAllOf(schema);
  if (!resolved.properties) return null;
  const keys = Object.keys(resolved.properties);
  const objectKeys = keys.filter((k) => {
    const inner = resolveAllOf(resolved.properties![k]);
    return inner.properties && Object.keys(inner.properties).length > 0;
  });
  if (objectKeys.length === 1) return objectKeys[0];
  return null;
}

function getOclifArgType(schema: Schema): string {
  const t = getSchemaType(schema);
  if (t === 'integer' || t === 'number') return 'integer';
  return 'string';
}

function getOclifFlagType(schema: Schema): string {
  const t = getSchemaType(schema);
  if (t === 'integer' || t === 'number') return 'integer';
  if (t === 'boolean') return 'boolean';
  return 'string';
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// ----- Workflow & Alternative Data Generation -----

async function generateWorkflowsData(): Promise<void> {
  try {
    // Dynamic import of workflows from packages/spec
    const workflowsPath = path.join(ROOT, 'packages', 'spec', 'workflows.ts');
    if (!fs.existsSync(workflowsPath)) return;

    const { WORKFLOWS } = await import(workflowsPath);

    const entries: { title: string; skill: string; steps: { description: string; command?: string; notes?: string }[] }[] = [];

    for (const [skill, workflows] of Object.entries(WORKFLOWS as Record<string, { title: string; steps: { description: string; command?: string; notes?: string }[] }[]>)) {
      for (const w of workflows) {
        // Only include steps that have a command (skip text-only steps for CLI)
        const cliSteps = w.steps
          .filter((step) => step.command)
          .map((step) => ({ description: step.description, command: step.command, notes: step.notes }));

        // Skip workflows with no CLI commands
        if (cliSteps.length === 0) continue;

        entries.push({
          title: w.title,
          skill,
          steps: cliSteps,
        });
      }
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'workflows.json'),
      JSON.stringify(entries, null, 2),
    );
  } catch {
    // Keep empty workflows.json
  }
}

async function generateAlternativesData(commands: GeneratedCommand[]): Promise<void> {
  const alternatives: Record<string, string> = {};

  for (const cmd of commands) {
    const commandId = `${cmd.section}:${cmd.action}`;
    alternatives[commandId] = cmd.summary;
  }

  // Try to load skill config alternatives
  try {
    const configPath = path.join(ROOT, 'apps', 'docs', 'scripts', 'skills', 'config.ts');
    if (fs.existsSync(configPath)) {
      const { SKILL_TAG_MAP } = await import(configPath);
      for (const skill of SKILL_TAG_MAP as { name: string; nearestAlternatives?: (string | { name: string; text: string })[] }[]) {
        if (skill.nearestAlternatives) {
          for (const alt of skill.nearestAlternatives) {
            const name = typeof alt === 'string' ? alt : alt.name;
            alternatives[`skill:${name}`] = typeof alt === 'string' ? name : alt.text;
          }
        }
      }
    }
  } catch {
    // Keep basic alternatives
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'alternatives.json'),
    JSON.stringify(alternatives, null, 2),
  );
}

// ----- README Generation -----

function generateReadme(commands: GeneratedCommand[]): void {
  const templatePath = path.join(ROOT, 'packages', 'cli', 'README.template.md');
  if (!fs.existsSync(templatePath)) return;

  let template = fs.readFileSync(templatePath, 'utf-8');

  // Generate commands table grouped by section
  const grouped = new Map<string, GeneratedCommand[]>();
  for (const cmd of commands) {
    if (!grouped.has(cmd.section)) grouped.set(cmd.section, []);
    grouped.get(cmd.section)!.push(cmd);
  }

  const commandLines: string[] = ['## Команды', ''];
  for (const [section, cmds] of grouped) {
    commandLines.push(`### ${section}`, '');
    commandLines.push('| Команда | Описание |');
    commandLines.push('|---------|---------|');
    for (const cmd of cmds) {
      commandLines.push(`| \`pachca ${cmd.section} ${cmd.action}\` | ${cmd.summary} |`);
    }
    commandLines.push('');
  }

  template = template.replace(
    /<!-- AUTO:COMMANDS -->[\s\S]*?<!-- AUTO:COMMANDS:END -->/,
    `<!-- AUTO:COMMANDS -->\n${commandLines.join('\n')}\n<!-- AUTO:COMMANDS:END -->`,
  );

  // Generate global flags table
  const flagsLines: string[] = [
    '## Глобальные флаги', '',
    '| Флаг | Короткий | Описание |',
    '|------|----------|----------|',
    '| `--output <format>` | `-o` | Формат вывода: table, json, yaml, csv |',
    '| `--columns <list>` | `-c` | Колонки для table-вывода |',
    '| `--no-header` | | Скрыть заголовок таблицы |',
    '| `--profile <name>` | `-p` | Профиль для этой команды |',
    '| `--token <value>` | | Bearer-токен для этого вызова |',
    '| `--quiet` | `-q` | Подавить вывод кроме ошибок |',
    '| `--verbose` | `-v` | Показывать HTTP-детали |',
    '| `--no-input` | | Отключить промпты |',
    '| `--dry-run` | | Показать запрос без отправки |',
    '| `--timeout <seconds>` | | Таймаут запроса |',
    '| `--no-retry` | | Отключить авто-retry |',
    '',
  ];

  template = template.replace(
    /<!-- AUTO:FLAGS -->[\s\S]*?<!-- AUTO:FLAGS:END -->/,
    `<!-- AUTO:FLAGS -->\n${flagsLines.join('\n')}\n<!-- AUTO:FLAGS:END -->`,
  );

  fs.writeFileSync(path.join(ROOT, 'packages', 'cli', 'README.md'), template);
}

// ----- Main -----

async function loadWorkflowExamples(endpoints: Endpoint[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  try {
    const workflowsPath = path.join(ROOT, 'packages', 'spec', 'workflows.ts');
    if (!fs.existsSync(workflowsPath)) return map;

    // Build mapping: "METHOD /path" → "pachca section action"
    const pathToCommand = new Map<string, string>();
    for (const ep of endpoints) {
      const url = generateUrlFromOperation(ep).replace(/^\/api\//, '/');
      const [, section, action] = url.split('/');
      const cliCmd = `pachca ${section} ${action}`;
      pathToCommand.set(`${ep.method} ${ep.path}`, cliCmd);
    }

    const { WORKFLOWS } = await import(workflowsPath);
    for (const workflows of Object.values(WORKFLOWS as Record<string, { title: string; steps: { description: string; command?: string; apiMethod?: string; apiPath?: string }[] }[]>)) {
      for (const w of workflows) {
        for (const step of w.steps) {
          if (step.command && step.apiPath) {
            // Use explicit apiPath from step
            const cmdBase = step.command.split(/\s+/).slice(0, 3).join(' ');
            const apiPath = step.apiPath;
            if (!map.has(apiPath)) map.set(apiPath, []);
            const existing = map.get(apiPath)!;
            const example = `${w.title}:\n  $ ${cmdBase}`;
            if (!existing.includes(example)) existing.push(example);
          } else if (step.command) {
            // Fallback: try to match from description
            const match = step.description.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s?,—.()]+)/);
            if (match) {
              const apiPath = match[2];
              if (!map.has(apiPath)) map.set(apiPath, []);
              const existing = map.get(apiPath)!;
              const cmdBase = step.command.split(/\s+/).slice(0, 3).join(' ');
              const example = `${w.title}:\n  $ ${cmdBase}`;
              if (!existing.includes(example)) existing.push(example);
            }
          }
        }
      }
    }
  } catch {
    // No workflows
  }
  return map;
}

async function main(): Promise<void> {
  console.log('Generating CLI commands from openapi.yaml...');

  const endpoints = parseOpenAPI();
  console.log(`  Parsed ${endpoints.length} endpoints`);

  // Load workflow examples for embedding in --help
  const workflowExamples = await loadWorkflowExamples(endpoints);

  const commands: GeneratedCommand[] = [];

  for (const endpoint of endpoints) {
    const examples = workflowExamples.get(endpoint.path)?.slice(0, 3);
    const cmd = generateCommand(endpoint, examples);
    commands.push(cmd);

    // Write command file
    const dir = path.join(COMMANDS_DIR, cmd.section);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, cmd.filename), cmd.code);
  }

  console.log(`  Generated ${commands.length} commands`);

  // Clean up old generated files that no longer have a matching endpoint
  // Scan ALL subdirectories in commands/, not just current sections,
  // so that renamed sections (e.g. thread/ → threads/) get cleaned up too
  const generatedSections = new Set(commands.map((c) => c.section));
  const allDirs = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const section of allDirs) {
    const dir = path.join(COMMANDS_DIR, section);
    const files = fs.readdirSync(dir).filter((f) => {
      if (!f.endsWith('.ts')) return false;
      const content = fs.readFileSync(path.join(dir, f), 'utf-8');
      return content.includes('Auto-generated from openapi.yaml');
    });
    for (const file of files) {
      if (!commands.some((c) => c.section === section && c.filename === file)) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`  Removed stale: ${section}/${file}`);
      }
    }
    // Remove empty directories left after cleanup
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      console.log(`  Removed empty dir: ${section}/`);
    }
  }

  // Also clean up stale dist/commands/ directories so tsc leftovers don't pollute oclif manifest
  const DIST_COMMANDS = path.join(CLI_SRC, '..', 'dist', 'commands');
  if (fs.existsSync(DIST_COMMANDS)) {
    const srcDirNames = new Set(
      fs.readdirSync(COMMANDS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name),
    );
    const distDirs = fs.readdirSync(DIST_COMMANDS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const section of distDirs) {
      if (!srcDirNames.has(section)) {
        fs.rmSync(path.join(DIST_COMMANDS, section), { recursive: true });
        console.log(`  Removed stale dist: ${section}/`);
      }
    }
  }

  // Generate data files
  await generateWorkflowsData();
  console.log('  Generated workflows.json');

  await generateAlternativesData(commands);
  console.log('  Generated alternatives.json');

  // Generate README
  generateReadme(commands);
  console.log('  Generated README.md');

  console.log('Done!');
}

main().catch((error) => {
  console.error('Generation failed:', error);
  process.exit(1);
});
