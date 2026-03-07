import * as fs from 'node:fs';
import * as yaml from 'js-yaml';
import type { ParsedAPI, Schema } from './types.js';
import type { OpenAPIDocument } from './ref-resolver.js';
import { isRecord, getString, getArray, getRecord } from './type-guards.js';
import { parseSchema } from './schema-parser.js';
import { parseEndpoint } from './endpoint-parser.js';

export interface ParseOptions {
  /** When input is a string, treat it as YAML content rather than a file path */
  format?: 'yaml';
}

/**
 * Parse an OpenAPI 3.0 specification.
 *
 * Accepts a file path (string without format option),
 * raw YAML content (string with { format: 'yaml' }),
 * or a pre-parsed JavaScript object.
 */
export function parseOpenAPI(input: string, options?: ParseOptions): ParsedAPI;
export function parseOpenAPI(input: OpenAPIDocument): ParsedAPI;
export function parseOpenAPI(
  input: string | OpenAPIDocument,
  options?: ParseOptions
): ParsedAPI {
  let openapi: OpenAPIDocument;

  if (typeof input === 'string') {
    if (options?.format === 'yaml') {
      openapi = yaml.load(input) as OpenAPIDocument;
    } else {
      const content = fs.readFileSync(input, 'utf-8');
      openapi = yaml.load(content) as OpenAPIDocument;
    }
  } else {
    openapi = input;
  }

  const info = getRecord(openapi, 'info');
  const components = getRecord(openapi, 'components');

  // Parse component schemas
  const rawSchemas = (components && getRecord(components, 'schemas')) || {};
  const schemas: Record<string, Schema> = {};
  for (const [name, rawSchema] of Object.entries(rawSchemas)) {
    if (isRecord(rawSchema)) {
      schemas[name] = parseSchema(rawSchema, openapi);
    }
  }

  const parsed: ParsedAPI = {
    info: {
      title: (info && getString(info, 'title')) || 'API Documentation',
      version: (info && getString(info, 'version')) || '1.0.0',
      description: info ? getString(info, 'description') : undefined,
    },
    servers: (getArray(openapi, 'servers') || []) as ParsedAPI['servers'],
    tags: (getArray(openapi, 'tags') || []) as ParsedAPI['tags'],
    endpoints: [],
    schemas,
  };

  // Parse endpoints
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

  return parsed;
}
