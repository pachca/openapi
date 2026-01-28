import type { Endpoint, Schema } from './openapi/types';
import { generateRequestExample, generateResponseExample } from './openapi/example-generator';
import { generateCurl } from './code-generators/curl';
import { generateJavaScript } from './code-generators/javascript';
import { generatePython } from './code-generators/python';
import { generateRuby } from './code-generators/ruby';
import { generatePHP } from './code-generators/php';
import { generateNodeJS } from './code-generators/nodejs';
import { generateTitle, getDescriptionWithoutTitle } from './openapi/mapper';
import { getGuideContent } from './content-loader';
import { expandMdxComponents } from './mdx-expander';

/**
 * Resolve property schema - unwrap allOf and get the actual schema
 */
function resolveSchema(schema: any): any {
  if (!schema) return schema;

  // If schema has allOf with items, merge them
  if (schema.allOf && schema.allOf.length > 0) {
    let merged: any = {};
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
  requiredFields: string[] = []
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
    variants?.forEach((variant: any, index: number) => {
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
        content += schemaToMarkdown(resolvedVariant, depth + 1, resolvedVariant.required || []);
      }
    });
    return content;
  }

  // Handle object properties
  if ((resolvedSchema.type === 'object' || !resolvedSchema.type) && resolvedSchema.properties) {
    for (const [propName, propSchema] of Object.entries(resolvedSchema.properties)) {
      const rawProp = propSchema as any;
      const prop = resolveSchema(rawProp);
      const isRequired =
        requiredFields.includes(propName) || resolvedSchema.required?.includes(propName);
      const requiredLabel = isRequired ? '**обязательный**' : 'опциональный';

      // Check for anyOf/oneOf on property level
      const hasUnion = prop.anyOf || prop.oneOf;

      // Determine type info
      let typeInfo = '';
      if (hasUnion) {
        typeInfo = prop.anyOf ? 'anyOf' : 'oneOf';
      } else if (Array.isArray(prop.type)) {
        typeInfo = prop.type.join(' | ');
      } else if (prop.type === 'array' && prop.items) {
        const items = prop.items as any;
        if (items.anyOf || items.oneOf) {
          typeInfo = 'array (union)';
        } else {
          const itemType = items.type || 'object';
          typeInfo = `array[${itemType}]`;
        }
      } else {
        typeInfo = prop.type || 'object';
      }

      // Handle enum - will add descriptions below if available
      const hasEnum = prop.enum && prop.enum.length > 0;
      if (hasEnum && !prop['x-enum-descriptions']) {
        // Only inline enum if no descriptions
        typeInfo += ` (enum: ${prop.enum.join(', ')})`;
      }
      if (prop.format) {
        typeInfo += `, ${prop.format}`;
      }

      const description = prop.description || rawProp.description || '';
      content += `${indent}- \`${propName}\` (${typeInfo}, ${requiredLabel})`;
      if (description) {
        content += `: ${description}`;
      }
      content += '\n';

      // Add example if available
      if (prop.example !== undefined) {
        const exampleStr =
          typeof prop.example === 'string' ? prop.example : JSON.stringify(prop.example);
        content += `${indent}  - Пример: \`${exampleStr}\`\n`;
      }

      // Add default value if available
      if (prop.default !== undefined) {
        const defaultStr =
          typeof prop.default === 'string' ? prop.default : JSON.stringify(prop.default);
        content += `${indent}  - По умолчанию: \`${defaultStr}\`\n`;
      }

      // Add constraints
      if (prop.maxLength !== undefined) {
        content += `${indent}  - Максимальная длина: ${prop.maxLength} символов\n`;
      }
      if (prop.minLength !== undefined) {
        content += `${indent}  - Минимальная длина: ${prop.minLength} символов\n`;
      }
      if (prop.maxItems !== undefined) {
        content += `${indent}  - Максимум элементов: ${prop.maxItems}\n`;
      }
      if (prop.minimum !== undefined) {
        content += `${indent}  - Минимум: ${prop.minimum}\n`;
      }
      if (prop.maximum !== undefined) {
        content += `${indent}  - Максимум: ${prop.maximum}\n`;
      }

      // Add enum values with descriptions
      if (hasEnum && prop['x-enum-descriptions']) {
        const enumDescriptions = prop['x-enum-descriptions'] as Record<string, string>;
        content += `${indent}  - **Возможные значения:**\n`;
        for (const enumValue of prop.enum) {
          const enumDesc = enumDescriptions[enumValue] || '';
          if (enumDesc) {
            content += `${indent}    - \`${enumValue}\`: ${enumDesc}\n`;
          } else {
            content += `${indent}    - \`${enumValue}\`\n`;
          }
        }
      } else if (hasEnum) {
        // List enum values without descriptions
        content += `${indent}  - **Возможные значения:** ${prop.enum.map((v: string) => `\`${v}\``).join(', ')}\n`;
      }

      // Handle anyOf/oneOf on property level
      if (hasUnion) {
        const variants = prop.anyOf || prop.oneOf;
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
            content += schemaToMarkdown(resolvedVariant, depth + 2, resolvedVariant.required || []);
          }
        }
      }
      // Handle nested objects
      else if (prop.type === 'object' && prop.properties) {
        content += schemaToMarkdown(prop, depth + 1, prop.required || []);
      }
      // Handle arrays
      else if (prop.type === 'array' && prop.items) {
        const items = prop.items as any;

        // Check if items has anyOf/oneOf (union type)
        if (items.anyOf || items.oneOf) {
          const variants = items.anyOf || items.oneOf;
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
          content += schemaToMarkdown(items, depth + 1, items.required || []);
        }
      }
    }
  }

  return content;
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
      const required = param.required ? '**обязательный**' : 'опциональный';
      const type = param.schema?.type || 'string';
      const description = param.description || '';
      content += `- \`${param.name}\` (${type}, ${required}): ${description}\n`;
      if (param.schema?.example !== undefined) {
        content += `  - Пример: \`${param.schema.example}\`\n`;
      }
    }
    content += '\n';
  }

  if (queryParams.length > 0) {
    content += '### Query параметры\n\n';
    for (const param of queryParams) {
      const required = param.required ? '**обязательный**' : 'опциональный';
      let type = param.schema?.type || 'string';
      if (param.schema?.enum) {
        type += ` (enum: ${param.schema.enum.join(', ')})`;
      }
      const description = param.description || '';
      content += `- \`${param.name}\` (${type}, ${required}): ${description}\n`;
      if (param.schema?.example !== undefined) {
        content += `  - Пример: \`${param.schema.example}\`\n`;
      }
      if (param.schema?.default !== undefined) {
        content += `  - По умолчанию: \`${param.schema.default}\`\n`;
      }
    }
    content += '\n';
  }

  if (headerParams.length > 0) {
    content += '### Header параметры\n\n';
    for (const param of headerParams) {
      const required = param.required ? '**обязательный**' : 'опциональный';
      const type = param.schema?.type || 'string';
      const description = param.description || '';
      content += `- \`${param.name}\` (${type}, ${required}): ${description}\n`;
      if (param.schema?.example !== undefined) {
        content += `  - Пример: \`${param.schema.example}\`\n`;
      }
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
    const resp = response as any;
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

  if (description) {
    // Use original description from OpenAPI without transforming special tags
    content += description + '\n';
  }

  content += formatParameters(endpoint);
  content += formatRequestBody(endpoint);

  // Add code examples in multiple languages
  content += '\n## Примеры запроса\n\n';

  // cURL
  content += '### cURL\n\n';
  content += '```bash\n';
  content += generateCurl(endpoint, baseUrl);
  content += '\n```\n\n';

  // JavaScript
  content += '### JavaScript\n\n';
  content += '```javascript\n';
  content += generateJavaScript(endpoint, baseUrl);
  content += '\n```\n\n';

  // Python
  content += '### Python\n\n';
  content += '```python\n';
  content += generatePython(endpoint, baseUrl);
  content += '\n```\n\n';

  // Node.js
  content += '### Node.js\n\n';
  content += '```javascript\n';
  content += generateNodeJS(endpoint, baseUrl);
  content += '\n```\n\n';

  // Ruby
  content += '### Ruby\n\n';
  content += '```ruby\n';
  content += generateRuby(endpoint, baseUrl);
  content += '\n```\n\n';

  // PHP
  content += '### PHP\n\n';
  content += '```php\n';
  content += generatePHP(endpoint, baseUrl);
  content += '\n```\n';

  content += formatResponses(endpoint);

  return content;
}

/**
 * Generate markdown for a static page
 * Loads content from MDX/MD files in content/ directory
 */
export async function generateStaticPageMarkdownAsync(path: string): Promise<string | null> {
  // Convert path to content file path
  // "/" -> "home", "/guides/forms" -> "forms", etc.
  let contentPath = path;
  if (path === '/') {
    contentPath = 'home';
  } else if (path.startsWith('/guides/')) {
    contentPath = path.replace('/guides/', '');
  }

  // Load markdown/mdx file for this path
  const fileContent = getGuideContent(contentPath);
  if (fileContent) {
    // Expand MDX components to their markdown representation
    return await expandMdxComponents(fileContent);
  }

  return null;
}
