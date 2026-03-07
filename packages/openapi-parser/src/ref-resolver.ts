import { isRecord } from './type-guards.js';

export type OpenAPIDocument = Record<string, unknown>;

export function resolveRef(ref: string, openapi: OpenAPIDocument): Record<string, unknown> {
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
