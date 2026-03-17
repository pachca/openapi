import type { Endpoint, Schema, Response } from './openapi/types';
import { generateRequestExample, generateResponseExample } from './openapi/example-generator';
import { generateCurl } from './code-generators/curl';
import { generateTitle, getDescriptionWithoutTitle } from './openapi/mapper';
import { getGuideContent } from './content-loader';
import { expandMdxComponents } from './mdx-expander';

/**
 * Resolve property schema - unwrap allOf and get the actual schema
 */
function resolveSchema(schema: Schema): Schema {
  if (!schema) return schema;

  // If schema has allOf with items, merge them
  if (schema.allOf && schema.allOf.length > 0) {
    let merged: Schema = {};
    for (const subSchema of schema.allOf) {
      const resolved = resolveSchema(subSchema);
      merged = { ...merged, ...resolved };
      // Merge required arrays
      if (resolved.required) {
        merged.required = [...(merged.required || []), ...resolved.required];
      }
    }
    // Preserve description from original
    if (schema.description) {
      merged.description = schema.description;
    }
    return merged;
  }
  return schema;
}

/**
 * Convert OpenAPI Schema to markdown format
 * Unified function used for both API methods and guide pages
 */
export function schemaToMarkdown(
  schema: Schema,
  depth: number = 0,
  requiredFields: string[] = [],
  includeExamples: boolean = false
): string {
  if (!schema || depth > 5) {
    return '';
  }

  // Resolve allOf at top level
  const resolvedSchema = resolveSchema(schema);

  let content = '';
  const indent = '  '.repeat(depth);

  // Handle anyOf/oneOf at top level
  if (resolvedSchema.anyOf || resolvedSchema.oneOf) {
    const variants = resolvedSchema.anyOf || resolvedSchema.oneOf;
    const variantType = resolvedSchema.anyOf ? 'anyOf' : 'oneOf';
    content += `${indent}**${variantType}** - один из вариантов:\n\n`;
    variants?.forEach((variant: Schema, index: number) => {
      const resolvedVariant = resolveSchema(variant);
      const variantName = variant.$ref
        ? variant.$ref.split('/').pop()
        : resolvedVariant.title || `Вариант ${index + 1}`;
      content += `${indent}- **${variantName}**`;
      if (resolvedVariant.description) {
        content += `: ${resolvedVariant.description}`;
      }
      content += '\n';
      if (resolvedVariant.properties) {
        content += schemaToMarkdown(
          resolvedVariant,
          depth + 1,
          resolvedVariant.required || [],
          includeExamples
        );
      }
    });
    return content;
  }

  // Handle object properties
  if ((resolvedSchema.type === 'object' || !resolvedSchema.type) && resolvedSchema.properties) {
    for (const [propName, propSchema] of Object.entries(resolvedSchema.properties)) {
      const rawProp = propSchema as Schema;
      const prop = resolveSchema(rawProp);
      const isRequired =
        requiredFields.includes(propName) || resolvedSchema.required?.includes(propName);
      // Check for anyOf/oneOf on property level
      const hasUnion = prop.anyOf || prop.oneOf;

      // Check for Record type (additionalProperties)
      const hasAdditionalProperties =
        prop.type === 'object' &&
        prop.additionalProperties &&
        typeof prop.additionalProperties !== 'boolean';

      // Determine type info
      let typeInfo = '';
      if (hasUnion) {
        typeInfo = prop.anyOf ? 'anyOf' : 'oneOf';
      } else if (hasAdditionalProperties) {
        typeInfo = 'Record<string, object>';
      } else if (Array.isArray(prop.type)) {
        typeInfo = prop.type.join(' | ');
      } else if (prop.type === 'array' && prop.items) {
        const items = prop.items;
        if (items.anyOf || items.oneOf) {
          typeInfo = 'array (union)';
        } else {
          const itemType = items.type || 'object';
          typeInfo = `array of ${itemType}`;
        }
      } else {
        typeInfo = prop.type || 'object';
      }

      // Use self-describing format as the type when base is string
      if (prop.format && SELF_DESCRIBING_FORMATS.has(prop.format) && prop.type === 'string') {
        typeInfo = prop.format;
      } else if (prop.format) {
        typeInfo += `, ${prop.format}`;
      }

      // Handle enum — inline values into type
      const enumValues = prop.enum as unknown[] | undefined;
      const hasEnum = enumValues && enumValues.length > 0;

      // Build field line: `name: type` (required) — description. Constraints inline.
      const description = prop.description || rawProp.description || '';
      const meta: string[] = [];
      if (isRequired) meta.push('required');
      if (prop.default !== undefined) {
        const defaultStr =
          typeof prop.default === 'string' ? prop.default : JSON.stringify(prop.default);
        meta.push(`default: ${defaultStr}`);
      }
      // Inline constraints
      if (prop.maxLength !== undefined) meta.push(`max length: ${prop.maxLength}`);
      if (prop.minLength !== undefined) meta.push(`min length: ${prop.minLength}`);
      if (prop.maxItems !== undefined) meta.push(`max items: ${prop.maxItems}`);
      if (prop.minimum !== undefined) meta.push(`min: ${prop.minimum}`);
      if (prop.maximum !== undefined) meta.push(`max: ${prop.maximum}`);

      const metaStr = meta.length > 0 ? ` (${meta.join(', ')})` : '';
      content += `${indent}- \`${propName}: ${typeInfo}\`${metaStr}`;
      if (description) {
        content += ` — ${description}`;
      }
      if (includeExamples && prop.example !== undefined) {
        const ex =
          typeof prop.example === 'string' ? `"${prop.example}"` : JSON.stringify(prop.example);
        content += `. Пример: \`${ex}\``;
      }
      content += '\n';

      // Add enum values with descriptions
      if (hasEnum && prop['x-enum-descriptions']) {
        const enumDescriptions = prop['x-enum-descriptions'] as Record<string, string>;
        content += `${indent}  Значения: `;
        const parts: string[] = [];
        for (const enumValue of enumValues) {
          const enumKey = String(enumValue);
          const enumDesc = enumDescriptions[enumKey] || '';
          parts.push(enumDesc ? `\`${enumKey}\` — ${enumDesc}` : `\`${enumKey}\``);
        }
        content += parts.join(', ') + '\n';
      } else if (hasEnum) {
        content += `${indent}  Значения: ${enumValues.map((v) => `\`${String(v)}\``).join(', ')}\n`;
      }

      // Handle anyOf/oneOf on property level
      if (hasUnion) {
        const variants = prop.anyOf ?? prop.oneOf ?? [];
        content += `${indent}  **Возможные варианты:**\n\n`;
        for (const variant of variants) {
          const resolvedVariant = resolveSchema(variant);
          const variantName = variant.$ref
            ? variant.$ref.split('/').pop()
            : resolvedVariant.title || 'Вариант';
          content += `${indent}  - **${variantName}**`;
          if (resolvedVariant.description) {
            content += `: ${resolvedVariant.description}`;
          }
          content += '\n';
          if (resolvedVariant.properties) {
            content += schemaToMarkdown(
              resolvedVariant,
              depth + 2,
              resolvedVariant.required || [],
              includeExamples
            );
          }
        }
      }
      // Handle nested objects
      else if (prop.type === 'object' && prop.properties) {
        content += schemaToMarkdown(prop, depth + 1, prop.required || [], includeExamples);
      }
      // Handle Record types (additionalProperties)
      else if (hasAdditionalProperties) {
        const valueSchema = prop.additionalProperties as Schema;
        content += `${indent}  **Структура значений Record:**\n`;
        if (valueSchema.properties) {
          content += schemaToMarkdown(
            valueSchema,
            depth + 1,
            valueSchema.required || [],
            includeExamples
          );
        } else if (valueSchema.type) {
          content += `${indent}  - Тип значения: \`${valueSchema.type}\`\n`;
          if (valueSchema.description) {
            content += `${indent}    ${valueSchema.description}\n`;
          }
        } else {
          // Record<unknown> или пустой additionalProperties
          content += `${indent}  - Тип значения: \`any\`\n`;
        }
      }
      // Handle arrays
      else if (prop.type === 'array' && prop.items) {
        const items = prop.items;

        // Check if items has anyOf/oneOf (union type)
        if (items.anyOf || items.oneOf) {
          const variants = items.anyOf ?? items.oneOf ?? [];
          content += `${indent}  **Возможные типы элементов:**\n\n`;
          for (const variant of variants) {
            const resolvedVariant = resolveSchema(variant);
            const variantName = variant.$ref
              ? variant.$ref.split('/').pop()
              : resolvedVariant.title || 'Тип';
            content += `${indent}  - **${variantName}**`;
            if (resolvedVariant.description) {
              content += `: ${resolvedVariant.description}`;
            }
            content += '\n';
            if (resolvedVariant.properties) {
              content += schemaToMarkdown(
                resolvedVariant,
                depth + 2,
                resolvedVariant.required || []
              );
            }
          }
        } else if (items.type === 'object' && items.properties) {
          content += schemaToMarkdown(items, depth + 1, items.required || [], includeExamples);
        }
      }
    }
  }

  return content;
}

/** Well-known formats that replace the base type (e.g. "date" instead of "string, date") */
const SELF_DESCRIBING_FORMATS = new Set(['date', 'date-time', 'uri', 'email', 'uuid', 'binary']);

/** Format parameter type string, e.g. "integer" or "date" */
function formatParamType(schema?: Schema): string {
  if (!schema) return 'string';
  const base = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type || 'string';
  if (schema.format && SELF_DESCRIBING_FORMATS.has(schema.format)) return schema.format;
  if (schema.format) return `${base}, ${schema.format}`;
  return base;
}

/**
 * Format parameters section for markdown
 */
function formatParameters(endpoint: Endpoint): string {
  if (!endpoint.parameters || endpoint.parameters.length === 0) {
    return '';
  }

  let content = '\n## Параметры\n\n';

  // Group by location
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  const headerParams = endpoint.parameters.filter((p) => p.in === 'header');

  if (pathParams.length > 0) {
    content += '### Path параметры\n\n';
    for (const param of pathParams) {
      const type = formatParamType(param.schema);
      const meta = param.required ? ' (required)' : '';
      const description = param.description || '';
      content += `- \`${param.name}: ${type}\`${meta}`;
      if (description) content += ` — ${description}`;
      content += '\n';
    }
    content += '\n';
  }

  if (queryParams.length > 0) {
    content += '### Query параметры\n\n';
    for (const param of queryParams) {
      const type = formatParamType(param.schema);
      const meta: string[] = [];
      if (param.required) meta.push('required');
      if (param.schema?.default !== undefined) meta.push(`default: ${param.schema.default}`);
      const metaStr = meta.length > 0 ? ` (${meta.join(', ')})` : '';
      const description = param.description || '';
      content += `- \`${param.name}: ${type}\`${metaStr}`;
      if (description) content += ` — ${description}`;
      content += '\n';
      if (param.schema?.enum) {
        content += `  Значения: ${param.schema.enum.map((v: unknown) => `\`${String(v)}\``).join(', ')}\n`;
      }
    }
    content += '\n';
  }

  if (headerParams.length > 0) {
    content += '### Header параметры\n\n';
    for (const param of headerParams) {
      const type = formatParamType(param.schema);
      const meta = param.required ? ' (required)' : '';
      const description = param.description || '';
      content += `- \`${param.name}: ${type}\`${meta}`;
      if (description) content += ` — ${description}`;
      content += '\n';
    }
    content += '\n';
  }

  return content;
}

/**
 * Format request body section for markdown
 */
function formatRequestBody(endpoint: Endpoint): string {
  if (!endpoint.requestBody) {
    return '';
  }

  let content = '\n## Тело запроса\n\n';

  const jsonContent = endpoint.requestBody.content?.['application/json'];
  if (jsonContent?.schema) {
    const required = endpoint.requestBody.required ? '**Обязательно**' : '**Опционально**';
    content += `${required}\n\n`;

    if (endpoint.requestBody.description) {
      content += `${endpoint.requestBody.description}\n\n`;
    }

    content += 'Формат: `application/json`\n\n';

    // Format schema structure
    content += '### Схема\n\n';
    const schemaFormatted = schemaToMarkdown(
      jsonContent.schema,
      0,
      jsonContent.schema.required || []
    );
    if (schemaFormatted) {
      content += schemaFormatted;
      content += '\n';
    }

    // Generate example
    const example = generateRequestExample(endpoint.requestBody);
    if (example) {
      content += '### Пример\n\n';
      content += '```json\n';
      content += JSON.stringify(example, null, 2);
      content += '\n```\n';
    }
  }

  return content;
}

/**
 * Format responses section for markdown
 */
function formatResponses(endpoint: Endpoint): string {
  if (!endpoint.responses || Object.keys(endpoint.responses).length === 0) {
    return '';
  }

  let content = '\n## Ответы\n\n';

  for (const [statusCode, response] of Object.entries(endpoint.responses)) {
    const resp = response as Response;
    content += `### ${statusCode}: ${resp.description}\n\n`;

    const jsonContent = resp.content?.['application/json'];

    // Add response schema and example for success codes (2xx)
    if (statusCode.startsWith('2')) {
      // Format schema
      if (jsonContent?.schema) {
        content += '**Схема ответа:**\n\n';
        const schemaFormatted = schemaToMarkdown(
          jsonContent.schema,
          0,
          jsonContent.schema.required || []
        );
        if (schemaFormatted) {
          content += schemaFormatted;
          content += '\n';
        }
      }

      // Add example
      const example = generateResponseExample(resp);
      if (example) {
        content += '**Пример ответа:**\n\n';
        content += '```json\n';
        content += JSON.stringify(example, null, 2);
        content += '\n```\n\n';
      }
    }
    // Add response schema for error codes (4xx, 5xx)
    else if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
      // Format error schema if available
      if (jsonContent?.schema) {
        content += '**Схема ответа при ошибке:**\n\n';
        const schemaFormatted = schemaToMarkdown(
          jsonContent.schema,
          0,
          jsonContent.schema.required || []
        );
        if (schemaFormatted) {
          content += schemaFormatted;
          content += '\n';
        }

        // Add example for error response
        const example = generateResponseExample(resp);
        if (example) {
          content += '**Пример ответа:**\n\n';
          content += '```json\n';
          content += JSON.stringify(example, null, 2);
          content += '\n```\n\n';
        }
      }
    }
  }

  return content;
}

/**
 * Generate markdown content for an API endpoint
 * Shows original description from OpenAPI without tag transformation
 * @param endpoint - The endpoint to generate markdown for
 * @param baseUrl - Base URL from OpenAPI servers (optional, defaults to first server)
 */
export function generateEndpointMarkdown(endpoint: Endpoint, baseUrl?: string): string {
  const title = generateTitle(endpoint);
  const description = getDescriptionWithoutTitle(endpoint);

  let content = `# ${title}\n\n`;
  content += `**Метод**: \`${endpoint.method}\`\n\n`;
  content += `**Путь**: \`${endpoint.path}\`\n\n`;

  // Requirements
  if (endpoint.requirements) {
    const { scope, plan, auth } = endpoint.requirements;
    const planNames: Record<string, string> = { corporation: 'Корпорация' };

    if (auth === false) {
      content += `> Авторизация не требуется\n\n`;
    }
    if (scope) {
      content += `> **Скоуп:** \`${scope}\`\n\n`;
    }
    if (plan) {
      content += `> **Внимание:** Доступно только на тарифе **${planNames[plan] ?? plan}**\n\n`;
    }
  }

  if (description) {
    content += description + '\n';
  }

  content += formatParameters(endpoint);
  content += formatRequestBody(endpoint);

  // Add code example (cURL only — agents can derive other languages from it)
  content += '\n## Пример запроса\n\n';
  content += '```bash\n';
  content += generateCurl(endpoint, baseUrl);
  content += '\n```\n';

  content += formatResponses(endpoint);

  return content;
}

/**
 * Generate markdown for a static page
 * Loads content from MDX/MD files in content/ directory
 */
export async function generateStaticPageMarkdownAsync(pagePath: string): Promise<string | null> {
  // Convert path to content file path
  // "/" -> "home", "/updates" -> "updates", "/api/authorization" -> "api/authorization"
  let contentPath = pagePath;
  if (pagePath === '/') {
    contentPath = 'home';
  } else if (pagePath === '/updates') {
    contentPath = 'updates';
  } else if (pagePath.startsWith('/guides/')) {
    contentPath = pagePath.replace('/guides/', '');
  } else if (pagePath.startsWith('/api/')) {
    contentPath = pagePath.slice(1); // Keep "api/..." prefix
  }

  // Load markdown/mdx file for this path
  const fileContent = getGuideContent(contentPath);
  if (fileContent) {
    // Expand MDX components to their markdown representation
    return await expandMdxComponents(fileContent);
  }

  return null;
}
