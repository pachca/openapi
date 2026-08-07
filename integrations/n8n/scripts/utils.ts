/**
 * Utility functions adapted from packages/cli/scripts/generate-cli.ts
 * for the n8n generator. Uses types from @pachca/openapi-parser.
 */

import type { Schema, RequestBody } from '@pachca/openapi-parser';
import { resolveAllOf, getSchemaType } from '@pachca/openapi-parser';

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
  readOnly?: boolean;
  nullable?: boolean;
  default?: unknown;
  items?: Schema;
  properties?: Record<string, Schema>;
  allOf?: Schema[];
  oneOf?: Schema[];
  /** True if this field is a sibling of the wrapper (not inside it) */
  isSibling?: boolean;
  /** Full schema reference for complex fields */
  schema: Schema;
}

/**
 * Extract body fields from request body, unwrapping wrapper objects.
 * e.g., { message: { content, entity_id } } → [content, entity_id] with wrapper key "message"
 */
export function extractBodyFields(requestBody?: RequestBody): BodyField[] {
  if (!requestBody) return [];

  const jsonContent = requestBody.content['application/json'];
  const multipartContent = requestBody.content['multipart/form-data'];
  const content = jsonContent || multipartContent;
  if (!content) return [];

  const schema = content.schema;
  if (!schema) return [];

  const resolved = resolveAllOf(schema);
  const properties = resolved.properties || {};
  const requiredFields = new Set(resolved.required || []);

  // Unwrap the main object property; the rest stay siblings
  const topKeys = Object.keys(properties);
  const wrapperKey = pickWrapperKey(resolved);

  if (wrapperKey) {
    const wrapper = properties[wrapperKey];
    const innerResolved = resolveAllOf(wrapper);
    if (innerResolved.properties) {
      const innerRequired = new Set(innerResolved.required || []);
      const fields: BodyField[] = Object.entries(innerResolved.properties)
        .filter(([, v]) => !v.readOnly)
        .map(([name, propSchema]) => {
          const resolved2 = resolveAllOf(propSchema);
          return {
            name,
            type: getSchemaType(propSchema),
            format: propSchema.format,
            required: innerRequired.has(name),
            description: propSchema.description,
            enum: propSchema.enum ?? resolved2.enum,
            maxLength: propSchema.maxLength,
            maximum: propSchema.maximum,
            minimum: propSchema.minimum,
            readOnly: propSchema.readOnly,
            nullable: propSchema.nullable,
            default: propSchema.default,
            items: propSchema.items ?? resolved2.items,
            properties: resolved2.properties,
            allOf: propSchema.allOf,
            oneOf: propSchema.oneOf,
            schema: propSchema,
          };
        });

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
          readOnly: propSchema.readOnly,
          nullable: propSchema.nullable,
          default: propSchema.default,
          items: propSchema.items,
          properties: propSchema.properties,
          schema: propSchema,
          isSibling: true,
        });
      }

      return fields;
    }
  }

  // Flat properties
  return Object.entries(properties)
    .filter(([, v]) => !v.readOnly)
    .map(([name, propSchema]) => {
      const resolved2 = resolveAllOf(propSchema);
      return {
        name,
        type: getSchemaType(propSchema),
        format: propSchema.format,
        required: requiredFields.has(name),
        description: propSchema.description,
        enum: propSchema.enum ?? resolved2.enum,
        maxLength: propSchema.maxLength,
        maximum: propSchema.maximum,
        minimum: propSchema.minimum,
        readOnly: propSchema.readOnly,
        nullable: propSchema.nullable,
        default: propSchema.default,
        items: propSchema.items ?? resolved2.items,
        properties: resolved2.properties,
        allOf: propSchema.allOf,
        oneOf: propSchema.oneOf,
        schema: propSchema,
      };
    });
}

/**
 * Detect body wrapper key from request schema.
 * e.g., { user: { email, first_name } } → "user"
 */
export function getWrapperKey(requestBody?: RequestBody): string | null {
  if (!requestBody) return null;
  const jsonContent = requestBody.content['application/json'];
  if (!jsonContent?.schema) return null;

  return pickWrapperKey(resolveAllOf(jsonContent.schema));
}

/**
 * Pick the object property whose fields become node fields. The remaining top-level
 * properties stay siblings and are sent next to the wrapper. The largest nested object
 * wins, so a second object appearing beside the wrapper does not cancel unwrapping.
 */
function pickWrapperKey(resolved: Schema): string | null {
  if (!resolved.properties) return null;
  const properties = resolved.properties;
  const sizeOf = (key: string): number => {
    const inner = resolveAllOf(properties[key]);
    return inner.properties ? Object.keys(inner.properties).length : 0;
  };
  const objectKeys = Object.keys(properties).filter((k) => sizeOf(k) > 0);
  if (objectKeys.length === 0) return null;
  return objectKeys.reduce((best, key) => (sizeOf(key) > sizeOf(best) ? key : best));
}
