'use client';

import { useState, useEffect } from 'react';
import type { Endpoint, Response, Schema } from '@/lib/openapi/types';
import { SectionHeader } from './section-header';
import { SchemaTree } from './schema-tree';
import { InlineCodeText } from './inline-code-text';

// Рекурсивно ищет параметр в схеме по пути
// paramPath может быть в формате "field-path" или "field-path--enum_value"
function findParamInSchema(schema: Schema | undefined, paramPath: string): boolean {
  if (!schema) return false;

  // Для enum значений (содержат --), берём только путь поля
  let fieldPath = paramPath;
  const enumSeparatorIndex = paramPath.indexOf('--');
  if (enumSeparatorIndex !== -1) {
    fieldPath = paramPath.substring(0, enumSeparatorIndex);
  }

  // Проверяем properties
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const currentPath = key;
      if (fieldPath === currentPath || fieldPath.startsWith(currentPath + '-')) {
        // Нашли совпадение на этом уровне или нужно искать глубже
        if (fieldPath === currentPath) return true;
        // Рекурсивно ищем в nested схеме
        const remainingPath = fieldPath.slice(currentPath.length + 1);
        if (findParamInSchema(value, remainingPath)) return true;
      }
    }
  }

  // Проверяем items (для массивов)
  if (schema.items) {
    if (findParamInSchema(schema.items, fieldPath)) return true;
  }

  // Проверяем allOf/anyOf/oneOf
  for (const variant of [
    ...(schema.allOf || []),
    ...(schema.anyOf || []),
    ...(schema.oneOf || []),
  ]) {
    if (findParamInSchema(variant, fieldPath)) return true;
  }

  return false;
}

interface ResponseSectionProps {
  endpoint: Endpoint;
}

// Получаем человекочитаемое название для кода ответа
function getResponseCodeLabel(code: string): string {
  const labels: Record<string, string> = {
    '200': 'OK',
    '201': 'Created',
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '422': 'Unprocessable Entity',
    '500': 'Internal Server Error',
  };
  return labels[code] || '';
}

export function ResponseSection({ endpoint }: ResponseSectionProps) {
  const { responses } = endpoint;
  const codes = Object.keys(responses).sort();
  const [activeCode, setActiveCode] = useState(codes[0] || '200');

  // Автоматически переключаем на таб, содержащий параметр из URL hash
  // Только при первой загрузке или навигации из поиска (не при ручном клике на таб)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAndSwitchTab = () => {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#param-')) return;

      // Извлекаем путь параметра из hash (param-data-user_id -> data-user_id)
      const paramPath = hash.slice(7); // убираем '#param-'

      // Ищем параметр в каждой схеме ответа
      for (const code of codes) {
        const response = responses[code];
        const schema = response.content?.['application/json']?.schema;
        if (schema && findParamInSchema(schema, paramPath)) {
          setActiveCode(code);
          // После переключения таба, даём время на рендер и отправляем событие
          // чтобы SchemaTree перечитал hash и выполнил скролл
          setTimeout(() => {
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }, 100);
          return;
        }
      }
    };

    // Проверяем при монтировании
    checkAndSwitchTab();

    // Слушаем событие навигации к параметру (из поиска)
    window.addEventListener('param-navigation', checkAndSwitchTab);
    return () => window.removeEventListener('param-navigation', checkAndSwitchTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняем только при монтировании

  if (codes.length === 0) return null;

  const currentResponse = responses[activeCode];
  const isError = !activeCode.startsWith('2');

  // Проверяем, есть ли реальная схема для отображения
  // Не показываем SchemaTree для пустых схем (EmptyResponse и подобных)
  const schema = currentResponse.content?.['application/json']?.schema;
  const hasRealSchema =
    schema &&
    ((schema.properties && Object.keys(schema.properties).length > 0) ||
      schema.items ||
      schema.anyOf ||
      schema.oneOf ||
      schema.allOf ||
      schema.enum);

  return (
    <div className="border-t border-background-border py-6 pb-0">
      <SectionHeader title="Ответы">
        {codes.map((code) => {
          const isActive = activeCode === code;
          const codeIsError = !code.startsWith('2');
          const label = getResponseCodeLabel(code);

          return (
            <button
              key={code}
              onClick={() => setActiveCode(code)}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-background text-text-primary '
                  : 'text-text-tertiary hover:text-text-primary cursor-pointer'
              }`}
              title={label}
            >
              {code}
            </button>
          );
        })}
      </SectionHeader>

      <div className="space-y-6">
        {/* Всегда показываем описание кода ответа */}
        {currentResponse.description && (
          <div className="pt-6 mb-2">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-background-tertiary border border-background-border">
              <div
                className={`shrink-0 w-2 h-2 mt-2 rounded-full ${isError ? 'bg-method-delete' : 'bg-method-post'}`}
              />
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-[14px] font-bold font-mono ${isError ? 'text-method-delete' : 'text-method-post'}`}
                  >
                    {activeCode}
                  </span>
                  {getResponseCodeLabel(activeCode) && (
                    <span className="text-[14px] font-medium text-text-primary">
                      {getResponseCodeLabel(activeCode)}
                    </span>
                  )}
                </div>
                <div className="text-[14px] text-text-secondary leading-relaxed">
                  <InlineCodeText text={currentResponse.description} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Показываем схему только если есть реальные данные для отображения */}
        {hasRealSchema && (
          <div className="pt-2">
            <SchemaTree schema={schema} />
          </div>
        )}
      </div>
    </div>
  );
}
