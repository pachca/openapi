import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ParsedAPI,
  Endpoint,
  Parameter,
  Schema,
  RequestBody,
  Response,
  Example,
  MediaType,
} from './types';
import { isRecord, getString, getBoolean, getArray, getRecord } from '../utils/type-guards';

// Type for raw OpenAPI document data from YAML parsing
type OpenAPIData = Record<string, unknown>;

const OPENAPI_PATH = path.join(process.cwd(), '..', '..', 'packages', 'spec', 'openapi.yaml');

let cachedAPI: ParsedAPI | null = null;

export async function parseOpenAPI(): Promise<ParsedAPI> {
  if (cachedAPI) {
    return cachedAPI;
  }

  // Read and parse YAML file
  const fileContents = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const openapi = yaml.load(fileContents) as OpenAPIData;

  const info = getRecord(openapi, 'info');
  const components = getRecord(openapi, 'components');

  const parsed: ParsedAPI = {
    info: {
      title: (info && getString(info, 'title')) || 'API Documentation',
      version: (info && getString(info, 'version')) || '1.0.0',
      description: info ? getString(info, 'description') : undefined,
    },
    servers: (getArray(openapi, 'servers') || []) as ParsedAPI['servers'],
    tags: (getArray(openapi, 'tags') || []) as ParsedAPI['tags'],
    endpoints: [],
    schemas: ((components && getRecord(components, 'schemas')) || {}) as Record<string, Schema>,
  };

  // Parse endpoints from paths
  const paths = getRecord(openapi, 'paths');
  if (paths) {
    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!isRecord(pathItem)) continue;
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          if (!isRecord(operation)) continue;
          const endpoint = parseEndpoint(pathStr, method.toUpperCase(), operation, openapi);
          parsed.endpoints.push(endpoint);
        }
      }
    }
  }

  cachedAPI = parsed;
  return parsed;
}

function parseEndpoint(
  path: string,
  method: string,
  operation: Record<string, unknown>,
  openapi: OpenAPIData
): Endpoint {
  const endpoint: Endpoint = {
    id: getString(operation, 'operationId') || `${method}_${path}`,
    method: method as Endpoint['method'],
    path,
    tags: (getArray(operation, 'tags') || []) as string[],
    summary: getString(operation, 'summary'),
    description: getString(operation, 'description'),
    parameters: [],
    responses: {},
    security: getArray(operation, 'security') as Endpoint['security'],
  };

  // Parse x-requirements extension
  const requirements = getRecord(operation, 'x-requirements');
  if (requirements) {
    endpoint.requirements = {
      scope: getString(requirements, 'scope') || undefined,
      plan: getString(requirements, 'plan') || undefined,
      auth: requirements.auth === false ? false : undefined,
    };
  }

  // Parse parameters
  const parameters = getArray(operation, 'parameters');
  if (parameters) {
    endpoint.parameters = parameters
      .filter((param): param is Record<string, unknown> => isRecord(param))
      .map((param) => parseParameter(param, openapi));
  }

  // Parse request body
  const requestBody = getRecord(operation, 'requestBody');
  if (requestBody) {
    endpoint.requestBody = parseRequestBody(requestBody, openapi);
  }

  // Parse responses
  const responses = getRecord(operation, 'responses');
  if (responses) {
    for (const [statusCode, response] of Object.entries(responses)) {
      if (isRecord(response)) {
        endpoint.responses[statusCode] = parseResponse(response, openapi);
      }
    }
  }

  return endpoint;
}

function parseParameter(param: Record<string, unknown>, openapi: OpenAPIData): Parameter {
  const ref = getString(param, '$ref');
  const resolved = ref ? resolveRef(ref, openapi) : param;

  const schema = getRecord(resolved, 'schema');

  return {
    name: getString(resolved, 'name') || '',
    in: (getString(resolved, 'in') || 'query') as Parameter['in'],
    description: getString(resolved, 'description'),
    required: getBoolean(resolved, 'required') || false,
    deprecated: getBoolean(resolved, 'deprecated'),
    allowEmptyValue: getBoolean(resolved, 'allowEmptyValue'),
    schema: schema ? parseSchema(schema, openapi) : { type: 'string' },
    example: resolved.example,
    examples: parseExamples(getRecord(resolved, 'examples'), openapi),
    explode: getBoolean(resolved, 'explode'),
    style: getString(resolved, 'style'),
  };
}

/**
 * Парсит объект examples из OpenAPI
 */
function parseExamples(
  examples: Record<string, unknown> | undefined,
  openapi: OpenAPIData
): Record<string, Example> | undefined {
  if (!examples) {
    return undefined;
  }

  const parsed: Record<string, Example> = {};
  for (const [exampleName, exampleObj] of Object.entries(examples)) {
    if (!isRecord(exampleObj)) continue;

    const ref = getString(exampleObj, '$ref');
    const resolved = ref ? resolveRef(ref, openapi) : exampleObj;

    parsed[exampleName] = {
      summary: getString(resolved, 'summary'),
      description: getString(resolved, 'description'),
      value: resolved.value,
      externalValue: getString(resolved, 'externalValue'),
    };
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function parseRequestBody(body: Record<string, unknown>, openapi: OpenAPIData): RequestBody {
  const ref = getString(body, '$ref');
  const resolved = ref ? resolveRef(ref, openapi) : body;

  const content: Record<string, MediaType> = {};
  const resolvedContent = getRecord(resolved, 'content');
  if (resolvedContent) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolvedContent)) {
      if (!isRecord(mediaTypeObj)) continue;
      const schema = getRecord(mediaTypeObj, 'schema');
      const parsedSchema = schema ? parseSchema(schema, openapi) : { type: 'object' };

      content[mediaType] = {
        schema: parsedSchema,
        example: mediaTypeObj.example,
        examples: parseExamples(getRecord(mediaTypeObj, 'examples'), openapi),
        encoding: getRecord(mediaTypeObj, 'encoding'),
      };
    }
  }

  return {
    description: getString(resolved, 'description'),
    required: getBoolean(resolved, 'required'),
    content,
  };
}

function parseResponse(response: Record<string, unknown>, openapi: OpenAPIData): Response {
  const ref = getString(response, '$ref');
  const resolved = ref ? resolveRef(ref, openapi) : response;

  const content: Record<string, MediaType> = {};
  const resolvedContent = getRecord(resolved, 'content');
  if (resolvedContent) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolvedContent)) {
      if (!isRecord(mediaTypeObj)) continue;
      const schema = getRecord(mediaTypeObj, 'schema');
      const parsedSchema = schema ? parseSchema(schema, openapi) : { type: 'object' };

      content[mediaType] = {
        schema: parsedSchema,
        example: mediaTypeObj.example,
        examples: parseExamples(getRecord(mediaTypeObj, 'examples'), openapi),
        encoding: getRecord(mediaTypeObj, 'encoding'),
      };
    }
  }

  // Парсим заголовки ответа
  const headers: Record<string, { description?: string; schema?: Schema }> = {};
  const resolvedHeaders = getRecord(resolved, 'headers');
  if (resolvedHeaders) {
    for (const [headerName, headerObj] of Object.entries(resolvedHeaders)) {
      if (!isRecord(headerObj)) continue;
      const headerSchema = getRecord(headerObj, 'schema');
      headers[headerName] = {
        description: getString(headerObj, 'description'),
        schema: headerSchema ? parseSchema(headerSchema, openapi) : undefined,
      };
    }
  }

  return {
    description: getString(resolved, 'description') || '',
    content: Object.keys(content).length > 0 ? content : undefined,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}

/** Normalize x-enum-descriptions keys to match actual enum values.
 *  TypeSpec generates member-name keys (e.g. `chats_read`) but enum values
 *  may use colons (e.g. `chats:read`). Re-key descriptions to match values. */
function normalizeEnumDescriptions(
  descriptions: Record<string, string> | undefined,
  enumValues: string[] | undefined
): Record<string, string> | undefined {
  if (!descriptions || !enumValues) return descriptions;
  const keys = Object.keys(descriptions);
  // Fast path: if first key already matches an enum value, no normalization needed
  if (keys.length > 0 && enumValues.includes(keys[0])) return descriptions;
  // Build a lookup: underscored enum value → original enum value
  const normalized: Record<string, string> = {};
  const valueByUnderscore = new Map(enumValues.map((v) => [v.replace(/:/g, '_'), v]));
  for (const [key, desc] of Object.entries(descriptions)) {
    const enumValue = valueByUnderscore.get(key);
    normalized[enumValue ?? key] = desc;
  }
  return normalized;
}

function parseSchema(schema: Record<string, unknown>, openapi: OpenAPIData, depth = 0): Schema {
  // Защита от бесконечной рекурсии
  if (!schema || depth > 20) {
    return { type: 'object' };
  }

  // Разрешаем $ref ссылки
  const ref = getString(schema, '$ref');
  if (ref) {
    const resolved = resolveRef(ref, openapi);
    const parsed = parseSchema(resolved, openapi, depth + 1);
    // Всегда сохраняем $ref для отображения названий вариантов и компонентов
    parsed.$ref = ref;
    // Свойства-соседи $ref (например, default) переопределяют свойства из $ref
    if (schema.default !== undefined) parsed.default = schema.default;
    if (schema.example !== undefined) parsed.example = schema.example;
    if (getString(schema, 'description')) parsed.description = getString(schema, 'description');
    return parsed;
  }

  const schemaType = schema.type;
  const parsed: Schema = {
    type: typeof schemaType === 'string' || Array.isArray(schemaType) ? schemaType : undefined,
    format: getString(schema, 'format'),
    description: getString(schema, 'description'),
    required: getArray(schema, 'required') as string[] | undefined,
    enum: getArray(schema, 'enum'),
    'x-enum-descriptions': normalizeEnumDescriptions(
      getRecord(schema, 'x-enum-descriptions') as Record<string, string> | undefined,
      getArray(schema, 'enum') as string[] | undefined
    ),
    default: schema.default,
    example: schema.example,
    nullable: getBoolean(schema, 'nullable'),
    title: getString(schema, 'title'),
    minLength: schema.minLength as number | undefined,
    maxLength: schema.maxLength as number | undefined,
    minimum: schema.minimum as number | undefined,
    maximum: schema.maximum as number | undefined,
    minItems: schema.minItems as number | undefined,
    maxItems: schema.maxItems as number | undefined,
    pattern: getString(schema, 'pattern'),
    readOnly: getBoolean(schema, 'readOnly'),
    writeOnly: getBoolean(schema, 'writeOnly'),
    deprecated: getBoolean(schema, 'deprecated'),
  };

  // Обрабатываем свойства объекта
  const properties = getRecord(schema, 'properties');
  if (properties) {
    parsed.properties = {};
    for (const [propName, propSchema] of Object.entries(properties)) {
      if (isRecord(propSchema)) {
        parsed.properties[propName] = parseSchema(propSchema, openapi, depth + 1);
      }
    }
  }

  // Обрабатываем items для массивов
  const items = getRecord(schema, 'items');
  if (items) {
    parsed.items = parseSchema(items, openapi, depth + 1);
  }

  // Обрабатываем allOf (слияние схем)
  const allOf = getArray(schema, 'allOf');
  if (allOf) {
    parsed.allOf = allOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем oneOf (одна из схем)
  const oneOf = getArray(schema, 'oneOf');
  if (oneOf) {
    parsed.oneOf = oneOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем anyOf (любая из схем)
  const anyOf = getArray(schema, 'anyOf');
  if (anyOf) {
    parsed.anyOf = anyOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем additionalProperties
  const additionalProperties = schema.additionalProperties;
  if (additionalProperties !== undefined) {
    parsed.additionalProperties =
      typeof additionalProperties === 'boolean'
        ? additionalProperties
        : isRecord(additionalProperties)
          ? parseSchema(additionalProperties, openapi, depth + 1)
          : undefined;
  }

  return parsed;
}

function resolveRef(ref: string, openapi: OpenAPIData): Record<string, unknown> {
  const parts = ref.replace('#/', '').split('/');
  let current: unknown = openapi;

  for (const part of parts) {
    if (!isRecord(current)) {
      throw new Error(`Could not resolve reference: ${ref}`);
    }
    current = current[part];
    if (!current) {
      throw new Error(`Could not resolve reference: ${ref}`);
    }
  }

  if (!isRecord(current)) {
    throw new Error(`Resolved reference is not an object: ${ref}`);
  }

  return current;
}

export function getEndpointByOperation(operationId: string): Promise<Endpoint | undefined> {
  return parseOpenAPI().then((api) => api.endpoints.find((e) => e.id === operationId));
}

export async function getEndpointByUrl(url: string): Promise<Endpoint | undefined> {
  const api = await parseOpenAPI();
  const { generateUrlFromOperation } = await import('./mapper');

  for (const endpoint of api.endpoints) {
    const endpointUrl = generateUrlFromOperation(endpoint);
    if (endpointUrl === url) {
      return endpoint;
    }
  }

  return undefined;
}

export function getEndpointsByTag(tag: string): Promise<Endpoint[]> {
  return parseOpenAPI().then((api) => api.endpoints.filter((e) => e.tags.includes(tag)));
}

/**
 * Get the base URL from OpenAPI servers section.
 * Returns the first server URL or a default fallback.
 */
export async function getBaseUrl(): Promise<string> {
  const api = await parseOpenAPI();
  return api.servers[0]?.url || 'https://api.pachca.com/api/shared/v1';
}

export function clearCache() {
  cachedAPI = null;
}

export async function getSchemaByName(schemaName: string): Promise<Schema | undefined> {
  const api = await parseOpenAPI();
  const rawSchema = api.schemas[schemaName];

  if (rawSchema) {
    // Загружаем YAML снова для доступа к полному openapi объекту
    const fileContents = fs.readFileSync(OPENAPI_PATH, 'utf8');
    const openapi = yaml.load(fileContents) as OpenAPIData;

    // Convert Schema to Record<string, unknown> for parseSchema
    const schemaAsRecord = rawSchema as unknown as Record<string, unknown>;
    const parsed = parseSchema(schemaAsRecord, openapi);
    if (!parsed.title) {
      parsed.title = schemaName;
    }
    return parsed;
  }

  // Fallback to guide schemas (custom schemas not in OpenAPI)
  const { getGuideSchema } = await import('../schemas/guide-schemas');
  const guideSchemaEntry = getGuideSchema(schemaName);

  if (guideSchemaEntry) {
    return guideSchemaEntry.schema;
  }

  return undefined;
}
