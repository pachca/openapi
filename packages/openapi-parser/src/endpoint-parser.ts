import type {
  Endpoint,
  Parameter,
  ParamNameEntry,
  RequestBody,
  Response,
  MediaType,
  Header,
  Schema,
  Example,
} from './types.js';
import type { OpenAPIDocument } from './ref-resolver.js';
import { resolveRef } from './ref-resolver.js';
import { parseSchema } from './schema-parser.js';
import { isRecord, getString, getBoolean, getArray, getRecord } from './type-guards.js';

export function parseEndpoint(
  path: string,
  method: string,
  operation: Record<string, unknown>,
  openapi: OpenAPIDocument
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

  // x-requirements
  const requirements = getRecord(operation, 'x-requirements');
  if (requirements) {
    endpoint.requirements = {
      scope: getString(requirements, 'scope') || undefined,
      plan: getString(requirements, 'plan') || undefined,
      auth: requirements.auth === false ? false : undefined,
    };
  }

  // Parameters
  const parameters = getArray(operation, 'parameters');
  if (parameters) {
    endpoint.parameters = parameters
      .filter((param): param is Record<string, unknown> => isRecord(param))
      .map((param) => parseParameter(param, openapi));
  }

  // Request body
  const requestBody = getRecord(operation, 'requestBody');
  if (requestBody) {
    endpoint.requestBody = parseRequestBody(requestBody, openapi);
  }

  // Responses
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

function parseParameter(param: Record<string, unknown>, openapi: OpenAPIDocument): Parameter {
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
    'x-param-names': parseParamNames(getArray(resolved, 'x-param-names')),
  };
}

function parseParamNames(raw: unknown[] | undefined): ParamNameEntry[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  return raw
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      name: getString(item, 'name') || '',
      description: getString(item, 'description'),
    }));
}

function parseExamples(
  examples: Record<string, unknown> | undefined,
  openapi: OpenAPIDocument
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

function parseRequestBody(body: Record<string, unknown>, openapi: OpenAPIDocument): RequestBody {
  const ref = getString(body, '$ref');
  const resolved = ref ? resolveRef(ref, openapi) : body;

  const content: Record<string, MediaType> = {};
  const resolvedContent = getRecord(resolved, 'content');
  if (resolvedContent) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolvedContent)) {
      if (!isRecord(mediaTypeObj)) continue;
      const schema = getRecord(mediaTypeObj, 'schema');
      const parsedSchema = schema ? parseSchema(schema, openapi) : { type: 'object' as const };

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

function parseResponse(response: Record<string, unknown>, openapi: OpenAPIDocument): Response {
  const ref = getString(response, '$ref');
  const resolved = ref ? resolveRef(ref, openapi) : response;

  const content: Record<string, MediaType> = {};
  const resolvedContent = getRecord(resolved, 'content');
  if (resolvedContent) {
    for (const [mediaType, mediaTypeObj] of Object.entries(resolvedContent)) {
      if (!isRecord(mediaTypeObj)) continue;
      const schema = getRecord(mediaTypeObj, 'schema');
      const parsedSchema = schema ? parseSchema(schema, openapi) : { type: 'object' as const };

      content[mediaType] = {
        schema: parsedSchema,
        example: mediaTypeObj.example,
        examples: parseExamples(getRecord(mediaTypeObj, 'examples'), openapi),
        encoding: getRecord(mediaTypeObj, 'encoding'),
      };
    }
  }

  // Response headers
  const headers: Record<string, Header> = {};
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
