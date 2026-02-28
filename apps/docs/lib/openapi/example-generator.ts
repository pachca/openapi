import type { Schema, RequestBody, Response, Parameter } from './types';

/**
 * Generate example JSON from OpenAPI schema
 */
export function generateExample(schema: Schema | undefined, depth = 0): unknown {
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
      const example = generateExample(subSchema as Schema, depth);
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
    const options = schema.oneOf || schema.anyOf;
    if (options && options.length > 0) {
      return generateExample(options[0] as Schema, depth);
    }
  }

  // Обрабатываем по типу
  switch (schema.type) {
    case 'object':
      if (schema.properties) {
        const example: Record<string, unknown> = {};
        const requiredFields = schema.required || [];

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propExample = generateExample(propSchema as Schema, depth + 1);
          // Включаем свойство если оно обязательное или имеет пример
          if (propExample !== undefined || requiredFields.includes(propName)) {
            example[propName] = propExample !== undefined ? propExample : null;
          }
        }
        return Object.keys(example).length > 0 ? example : {};
      }

      // Если есть additionalProperties (Record<T>)
      if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
        const additionalExample = generateExample(schema.additionalProperties as Schema, depth + 1);
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
            .map((opt) => generateExample(opt as Schema, depth))
            .filter((ex) => ex !== undefined);
          return examples.length > 0 ? examples : [];
        }
        const itemExample = generateExample(items, depth + 1);
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
      if (schema.format === 'email') {
        return 'user@example.com';
      }
      if (schema.format === 'uri' || schema.format === 'url') {
        return 'https://example.com';
      }
      if (schema.format === 'uuid') {
        return '123e4567-e89b-12d3-a456-426614174000';
      }
      if (schema.format === 'ipv4') {
        return '192.168.1.1';
      }
      if (schema.format === 'ipv6') {
        return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      }
      if (schema.format === 'hostname') {
        return 'example.com';
      }
      if (schema.format === 'byte') {
        return 'SGVsbG8gV29ybGQ=';
      }
      if (schema.format === 'binary') {
        return '0101010101010101';
      }
      if (schema.format === 'password') {
        return '********';
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

      // Fallback значения
      if (schema.minLength && schema.minLength > 0) {
        return 'x'.repeat(schema.minLength);
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
export function generateRequestExample(requestBody: RequestBody | undefined): unknown {
  if (!requestBody) {
    return undefined;
  }

  const content =
    requestBody.content['application/json'] || requestBody.content['multipart/form-data'];
  if (!content?.schema) {
    return undefined;
  }

  return generateExample(content.schema);
}

/**
 * Generate response example from schema
 */
export function generateResponseExample(response: Response | undefined): unknown {
  if (!response) {
    return undefined;
  }

  const jsonContent = response.content?.['application/json'];
  if (!jsonContent?.schema) {
    return undefined;
  }

  return generateExample(jsonContent.schema);
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
