/**
 * Test mock helpers — generates mock API responses from openapi.yaml
 *
 * Usage:
 *   mockResponse('/users', 'GET')       → full API response body (with wrapper)
 *   mockEntity('/users', 'GET')          → bare entity (without wrapper)
 *   mockFetch({ data: ... })             → set globalThis.fetch mock
 *   mockPaginatedFetch([...])            → multi-page fetch mock
 *   fetchCalls()                         → get fetch mock call args
 *   mockFetchForEndpoint('/users', 'GET') → mockFetch + mockResponse in one call
 */

import { vi } from 'vitest';
import {
  type Schema, type Endpoint,
  parseOpenAPI, resolveAllOf, getSchemaType,
} from '../scripts/openapi-parser.js';

// ----- Cached endpoints -----

let _endpoints: Endpoint[] | null = null;

function getEndpoints(): Endpoint[] {
  if (!_endpoints) _endpoints = parseOpenAPI();
  return _endpoints;
}

function findEndpoint(apiPath: string, method: string): Endpoint {
  const m = method.toUpperCase();
  const ep = getEndpoints().find((e) => e.path === apiPath && e.method === m);
  if (!ep) throw new Error(`Endpoint not found: ${m} ${apiPath}`);
  return ep;
}

// ----- Schema → mock value -----

function generateFromSchema(schema: Schema): unknown {
  // 1. Use example if present
  if (schema.example !== undefined) return schema.example;

  // 2. Handle allOf
  const resolved = resolveAllOf(schema);
  if (resolved !== schema && resolved.example !== undefined) return resolved.example;

  // 3. Enum → first value
  if (resolved.enum && resolved.enum.length > 0) return resolved.enum[0];

  const type = getSchemaType(resolved);

  // 4. Object → recurse into properties
  if (type === 'object' && resolved.properties) {
    const obj: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      if (propSchema.readOnly === undefined || !propSchema.readOnly) {
        obj[key] = generateFromSchema(propSchema);
      } else {
        obj[key] = generateFromSchema(propSchema);
      }
    }
    return obj;
  }

  // 5. Array → one element
  if (type === 'array') {
    if (resolved.items) {
      return [generateFromSchema(resolved.items)];
    }
    return [];
  }

  // 6. Scalar types
  if (type === 'integer' || type === 'number') return 1;
  if (type === 'boolean') return false;
  if (type === 'string') {
    if (resolved.format === 'date-time') return '2024-01-20T10:30:00.000Z';
    if (resolved.format === 'uri' || resolved.format === 'url') return 'https://example.com';
    return 'test';
  }

  return null;
}

// ----- Response mock generation -----

/**
 * Generate a full API response body for an endpoint (with { data: ... } wrapper if applicable).
 *
 * - List endpoints → { data: [entity], meta: { paginate: { next_page: null } } }
 * - Single endpoints → { data: entity }
 * - Bare endpoints (e.g. POST /uploads) → entity directly
 * - 204 → null
 */
export function mockResponse(apiPath: string, method: string, opts?: { overrides?: Record<string, unknown>; count?: number }): unknown {
  const ep = findEndpoint(apiPath, method);

  // 204 No Content
  if (ep.responses['204'] && !ep.responses['200'] && !ep.responses['201']) {
    return null;
  }

  const okResponse = ep.responses['200'] || ep.responses['201'];
  if (!okResponse?.content?.['application/json']) {
    return null;
  }

  const responseSchema = resolveAllOf(okResponse.content['application/json'].schema);

  // Check response structure
  const hasDataProp = responseSchema.properties?.data !== undefined;
  const hasMetaProp = responseSchema.properties?.meta !== undefined;

  if (hasDataProp) {
    const dataSchema = resolveAllOf(responseSchema.properties!.data);
    const isList = dataSchema.type === 'array';

    if (isList && dataSchema.items) {
      // List endpoint: { data: [...], meta: { paginate: { next_page: null } } }
      const count = opts?.count ?? 1;
      const items: unknown[] = [];
      for (let i = 0; i < count; i++) {
        const entity = generateFromSchema(dataSchema.items) as Record<string, unknown>;
        items.push(opts?.overrides ? { ...entity, ...opts.overrides } : entity);
      }
      const result: Record<string, unknown> = { data: items };
      if (hasMetaProp) {
        result.meta = { paginate: { next_page: null } };
      }
      return result;
    }

    // Single entity: { data: entity }
    const entity = generateFromSchema(dataSchema) as Record<string, unknown>;
    return { data: opts?.overrides ? { ...entity, ...opts.overrides } : entity };
  }

  // Bare response (no data wrapper, e.g. POST /uploads)
  const entity = generateFromSchema(responseSchema) as Record<string, unknown>;
  return opts?.overrides ? { ...entity, ...opts.overrides } : entity;
}

/**
 * Generate a bare entity (without response wrapper) for an endpoint.
 * Useful for manual mock construction (e.g. multi-call scenarios).
 */
export function mockEntity(apiPath: string, method: string, overrides?: Record<string, unknown>): Record<string, unknown> {
  const ep = findEndpoint(apiPath, method);

  const okResponse = ep.responses['200'] || ep.responses['201'];
  if (!okResponse?.content?.['application/json']) {
    return overrides ?? {};
  }

  const responseSchema = resolveAllOf(okResponse.content['application/json'].schema);
  const hasDataProp = responseSchema.properties?.data !== undefined;

  let entitySchema: Schema;
  if (hasDataProp) {
    const dataSchema = resolveAllOf(responseSchema.properties!.data);
    if (dataSchema.type === 'array' && dataSchema.items) {
      entitySchema = dataSchema.items;
    } else {
      entitySchema = dataSchema;
    }
  } else {
    entitySchema = responseSchema;
  }

  const entity = generateFromSchema(entitySchema) as Record<string, unknown>;
  return overrides ? { ...entity, ...overrides } : entity;
}

// ----- Fetch mock helpers -----

/**
 * Mock globalThis.fetch to return a single response.
 */
export function mockFetch(response: { status?: number; data?: unknown; headers?: Record<string, string> }): void {
  const status = response.status ?? 200;
  const headers = new Headers({ 'content-type': 'application/json', ...response.headers });
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 400,
    status,
    statusText: status === 200 ? 'OK' : status === 302 ? 'Found' : 'Error',
    headers,
    json: () => Promise.resolve(response.data ?? {}),
    text: () => Promise.resolve(JSON.stringify(response.data ?? {})),
  });
}

/**
 * Mock globalThis.fetch for paginated responses (multiple pages).
 */
export function mockPaginatedFetch(pages: { data: unknown[]; next?: string }[]): void {
  let callIndex = 0;
  globalThis.fetch = vi.fn().mockImplementation(() => {
    const page = pages[callIndex++] || pages[pages.length - 1];
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        data: page.data,
        meta: { paginate: { next_page: page.next || null } },
      }),
      text: () => Promise.resolve(JSON.stringify({
        data: page.data,
        meta: { paginate: { next_page: page.next || null } },
      })),
    });
  });
}

/**
 * Get fetch mock call arguments.
 */
export function fetchCalls(): unknown[][] {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
}

/**
 * One-liner: mock fetch with a spec-generated response for an endpoint.
 */
export function mockFetchForEndpoint(
  apiPath: string,
  method: string,
  opts?: { overrides?: Record<string, unknown>; count?: number; status?: number },
): void {
  const data = mockResponse(apiPath, method, opts);
  mockFetch({ data, status: opts?.status });
}
