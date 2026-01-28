'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { SchemaTree } from './schema-tree';
import type { Schema } from '@/lib/openapi/types';

interface WebhookSchemaSectionProps {
  schema: Schema;
  title?: string;
  initialOpen?: boolean;
  hideHeader?: boolean;
  /** Schema name for matching search navigation (e.g., "MessageWebhookPayload") */
  schemaName?: string;
}

// Проверяет, содержит ли схема параметр с указанным путём
function schemaContainsPath(schema: Schema, targetPath: string, currentPath: string = ''): boolean {
  if (!targetPath) return false;

  // Нормализуем пути для сравнения
  const normalizedTarget = targetPath.replace(/\./g, '-');
  const normalizedCurrent = currentPath.replace(/\[\]/g, '').replace(/\./g, '-');

  // Проверяем совпадение текущего пути
  if (normalizedCurrent && normalizedTarget.startsWith(normalizedCurrent)) {
    return true;
  }

  // Рекурсивно проверяем свойства объекта
  if (schema.properties) {
    for (const propName of Object.keys(schema.properties)) {
      const propPath = currentPath ? `${currentPath}-${propName}` : propName;
      if (normalizedTarget.startsWith(propPath) || normalizedTarget === propPath) {
        return true;
      }
      if (schemaContainsPath(schema.properties[propName], targetPath, propPath)) {
        return true;
      }
    }
  }

  // Проверяем элементы массива
  if (schema.items) {
    const arrayPath = currentPath ? `${currentPath}` : '';
    if (schemaContainsPath(schema.items, targetPath, arrayPath)) {
      return true;
    }
  }

  // Проверяем anyOf/oneOf/allOf
  const variants = schema.anyOf || schema.oneOf || schema.allOf;
  if (variants) {
    for (const variant of variants) {
      if (schemaContainsPath(variant, targetPath, currentPath)) {
        return true;
      }
    }
  }

  return false;
}

// Извлекает путь из param ID
function getPathFromParamId(paramId: string): string {
  return paramId.replace(/^param-/, '');
}

// Разбирает путь на имя схемы и путь к полю
// Формат: "SchemaName___fieldPath" или просто "fieldPath"
// Используем ___ как разделитель, чтобы не конфликтовать с -- для enum значений
function parseSchemaPath(path: string): { schemaName: string | null; fieldPath: string } {
  const separatorIndex = path.indexOf('___');
  if (separatorIndex > 0) {
    return {
      schemaName: path.substring(0, separatorIndex),
      fieldPath: path.substring(separatorIndex + 3),
    };
  }
  return { schemaName: null, fieldPath: path };
}

export function WebhookSchemaSection({
  schema,
  title: propTitle,
  initialOpen = false,
  hideHeader = false,
  schemaName,
}: WebhookSchemaSectionProps) {
  const [isOpen, setIsOpen] = useState(initialOpen || hideHeader);
  const hasAutoOpened = useRef(false);

  const title =
    propTitle || schema.title || (schema.$ref ? schema.$ref.split('/').pop() : 'Payload');
  const type = Array.isArray(schema.type)
    ? schema.type.join(' | ')
    : schema.type || (schema.properties ? 'object' : 'any');

  // Проверяем hash при монтировании и при его изменении
  useEffect(() => {
    if (typeof window === 'undefined' || hideHeader) return;

    const checkAndOpen = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#param-')) {
        const targetPath = getPathFromParamId(hash.slice(1));
        const { schemaName: targetSchemaName, fieldPath } = parseSchemaPath(targetPath);

        // Если в пути указано имя схемы, проверяем совпадение
        if (targetSchemaName) {
          // Открываем только если имя схемы совпадает
          if (
            schemaName &&
            targetSchemaName === schemaName &&
            schemaContainsPath(schema, fieldPath)
          ) {
            setIsOpen(true);
            hasAutoOpened.current = true;
          }
        } else {
          // Старый формат без имени схемы - проверяем по содержимому
          if (schemaContainsPath(schema, targetPath)) {
            setIsOpen(true);
            hasAutoOpened.current = true;
          }
        }
      }
    };

    // Проверяем при монтировании
    checkAndOpen();

    // Слушаем изменения hash
    window.addEventListener('hashchange', checkAndOpen);
    // Слушаем событие навигации к параметру (из поиска)
    window.addEventListener('param-navigation', checkAndOpen);
    return () => {
      window.removeEventListener('hashchange', checkAndOpen);
      window.removeEventListener('param-navigation', checkAndOpen);
    };
  }, [schema, hideHeader, schemaName]);

  return (
    <div
      className={`not-prose ${hideHeader ? 'mt-0 mb-6' : 'my-6'} border border-background-border rounded-lg overflow-hidden overflow-visible`}
    >
      {!hideHeader && (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={` w-full flex items-center gap-2 px-3 py-2 bg-background-tertiary transition-colors text-left min-h-(--boxed-header-height) group/variant cursor-pointer select-none ${
            isOpen ? 'rounded-t-lg' : 'rounded-lg'
          }`}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-secondary group-hover/variant:text-text-primary transition-all duration-200 shrink-0 ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
            strokeWidth={2.5}
          />
          <span className="font-mono text-[13px] font-bold text-text-primary">{title}</span>
          <span className="text-[11px] text-text-secondary ml-auto">{type}</span>
        </div>
      )}

      {(isOpen || hideHeader) && (
        <div className={`px-4 py-0 ${!hideHeader ? 'border-t border-background-border' : ''}`}>
          <SchemaTree schema={schema} />
        </div>
      )}
    </div>
  );
}
