/**
 * OpenAPI Parser
 *
 * Shared parser for openapi.yaml used by both the CLI generator and tests.
 * Extracted from generate-cli.ts to avoid cross-package dependencies.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

// ----- Type Definitions -----

export interface Schema {
  type?: string | string[];
  format?: string;
  description?: string;
  title?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: unknown[];
  'x-enum-descriptions'?: Record<string, string>;
  default?: unknown;
  example?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  $ref?: string;
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  additionalProperties?: boolean | Schema;
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: Schema;
  'x-param-names'?: { name: string; description?: string }[];
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: Schema }>;
}

export interface Response {
  description: string;
  content?: Record<string, { schema: Schema }>;
  headers?: Record<string, { description?: string; schema?: Schema }>;
}

export interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: Record<string, string[]>[];
  requirements?: { scope?: string; plan?: string; auth?: boolean };
  paginated?: boolean;
  externalUrl?: string;
}

// ----- Spec Path -----

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const SPEC_PATH = path.join(ROOT, 'packages', 'spec', 'openapi.yaml');

// ----- OpenAPI Parsing -----

export function parseOpenAPI(): Endpoint[] {
  const raw = fs.readFileSync(SPEC_PATH, 'utf-8');
  const spec = yaml.load(raw) as Record<string, unknown>;
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  const endpoints: Endpoint[] = [];

  function resolveRef(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const rec = obj as Record<string, unknown>;
    if (rec.$ref && typeof rec.$ref === 'string') {
      const refPath = rec.$ref.replace('#/', '').split('/');
      let current: unknown = spec;
      for (const part of refPath) {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        }
      }
      return resolveRef(current);
    }
    return obj;
  }

  function resolveSchema(s: unknown, depth = 0): Schema {
    if (depth > 10) return s as Schema;
    const resolved = resolveRef(s) as Record<string, unknown>;
    if (!resolved || typeof resolved !== 'object') return {} as Schema;

    const result: Schema = { ...resolved } as Schema;

    if (result.properties) {
      const props: Record<string, Schema> = {};
      for (const [k, v] of Object.entries(result.properties)) {
        props[k] = resolveSchema(v, depth + 1);
      }
      result.properties = props;
    }
    if (result.items) {
      result.items = resolveSchema(result.items, depth + 1);
    }
    if (result.allOf) {
      result.allOf = result.allOf.map((s) => resolveSchema(s, depth + 1));
    }
    if (result.oneOf) {
      result.oneOf = result.oneOf.map((s) => resolveSchema(s, depth + 1));
    }
    if (result.anyOf) {
      result.anyOf = result.anyOf.map((s) => resolveSchema(s, depth + 1));
    }
    return result;
  }

  for (const [pathStr, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [method, opRaw] of Object.entries(methods as Record<string, unknown>)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
      const op = opRaw as Record<string, unknown>;

      // Parse parameters
      const params: Parameter[] = [];
      const rawParams = (op.parameters || []) as Record<string, unknown>[];
      for (const p of rawParams) {
        const resolved = resolveRef(p) as Record<string, unknown>;
        if (!resolved) continue;
        const paramSchema = resolveSchema(resolved.schema);
        params.push({
          name: resolved.name as string,
          in: resolved.in as Parameter['in'],
          description: resolved.description as string | undefined,
          required: resolved.required as boolean | undefined,
          schema: paramSchema,
          'x-param-names': resolved['x-param-names'] as Parameter['x-param-names'],
        });
      }

      // Parse request body
      let requestBody: RequestBody | undefined;
      if (op.requestBody) {
        const rb = resolveRef(op.requestBody) as Record<string, unknown>;
        const content: Record<string, { schema: Schema }> = {};
        if (rb.content && typeof rb.content === 'object') {
          for (const [ct, mediaRaw] of Object.entries(rb.content as Record<string, unknown>)) {
            const media = resolveRef(mediaRaw) as Record<string, unknown>;
            content[ct] = { schema: resolveSchema(media.schema) };
          }
        }
        requestBody = {
          description: rb.description as string | undefined,
          required: rb.required as boolean | undefined,
          content,
        };
      }

      // Parse responses
      const responses: Record<string, Response> = {};
      if (op.responses && typeof op.responses === 'object') {
        for (const [status, respRaw] of Object.entries(op.responses as Record<string, unknown>)) {
          const resp = resolveRef(respRaw) as Record<string, unknown>;
          const respContent: Record<string, { schema: Schema }> = {};
          if (resp.content && typeof resp.content === 'object') {
            for (const [ct, mediaRaw] of Object.entries(resp.content as Record<string, unknown>)) {
              const media = resolveRef(mediaRaw) as Record<string, unknown>;
              respContent[ct] = { schema: resolveSchema(media.schema) };
            }
          }
          // Parse headers
          let headers: Record<string, { description?: string; schema?: Schema }> | undefined;
          if (resp.headers && typeof resp.headers === 'object') {
            headers = {};
            for (const [hName, hRaw] of Object.entries(resp.headers as Record<string, unknown>)) {
              const h = resolveRef(hRaw) as Record<string, unknown>;
              headers[hName] = {
                description: h.description as string | undefined,
                schema: h.schema ? resolveSchema(h.schema) : undefined,
              };
            }
          }
          responses[status] = {
            description: (resp.description as string) || '',
            content: Object.keys(respContent).length > 0 ? respContent : undefined,
            headers,
          };
        }
      }

      // Parse requirements
      let requirements: Endpoint['requirements'] | undefined;
      if (op['x-requirements'] && typeof op['x-requirements'] === 'object') {
        const req = op['x-requirements'] as Record<string, unknown>;
        requirements = {
          scope: req.scope as string | undefined,
          plan: req.plan as string | undefined,
          auth: req.auth as boolean | undefined,
        };
      }

      // Parse x-paginated and x-external-url
      const paginated = op['x-paginated'] === true ? true : undefined;
      const externalUrl = typeof op['x-external-url'] === 'string' ? (op['x-external-url'] as string) : undefined;

      endpoints.push({
        id: (op.operationId as string) || `${method}_${pathStr}`,
        method: method.toUpperCase() as Endpoint['method'],
        path: pathStr,
        tags: (op.tags as string[]) || [],
        summary: op.summary as string | undefined,
        description: op.description as string | undefined,
        parameters: params,
        requestBody,
        responses,
        security: op.security as Endpoint['security'],
        requirements,
        paginated,
        externalUrl,
      });
    }
  }

  return endpoints;
}

// ----- Schema Utilities -----

export function resolveAllOf(schema: Schema): Schema {
  if (!schema.allOf || schema.allOf.length === 0) return schema;
  let merged: Schema = {};
  for (const sub of schema.allOf) {
    const resolved = resolveAllOf(sub);
    merged = {
      ...merged,
      ...resolved,
      properties: { ...merged.properties, ...resolved.properties },
      required: [...(merged.required || []), ...(resolved.required || [])],
    };
  }
  return merged;
}

export function getSchemaType(schema: Schema): string {
  if (schema.type) {
    if (Array.isArray(schema.type)) return schema.type[0];
    return schema.type;
  }
  if (schema.enum) return 'string';
  if (schema.properties) return 'object';
  return 'string';
}
