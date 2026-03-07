import type { Schema } from './types.js';

/**
 * Merge allOf schemas into a single flat schema.
 * Recursively resolves nested allOf.
 */
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

/**
 * Get the primary type string from a schema.
 */
export function getSchemaType(schema: Schema): string {
  if (schema.type) {
    if (Array.isArray(schema.type)) return schema.type[0];
    return schema.type;
  }
  if (schema.enum) return 'string';
  if (schema.properties) return 'object';
  return 'string';
}

/**
 * Check whether a schema represents an error type via the x-error extension.
 */
export function isErrorSchema(schema: Schema): boolean {
  return schema['x-error'] === true;
}
