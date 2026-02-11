/**
 * Shared schema definitions for guide pages
 * Used by both mdx-components.tsx (React) and mdx-expander.ts (Markdown)
 *
 * These schemas are NOT in OpenAPI spec - they are custom documentation schemas
 * for guide pages like DLP, Export, Forms, etc.
 *
 * To add a new schema:
 * 1. Create a JSON file in lib/schemas/guides/ with the schema name (e.g., MySchema.json)
 * 2. The file should have { "title": "...", "schema": { ... } } structure
 * 3. Use <SchemaBlock name="MySchema" /> in MDX files
 * That's it! The filename becomes the schema name automatically.
 */

import fs from 'fs';
import path from 'path';
import type { Schema } from '../openapi/types';

// ============================================
// Types
// ============================================

export interface GuideSchemaEntry {
  schema: Schema;
  title: string;
}

interface GuideSchemaFile {
  title: string;
  schema: Schema;
}

// ============================================
// Load schemas from JSON files
// ============================================

const GUIDES_DIR = path.join(process.cwd(), 'lib/schemas/guides');

function loadGuideSchemasFromFiles(): Record<string, GuideSchemaEntry> {
  const schemas: Record<string, GuideSchemaEntry> = {};

  // Check if directory exists
  if (!fs.existsSync(GUIDES_DIR)) {
    console.warn(`Guide schemas directory not found: ${GUIDES_DIR}`);
    return schemas;
  }

  // Read all JSON files from the guides directory
  const files = fs.readdirSync(GUIDES_DIR).filter((file) => file.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(GUIDES_DIR, file);
    const schemaName = file.replace('.json', ''); // filename = schema name

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data: GuideSchemaFile = JSON.parse(content);

      schemas[schemaName] = {
        schema: data.schema,
        title: data.title,
      };
    } catch (error) {
      console.error(`Error loading schema from ${file}:`, error);
    }
  }

  return schemas;
}

// ============================================
// Guide Schemas Registry
// ============================================

/**
 * Unified registry of all guide schemas
 * Automatically loaded from JSON files in lib/schemas/guides/
 */
export const GUIDE_SCHEMAS: Record<string, GuideSchemaEntry> = loadGuideSchemasFromFiles();

/**
 * Get a guide schema by name
 */
export function getGuideSchema(name: string): GuideSchemaEntry | undefined {
  return GUIDE_SCHEMAS[name];
}

/**
 * Get all guide schema names (for indexing)
 */
export function getAllGuideSchemaNames(): string[] {
  return Object.keys(GUIDE_SCHEMAS);
}

// ============================================
// HTTP Codes (shared data, not a schema)
// ============================================

export const HTTP_CODES = [
  { code: '200', message: 'OK', description: 'Запрос отработал как положено, без ошибок' },
  { code: '201', message: 'Created', description: 'Запрос отработал успешно, сущность создана' },
  {
    code: '204',
    message: 'No Content',
    description:
      'Запрос отработал успешно, тело ответа отсутствует (например, при удалении ресурса)',
  },
  {
    code: '301',
    message: 'Moved Permanently',
    description:
      'Запрошенный ресурс был на постоянной основе перемещён в новое месторасположение (такой ответ вы можете получить если выполните запрос по протоколу HTTP, а не по HTTPS)',
  },
  {
    code: '302',
    message: 'Found',
    description:
      'Перенаправление на другой URL (например, при скачивании файла экспорта — в заголовке Location будет временная ссылка на файл)',
  },
  {
    code: '400',
    message: 'Bad Request',
    description: 'Неприемлемый запрос (часто из-за отсутствия обязательного параметра)',
  },
  {
    code: '401',
    message: 'Unauthorized',
    description: 'Предоставлен недействительный токен доступа',
  },
  {
    code: '402',
    message: 'Payment Required',
    description: 'Параметры действительны, но запрос не выполнен',
  },
  {
    code: '403',
    message: 'Forbidden',
    description: 'Предоставленный токен доступа не имеет разрешений на выполнение запроса',
  },
  { code: '404', message: 'Not Found', description: 'Запрашиваемый ресурс не существует' },
  {
    code: '409',
    message: 'Conflict',
    description:
      'Запрос конфликтует с другим запросом (возможно, из-за использования того же идемпотентного ключа)',
  },
  {
    code: '410',
    message: 'Gone',
    description: 'Ресурс больше не доступен (например, истёк срок действия идентификатора события)',
  },
  {
    code: '422',
    message: 'Unprocessable Entity',
    description:
      'С запросом все хорошо, но правила сервиса не позволяют его обработать (например, при попытке создания контакта с уже существующим номером телефона в базе)',
  },
  {
    code: '429',
    message: 'Too Many Requests',
    description: 'Слишком много запросов слишком быстро попадают в API',
  },
  {
    code: '500, 502, 503, 504',
    message: 'Server Errors',
    description: 'Что-то пошло не так на сервере Пачки (это редкость)',
  },
];
