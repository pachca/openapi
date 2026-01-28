import type { Schema, MediaType, Example } from './types';

/**
 * Generate example JSON from OpenAPI schema
 */
export function generateExample(schema: Schema | undefined, depth = 0): any {
  if (!schema || depth > 5) {
    return undefined;
  }

  // Используем явно указанный example
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Handle allOf - слияние всех схем
  if (schema.allOf) {
    const merged: any = {};
    for (const subSchema of schema.allOf) {
      const example = generateExample(subSchema as Schema, depth + 1);
      if (example && typeof example === 'object' && !Array.isArray(example)) {
        Object.assign(merged, example);
      }
    }
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  // Handle oneOf / anyOf - берем первый вариант
  if (schema.oneOf || schema.anyOf) {
    const options = schema.oneOf || schema.anyOf;
    if (options && options.length > 0) {
      return generateExample(options[0] as Schema, depth + 1);
    }
  }

  // Обрабатываем по типу
  switch (schema.type) {
    case 'object':
      if (schema.properties) {
        const example: any = {};
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

      // Если есть additionalProperties
      if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
        const additionalExample = generateExample(schema.additionalProperties as Schema, depth + 1);
        if (additionalExample !== undefined) {
          return { key: additionalExample };
        }
      }

      return {};

    case 'array':
      if (schema.items) {
        const itemExample = generateExample(schema.items as Schema, depth + 1);
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
 * Generate request body example
 * Использует ТОЛЬКО явные примеры из OpenAPI метода (example/examples)
 * НЕ генерирует примеры из схемы
 */
export function generateRequestExample(requestBody: any): any {
  if (!requestBody) {
    return undefined;
  }

  const jsonContent = requestBody.content?.['application/json'];
  if (!jsonContent) {
    return undefined;
  }

  // Приоритет 1: явный example на уровне метода
  if (jsonContent.example !== undefined) {
    return jsonContent.example;
  }

  // Приоритет 2: первый из examples на уровне метода
  if (jsonContent.examples) {
    const exampleKeys = Object.keys(jsonContent.examples);
    if (exampleKeys.length > 0) {
      const firstExample = jsonContent.examples[exampleKeys[0]];
      if (firstExample.value !== undefined) {
        return firstExample.value;
      }
    }
  }

  // НЕ генерируем из схемы - возвращаем undefined
  return undefined;
}

/**
 * Generate response example
 * Использует ТОЛЬКО явные примеры из OpenAPI метода (example/examples)
 * НЕ генерирует примеры из схемы
 */
export function generateResponseExample(response: any): any {
  if (!response) {
    return undefined;
  }

  const jsonContent = response.content?.['application/json'];
  if (!jsonContent) {
    return undefined;
  }

  // Приоритет 1: явный example на уровне метода
  if (jsonContent.example !== undefined) {
    return jsonContent.example;
  }

  // Приоритет 2: первый из examples на уровне метода
  if (jsonContent.examples) {
    const exampleKeys = Object.keys(jsonContent.examples);
    if (exampleKeys.length > 0) {
      const firstExample = jsonContent.examples[exampleKeys[0]];
      if (firstExample.value !== undefined) {
        return firstExample.value;
      }
    }
  }

  // НЕ генерируем из схемы - возвращаем undefined
  return undefined;
}

/**
 * Generate parameter example from Parameter object
 */
export function generateParameterExample(parameter: any): any {
  if (!parameter) {
    return 'value';
  }

  // Приоритет: явный example > первый из examples > генерация из схемы
  if (parameter.example !== undefined) {
    return parameter.example;
  }

  if (parameter.examples) {
    const exampleKeys = Object.keys(parameter.examples);
    if (exampleKeys.length > 0) {
      const firstExample = parameter.examples[exampleKeys[0]];
      if (firstExample.value !== undefined) {
        return firstExample.value;
      }
    }
  }

  // Генерация из схемы
  if (parameter.schema) {
    // Если у схемы нет описания, но есть описание параметра, используем его
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
 * Get all available examples from a MediaType object
 * Возвращает ТОЛЬКО явные примеры из OpenAPI метода
 * НЕ генерирует примеры из схемы
 */
export function getAllExamples(mediaType: MediaType): Record<string, any> {
  const examples: Record<string, any> = {};

  // Добавляем одиночный example
  if (mediaType.example !== undefined) {
    examples['default'] = mediaType.example;
  }

  // Добавляем множественные examples
  if (mediaType.examples) {
    for (const [name, example] of Object.entries(mediaType.examples)) {
      if (example.value !== undefined) {
        examples[name] = example.value;
      }
    }
  }

  // НЕ генерируем из схемы - возвращаем только явные примеры
  return examples;
}
