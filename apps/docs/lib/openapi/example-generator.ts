import type { Schema, RequestBody, Response, Parameter } from './types';

/**
 * Options for controlling example generation.
 *
 * - `requiredOnly` — only include required properties in objects (for minimal request bodies)
 * - `minimal` — use null for nullable fields and [] for optional arrays (for compact responses)
 */
export interface ExampleOptions {
  requiredOnly?: boolean;
  minimal?: boolean;
}

/**
 * Generate example JSON from OpenAPI schema
 */
export function generateExample(
  schema: Schema | undefined,
  depth = 0,
  options: ExampleOptions = {}
): unknown {
  if (!schema || depth > 5) {
    return undefined;
  }

  // Используем явно указанный example
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Handle allOf - слияние всех схем (не увеличиваем depth — это не реальная вложенность)
  if (schema.allOf) {
    const merged: Record<string, unknown> = {};
    let primitiveResult: unknown = undefined;
    for (const subSchema of schema.allOf) {
      const example = generateExample(subSchema as Schema, depth, options);
      if (example && typeof example === 'object' && !Array.isArray(example)) {
        Object.assign(merged, example);
      } else if (example !== undefined) {
        primitiveResult = example;
      }
    }
    if (Object.keys(merged).length > 0) return merged;
    if (primitiveResult !== undefined) return primitiveResult;
    if (schema.default !== undefined) return schema.default;
    return undefined;
  }

  // Handle oneOf / anyOf - берем первый вариант (не увеличиваем depth — это обёртка)
  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf || schema.anyOf;
    if (variants && variants.length > 0) {
      return generateExample(variants[0] as Schema, depth, options);
    }
  }

  // Обрабатываем по типу
  switch (schema.type) {
    case 'object':
      if (schema.properties) {
        const example: Record<string, unknown> = {};
        const requiredFields = schema.required || [];

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const ps = propSchema as Schema;

          // requiredOnly: skip non-required properties
          if (options.requiredOnly && !requiredFields.includes(propName)) {
            continue;
          }

          // minimal: nullable fields → null
          if (options.minimal && ps.nullable) {
            example[propName] = null;
            continue;
          }

          // minimal: optional arrays → []
          if (options.minimal && ps.type === 'array' && !requiredFields.includes(propName)) {
            example[propName] = [];
            continue;
          }

          const propExample = generateExample(ps, depth + 1, options);
          // Включаем свойство если оно обязательное или имеет пример
          if (propExample !== undefined || requiredFields.includes(propName)) {
            example[propName] = propExample !== undefined ? propExample : null;
          }
        }
        return Object.keys(example).length > 0 ? example : {};
      }

      // Если есть additionalProperties (Record<T>)
      if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
        const additionalExample = generateExample(
          schema.additionalProperties as Schema,
          depth + 1,
          options
        );
        if (additionalExample !== undefined) {
          const recordKey = schema['x-record-key-example'] || 'key';
          return { [recordKey]: additionalExample };
        }
      }

      return {};

    case 'array':
      if (schema.items) {
        const items = schema.items as Schema;
        // Если элементы массива — union (oneOf/anyOf), показываем по примеру каждого варианта
        const unionOptions = items.oneOf || items.anyOf;
        if (unionOptions && unionOptions.length > 1) {
          const examples = unionOptions
            .map((opt) => generateExample(opt as Schema, depth, options))
            .filter((ex) => ex !== undefined);
          return examples.length > 0 ? examples : [];
        }
        const itemExample = generateExample(items, depth + 1, options);
        return itemExample !== undefined ? [itemExample] : [];
      }
      return [];

    case 'string':
      // Проверяем format
      if (schema.format === 'date-time') {
        return '2024-04-08T10:00:00.000Z';
      }
      if (schema.format === 'date') {
        return '2024-04-08';
      }
      if (schema.format === 'time') {
        return '10:00:00';
      }
      if (schema.format === 'uri') {
        return 'https://example.com';
      }
      if (schema.format === 'binary') {
        return '0101010101010101';
      }

      // Проверяем enum
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }

      // Проверяем default
      if (schema.default !== undefined) {
        return schema.default;
      }

      // Генерация на основе описания (только для полей без format)
      if (schema.description) {
        const desc = schema.description.toLowerCase();
        if (desc.includes('email') || desc.includes('почт')) {
          return 'user@example.com';
        }
        if (desc.includes('emoji')) {
          if (desc.includes('реакци') || desc.includes('символ')) {
            return '👍';
          }
          return '🎮';
        }
        if (desc.includes('статус')) {
          if (desc.includes('текст')) {
            return 'Очень занят';
          }
          return '🎮';
        }
        if (desc.includes('title') || desc.includes('название') || desc.includes('текст')) {
          return 'Пример текста';
        }
        if (desc.includes('name') || desc.includes('имя')) {
          return 'Иван Иванов';
        }
        if (desc.includes('url') || desc.includes('ссылк')) {
          return 'https://example.com';
        }
        if (desc.includes('token') || desc.includes('ключ')) {
          return 'your_api_token_here';
        }
        if (desc.includes('content') || desc.includes('содержимое') || desc.includes('сообщени')) {
          return 'Привет! Это тестовое сообщение.';
        }
        if (desc.includes('phone') || desc.includes('телефон')) {
          return '+7 (999) 123-45-67';
        }
      }

      return 'string';

    case 'number':
    case 'integer':
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if (schema.default !== undefined) {
        return schema.default;
      }
      if (schema.minimum !== undefined) {
        return schema.minimum;
      }

      // Генерация на основе описания
      if (schema.description) {
        const desc = schema.description.toLowerCase();
        if (desc.includes('id') || desc.includes('идентификатор')) {
          return 12345;
        }
        if (desc.includes('page') || desc.includes('страниц')) {
          return 1;
        }
        if (desc.includes('limit') || desc.includes('количество')) {
          return 50;
        }
        if (desc.includes('count') || desc.includes('счет')) {
          return 10;
        }
        if (desc.includes('age') || desc.includes('возраст')) {
          return 25;
        }
        if (desc.includes('price') || desc.includes('цена') || desc.includes('стоимость')) {
          return 99.99;
        }
      }

      return schema.type === 'integer' ? 100 : 123.45;

    case 'boolean':
      if (schema.default !== undefined) {
        return schema.default;
      }
      return true;

    case 'null':
      return null;

    default:
      // Если тип не указан, но есть properties - это объект
      if (schema.properties) {
        return generateExample({ ...schema, type: 'object' }, depth);
      }
      // Если тип не указан, но есть items - это массив
      if (schema.items) {
        return generateExample({ ...schema, type: 'array' }, depth);
      }
      return undefined;
  }
}

/**
 * Generate request body example from schema
 */
export function generateRequestExample(
  requestBody: RequestBody | undefined,
  options?: ExampleOptions
): unknown {
  if (!requestBody) {
    return undefined;
  }

  const content =
    requestBody.content['application/json'] || requestBody.content['multipart/form-data'];
  if (!content?.schema) {
    return undefined;
  }

  return generateExample(content.schema, 0, options);
}

/**
 * Generate response example from schema
 */
export function generateResponseExample(
  response: Response | undefined,
  options?: ExampleOptions
): unknown {
  if (!response) {
    return undefined;
  }

  const jsonContent = response.content?.['application/json'];
  if (!jsonContent?.schema) {
    return undefined;
  }

  return generateExample(jsonContent.schema, 0, options);
}

/**
 * Generate parameter example from Parameter object
 */
export function generateParameterExample(parameter: Parameter | undefined): unknown {
  if (!parameter) {
    return 'value';
  }

  if (parameter.example !== undefined) {
    return parameter.example;
  }

  if (parameter.schema) {
    const schemaWithDescription = {
      ...parameter.schema,
      description: parameter.schema.description || parameter.description,
    };
    const example = generateExample(schemaWithDescription);
    return example !== undefined ? example : 'value';
  }

  return 'value';
}

/**
 * Multipart form field descriptor
 */
export interface MultipartField {
  name: string;
  value: string;
  isFile: boolean;
}

/**
 * Extract wire name from description pattern "Параметр X, полученный..."
 * Falls back to the schema property name if no match.
 */
function extractWireName(description: string | undefined, fallback: string): string {
  if (description) {
    const match = description.match(/^Параметр\s+(\S+?)(?:,|\s|$)/);
    if (match) return match[1];
  }
  return fallback;
}

// Example values for upload parameters (from POST /uploads response).
// Needed because TypeSpec @opExample / @example don't work with HttpPart<T>.
const UPLOAD_FIELD_EXAMPLES: Record<string, string> = {
  'Content-Disposition': 'attachment',
  acl: 'private',
  policy: 'eyJloNBpcmF0aW9u...',
  'x-amz-credential': '286471_server/20211122/kz-6x/s3/aws4_request',
  'x-amz-algorithm': 'AWS4-HMAC-SHA256',
  'x-amz-date': '20211122T065734Z',
  'x-amz-signature': '87e8f3ba4083c937c0e891d7a11tre932d8c33cg4bacf5380bf27624c1ok1475',
  key: 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/$filename',
};

/**
 * Generate multipart form-data field list from request body schema.
 * Returns field descriptors with wire names, example values, and file flags.
 */
export function generateMultipartExample(
  requestBody: RequestBody | undefined
): MultipartField[] | undefined {
  if (!requestBody) return undefined;

  const multipartContent = requestBody.content['multipart/form-data'];
  const properties = multipartContent?.schema?.properties;
  if (!properties) return undefined;

  const fields: MultipartField[] = [];

  for (const [propName, propSchema] of Object.entries(properties)) {
    const schema = propSchema as Schema;
    const isFile = schema.format === 'binary';

    if (isFile) {
      fields.push({ name: propName, value: 'filename.png', isFile: true });
      continue;
    }

    // Wire name: schema.example description "Параметр X" → X, fallback to propName
    const wireName = extractWireName(schema.description, propName);

    // Value priority: schema.example > known upload examples > generateExample
    let value: string;
    if (schema.example !== undefined) {
      value = String(schema.example);
    } else if (UPLOAD_FIELD_EXAMPLES[wireName]) {
      value = UPLOAD_FIELD_EXAMPLES[wireName];
    } else {
      const ex = generateExample(schema);
      value = String(ex ?? 'string');
    }

    fields.push({ name: wireName, value, isFile: false });
  }

  return fields.length > 0 ? fields : undefined;
}
