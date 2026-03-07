import type { Schema } from './types.js';
import type { OpenAPIDocument } from './ref-resolver.js';
import { resolveRef } from './ref-resolver.js';
import { isRecord, getString, getBoolean, getArray, getRecord } from './type-guards.js';

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
  // Build a lookup: underscored enum value -> original enum value
  const normalized: Record<string, string> = {};
  const valueByUnderscore = new Map(enumValues.map((v) => [v.replace(/:/g, '_'), v]));
  for (const [key, desc] of Object.entries(descriptions)) {
    const enumValue = valueByUnderscore.get(key);
    normalized[enumValue ?? key] = desc;
  }
  return normalized;
}

export function parseSchema(
  schema: Record<string, unknown>,
  openapi: OpenAPIDocument,
  depth = 0
): Schema {
  if (!schema || depth > 20) {
    return { type: 'object' };
  }

  // Resolve $ref
  const ref = getString(schema, '$ref');
  if (ref) {
    const resolved = resolveRef(ref, openapi);
    const parsed = parseSchema(resolved, openapi, depth + 1);
    // Preserve $ref for component name display
    parsed.$ref = ref;
    // Sibling properties override $ref properties
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
    'x-record-key-example': getString(schema, 'x-record-key-example'),
    'x-error': getBoolean(schema, 'x-error'),
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

  // Properties
  const properties = getRecord(schema, 'properties');
  if (properties) {
    parsed.properties = {};
    for (const [propName, propSchema] of Object.entries(properties)) {
      if (isRecord(propSchema)) {
        parsed.properties[propName] = parseSchema(propSchema, openapi, depth + 1);
      }
    }
  }

  // Items (arrays)
  const items = getRecord(schema, 'items');
  if (items) {
    parsed.items = parseSchema(items, openapi, depth + 1);
  }

  // allOf
  const allOf = getArray(schema, 'allOf');
  if (allOf) {
    parsed.allOf = allOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // oneOf
  const oneOf = getArray(schema, 'oneOf');
  if (oneOf) {
    parsed.oneOf = oneOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // anyOf
  const anyOf = getArray(schema, 'anyOf');
  if (anyOf) {
    parsed.anyOf = anyOf
      .filter((s): s is Record<string, unknown> => isRecord(s))
      .map((s) => parseSchema(s, openapi, depth + 1));
  }

  // additionalProperties
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
