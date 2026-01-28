import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type { ParsedAPI, Endpoint, Parameter, Schema, RequestBody, Response, Example } from './types';

const OPENAPI_PATH = path.join(process.cwd(), 'openapi-source', 'openapi.yaml');

let cachedAPI: ParsedAPI | null = null;

export async function parseOpenAPI(): Promise<ParsedAPI> {
  if (cachedAPI) {
    return cachedAPI;
  }

  // Read and parse YAML file
  const fileContents = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const openapi = yaml.load(fileContents) as any;

  const parsed: ParsedAPI = {
    info: {
      title: openapi.info?.title || 'API Documentation',
      version: openapi.info?.version || '1.0.0',
      description: openapi.info?.description,
    },
    servers: openapi.servers || [],
    tags: openapi.tags || [],
    endpoints: [],
    schemas: openapi.components?.schemas || {},
  };

  // Parse endpoints from paths
  if (openapi.paths) {
    for (const [pathStr, pathItem] of Object.entries(openapi.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
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
  operation: any,
  openapi: any
): Endpoint {
  const endpoint: Endpoint = {
    id: operation.operationId || `${method}_${path}`,
    method: method as any,
    path,
    tags: operation.tags || [],
    summary: operation.summary,
    description: operation.description,
    parameters: [],
    responses: {},
    security: operation.security,
  };

  // Parse parameters
  if (operation.parameters) {
    endpoint.parameters = operation.parameters.map((param: any) => parseParameter(param, openapi));
  }

  // Parse request body
  if (operation.requestBody) {
    endpoint.requestBody = parseRequestBody(operation.requestBody, openapi);
  }

  // Parse responses
  if (operation.responses) {
    for (const [statusCode, response] of Object.entries(operation.responses)) {
      endpoint.responses[statusCode] = parseResponse(response as any, openapi);
    }
  }

  return endpoint;
}

function parseParameter(param: any, openapi: any): Parameter {
  const resolved = param.$ref ? resolveRef(param.$ref, openapi) : param;
  
  return {
    name: resolved.name,
    in: resolved.in,
    description: resolved.description,
    required: resolved.required || false,
    deprecated: resolved.deprecated,
    allowEmptyValue: resolved.allowEmptyValue,
    schema: resolved.schema ? parseSchema(resolved.schema, openapi) : { type: 'string' },
    example: resolved.example,
    examples: parseExamples(resolved.examples, openapi),
    explode: resolved.explode,
    style: resolved.style,
  };
}

/**
 * Парсит объект examples из OpenAPI
 */
function parseExamples(examples: any, openapi: any): Record<string, Example> | undefined {
  if (!examples) {
    return undefined;
  }

  const parsed: Record<string, Example> = {};
  for (const [exampleName, exampleObj] of Object.entries(examples)) {
    const resolved = (exampleObj as any).$ref 
      ? resolveRef((exampleObj as any).$ref, openapi) 
      : exampleObj;
    
    parsed[exampleName] = {
      summary: resolved.summary,
      description: resolved.description,
      value: resolved.value,
      externalValue: resolved.externalValue,
    };
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function parseRequestBody(body: any, openapi: any): RequestBody {
  const resolved = body.$ref ? resolveRef(body.$ref, openapi) : body;
  
  const content: Record<string, any> = {};
  if (resolved.content) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolved.content)) {
      const mediaObj = mediaTypeObj as any;
      const parsedSchema = parseSchema(mediaObj.schema, openapi);
      
      content[mediaType] = {
        schema: parsedSchema,
        example: mediaObj.example,
        examples: parseExamples(mediaObj.examples, openapi),
        encoding: mediaObj.encoding,
      };
    }
  }

  return {
    description: resolved.description,
    required: resolved.required,
    content,
  };
}

function parseResponse(response: any, openapi: any): Response {
  const resolved = response.$ref ? resolveRef(response.$ref, openapi) : response;
  
  const content: Record<string, any> = {};
  if (resolved.content) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolved.content)) {
      const mediaObj = mediaTypeObj as any;
      const parsedSchema = parseSchema(mediaObj.schema, openapi);
      
      content[mediaType] = {
        schema: parsedSchema,
        example: mediaObj.example,
        examples: parseExamples(mediaObj.examples, openapi),
        encoding: mediaObj.encoding,
      };
    }
  }

  // Парсим заголовки ответа
  const headers: Record<string, any> = {};
  if (resolved.headers) {
    for (const [headerName, headerObj] of Object.entries(resolved.headers)) {
      const header = headerObj as any;
      headers[headerName] = {
        description: header.description,
        required: header.required,
        deprecated: header.deprecated,
        schema: header.schema ? parseSchema(header.schema, openapi) : undefined,
        example: header.example,
      };
    }
  }

  return {
    description: resolved.description,
    content: Object.keys(content).length > 0 ? content : undefined,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
}

function parseSchema(schema: any, openapi: any, depth = 0): Schema {
  // Защита от бесконечной рекурсии
  if (!schema || depth > 20) {
    return { type: 'object' };
  }

  // Разрешаем $ref ссылки
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, openapi);
    const parsed = parseSchema(resolved, openapi, depth + 1);
    // Всегда сохраняем $ref для отображения названий вариантов и компонентов
    parsed.$ref = schema.$ref;
    return parsed;
  }

  const parsed: Schema = {
    type: schema.type,
    format: schema.format,
    description: schema.description,
    required: schema.required,
    enum: schema.enum,
    'x-enum-descriptions': schema['x-enum-descriptions'],
    default: schema.default,
    example: schema.example,
    nullable: schema.nullable,
    title: schema.title,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minimum: schema.minimum,
    maximum: schema.maximum,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    pattern: schema.pattern,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    deprecated: schema.deprecated,
  };

  // Обрабатываем свойства объекта
  if (schema.properties) {
    parsed.properties = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      parsed.properties[propName] = parseSchema(propSchema, openapi, depth + 1);
    }
  }

  // Обрабатываем items для массивов
  if (schema.items) {
    parsed.items = parseSchema(schema.items, openapi, depth + 1);
  }

  // Обрабатываем allOf (слияние схем)
  if (schema.allOf) {
    parsed.allOf = schema.allOf.map((s: any) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем oneOf (одна из схем)
  if (schema.oneOf) {
    parsed.oneOf = schema.oneOf.map((s: any) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем anyOf (любая из схем)
  if (schema.anyOf) {
    parsed.anyOf = schema.anyOf.map((s: any) => parseSchema(s, openapi, depth + 1));
  }

  // Обрабатываем additionalProperties
  if (schema.additionalProperties !== undefined) {
    parsed.additionalProperties = 
      typeof schema.additionalProperties === 'boolean'
        ? schema.additionalProperties
        : parseSchema(schema.additionalProperties, openapi, depth + 1);
  }

  return parsed;
}

function resolveRef(ref: string, openapi: any): any {
  const parts = ref.replace('#/', '').split('/');
  let current = openapi;
  
  for (const part of parts) {
    current = current[part];
    if (!current) {
      throw new Error(`Could not resolve reference: ${ref}`);
    }
  }
  
  return current;
}

export function getEndpointByOperation(operationId: string): Promise<Endpoint | undefined> {
  return parseOpenAPI().then(api => 
    api.endpoints.find(e => e.id === operationId)
  );
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
  return parseOpenAPI().then(api =>
    api.endpoints.filter(e => e.tags.includes(tag))
  );
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
    const openapi = yaml.load(fileContents) as any;
    
    const parsed = parseSchema(rawSchema, openapi);
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
