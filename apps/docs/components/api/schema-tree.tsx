'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import type { MouseEvent } from 'react';
import { ChevronDown, Link as LinkIcon, Check } from 'lucide-react';
import type { Schema } from '@/lib/openapi/types';
import { useDisplaySettings } from '@/components/layout/display-settings-context';
import { CopiedTooltip } from './copied-tooltip';
import { InlineCodeText } from './inline-code-text';

function isTouchDevice() {
  return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
}

// Контекст для хранения целевого пути из URL hash
const ExpandToPathContext = createContext<string | null>(null);

// Глобальное хранилище для отслеживания уже подсвеченных параметров на текущей странице
// Ключ: pathname, значение: Set параметров которые уже были подсвечены
let highlightedParams: { pathname: string; params: Set<string> } = {
  pathname: '',
  params: new Set(),
};

// Функция для сброса истории подсвеченных параметров (вызывается при навигации)
function resetHighlightedParams() {
  highlightedParams = { pathname: '', params: new Set() };
}

// Слушаем событие навигации к параметру (из поиска или по ссылке)
if (typeof window !== 'undefined') {
  window.addEventListener('param-navigation', resetHighlightedParams);
}

// Функция для извлечения пути из param ID
function getPathFromParamId(paramId: string): string {
  // param-data-accounts-name -> data.accounts.name
  let path = paramId.replace(/^param-/, '');

  // Для enum значений (содержат --), берём только путь до enum
  const enumSeparatorIndex = path.indexOf('--');
  if (enumSeparatorIndex !== -1) {
    path = path.substring(0, enumSeparatorIndex);
  }

  // Заменяем одиночные дефисы на точки
  return path.replace(/-/g, '.');
}

// Проверка, является ли currentPath префиксом targetPath
function isPathPrefix(currentPath: string, targetPath: string): boolean {
  if (!targetPath || !currentPath) return false;
  // Нормализуем пути для сравнения
  const normalizedCurrent = currentPath.replace(/\[\]/g, '').replace(/\./g, '-');
  const normalizedTarget = targetPath.replace(/\[\]/g, '').replace(/\./g, '-');
  return (
    normalizedTarget.startsWith(normalizedCurrent + '-') || normalizedTarget === normalizedCurrent
  );
}

interface SchemaTreeProps {
  schema: Schema;
  level?: number;
  name?: string;
  required?: boolean;
  parentPath?: string;
}

function RequiredBadge() {
  return <span className="text-[14px] font-bold text-method-delete ml-0">*</span>;
}

// Генерация ID для enum значения (для ссылок из поиска)
// Использует -- как разделитель между путём поля и значением enum
function generateEnumId(fieldPath: string, enumValue: string): string {
  const path = `${fieldPath}--${enumValue}`;
  return `param-${path
    .replace(/\./g, '-')
    .replace(/\[\]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

// Компонент для отображения возможных значений enum
function EnumValues({
  schema,
  fieldPath,
  hideDescriptions,
}: {
  schema: Schema;
  fieldPath?: string;
  hideDescriptions?: boolean;
}) {
  // Скролл к enum значению при загрузке страницы или после переключения таба
  useEffect(() => {
    if (typeof window === 'undefined' || !fieldPath || !schema.enum) return;

    const scrollToEnumIfNeeded = () => {
      const hash = window.location.hash.slice(1); // убираем #
      if (!hash) return;

      // Проверяем, есть ли в enum значение, соответствующее hash
      for (const v of schema.enum!) {
        const enumId = generateEnumId(fieldPath, String(v));
        if (hash === enumId) {
          const currentPathname = window.location.pathname;

          // Если pathname изменился, очищаем историю подсвеченных параметров
          if (highlightedParams.pathname !== currentPathname) {
            highlightedParams = { pathname: currentPathname, params: new Set() };
          }

          // Проверяем, не был ли этот параметр уже подсвечен
          if (highlightedParams.params.has(enumId)) {
            return;
          }

          highlightedParams.params.add(enumId);

          setTimeout(() => {
            const element = document.getElementById(enumId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 50);
          break;
        }
      }
    };

    // Выполняем при монтировании
    scrollToEnumIfNeeded();

    // Слушаем hashchange (может прийти после переключения таба)
    window.addEventListener('hashchange', scrollToEnumIfNeeded);
    return () => window.removeEventListener('hashchange', scrollToEnumIfNeeded);
  }, [fieldPath, schema.enum]);

  if (!schema.enum) return null;

  return (
    <div className="mt-3 mb-1 border border-background-border rounded-lg w-full">
      <div className="px-3 flex items-center border-b bg-background-tertiary border-background-border min-h-(--boxed-header-height) rounded-t-lg">
        <span className="text-[13px] font-medium text-text-primary">Возможные значения</span>
      </div>
      <div className="divide-y divide-background-border/40">
        {schema.enum.map((v, i) => {
          const enumValue = Array.isArray(v) ? `Array [ ${v.length} ]` : String(v);
          const enumDescription = schema['x-enum-descriptions']?.[String(v)];
          const isLast = i === schema.enum!.length - 1;
          const enumId = fieldPath ? generateEnumId(fieldPath, String(v)) : undefined;

          return (
            <div
              key={i}
              id={enumId}
              className={`px-3 py-3 flex flex-col gap-2 scroll-mt-20 transition-colors duration-500 ${
                isLast ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="flex">
                <CopyableCode
                  value={String(v)}
                  displayValue={enumValue}
                  className="text-[13px]! font-medium"
                />
              </div>
              {enumDescription && !hideDescriptions && (
                <div className="text-[13px] text-text-primary leading-relaxed pl-0.5">
                  <InlineCodeText text={enumDescription} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Универсальная утилита для форматирования диапазона значений
function formatRange(min?: number, max?: number, suffix?: string): string {
  const s = suffix ? ` ${suffix}` : '';
  if (min !== undefined && max !== undefined) {
    return `${min} — ${max}${s}`;
  }
  if (min !== undefined) {
    return `>= ${min}${s}`;
  }
  return `<= ${max}${s}`;
}

// Проверка, является ли items объектом с properties
function isItemsObjectWithProperties(items: Schema): boolean {
  const isObject =
    items.type === 'object' || (Array.isArray(items.type) && items.type.includes('object'));
  return isObject && !!items.properties && Object.keys(items.properties).length > 0;
}

// Утилита для копирования в буфер обмена
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback to older method if clipboard API fails
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      return true;
    } catch (execError) {
      console.error('Failed to copy:', execError);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Генерация уникального ID для параметра на основе пути
function generateParamId(name: string, parentPath?: string): string {
  const path = parentPath ? `${parentPath}.${name}` : name;
  // Заменяем точки на дефисы и убираем некорректные символы
  return `param-${path.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function CopyableCode({
  value,
  displayValue,
  className,
}: {
  value: string;
  displayValue?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <code
        onClick={handleCopy}
        className={`bg-background-secondary border border-background-border px-1.5 py-0.5 rounded text-[12px] font-mono text-text-primary cursor-pointer hover:bg-background-tertiary transition-colors inline-block truncate ${className || ''}`}
        title="Нажмите, чтобы скопировать"
      >
        {displayValue || value}
      </code>
    </CopiedTooltip>
  );
}

// Компонент для копирования названия параметра
function CopyableName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    // На тач-устройствах не перехватываем клик, чтобы работал toggle секции
    if (isTouchDevice()) return;

    e.preventDefault();
    e.stopPropagation();

    const success = await copyToClipboard(name);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <span
        onClick={handleCopy}
        className="font-bold font-mono text-[14px] text-text-primary break-all inline-block max-w-full transition-colors cursor-pointer hover:text-accent-emphasis"
      >
        {name}
      </span>
    </CopiedTooltip>
  );
}

// Компонент для копирования ссылки на параметр
function CopyLinkButton({ paramId, hasChevron }: { paramId: string; hasChevron?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleCopyLink = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}${window.location.pathname}#${paramId}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setShowCheck(true);
      setIsVisible(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setIsVisible(false), 2110);
      setTimeout(() => setShowCheck(false), 2260); // +150ms для завершения transition
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <button
        onClick={handleCopyLink}
        className={`copy-link-btn absolute right-full ${hasChevron ? 'mr-[28px]' : 'mr-[6px]'} cursor-pointer top-1/2 -translate-y-1/2 ${isVisible ? 'opacity-100' : 'opacity-0'} group-hover/param-name:opacity-100 transition-opacity duration-150 p-1 rounded bg-background hover:bg-background-tertiary hover:text-text-primary shrink-0`}
        title="Скопировать ссылку"
        type="button"
      >
        {showCheck ? (
          <Check
            className="w-3.5 h-3.5 text-[#50A14F] dark:text-[#98C379] transition-colors"
            strokeWidth={2.5}
          />
        ) : (
          <LinkIcon
            className="w-3.5 h-3.5 text-text-secondary transition-colors"
            strokeWidth={2.5}
          />
        )}
      </button>
    </CopiedTooltip>
  );
}

interface SchemaHeaderProps {
  name?: string;
  schema: Schema;
  required?: boolean;
  isComplex?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  variantType?: string;
  typeOverride?: string;
  paramId?: string;
  arrayDepth?: number;
}

function SchemaHeader({
  name,
  schema,
  required,
  isComplex,
  isExpanded,
  onToggle,
  variantType,
  typeOverride,
  paramId,
  arrayDepth = 0,
}: SchemaHeaderProps) {
  const hasMultipleVariants = !!(
    schema.anyOf ||
    schema.oneOf ||
    (schema.allOf && schema.allOf.length > 1)
  );
  const showChevron = isComplex && !hasMultipleVariants;

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1 group/header group/param-name ${
        showChevron ? 'cursor-pointer select-none' : ''
      }`}
      onClick={showChevron ? onToggle : undefined}
    >
      {showChevron && (
        <div className="shrink-0 self-center flex items-center justify-center">
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-secondary group-hover/header:text-text-primary transition-all duration-200 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
            strokeWidth={2.5}
          />
        </div>
      )}

      {name && (
        <div className="relative inline-flex items-center">
          {paramId && (
            <>
              <CopyLinkButton paramId={paramId} hasChevron={showChevron} />
              {/* Невидимая зона для сохранения hover между кнопкой и названием */}
              <div
                className={`absolute right-full ${showChevron ? 'w-[28px]' : 'w-[6px]'} h-full`}
              />
            </>
          )}
          <CopyableName name={name} />
          {arrayDepth > 0 && (
            <span className="text-[13px] font-bold text-text-primary">
              {'[]'.repeat(arrayDepth)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-baseline gap-x-1">
        {schema.nullable && <span className="text-[13px] text-text-secondary">nullable</span>}

        {!hasMultipleVariants && (
          <span className="text-[13px] text-text-secondary">
            {typeOverride ||
              (Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type) ||
              'any'}
            {schema.format && `, (${schema.format})`}
          </span>
        )}

        {hasMultipleVariants && (
          <span className="text-[13px] text-text-secondary font-medium">
            {variantType || (schema.anyOf ? 'anyOf' : schema.oneOf ? 'oneOf' : 'allOf')}
          </span>
        )}
      </div>

      {required && <RequiredBadge />}
    </div>
  );
}

// Внутренний компонент SchemaTree без провайдера контекста
function SchemaTreeInner({
  schema,
  level = 0,
  name,
  required = false,
  parentPath,
}: SchemaTreeProps) {
  const { showSchemaExamples, showDescriptions } = useDisplaySettings();

  // Обработка anyOf/oneOf/allOf
  // Но если allOf содержит только один элемент - это не полиморфизм, а просто расширение
  const shouldShowVariants =
    schema.anyOf || schema.oneOf || (schema.allOf && schema.allOf.length > 1);

  if (shouldShowVariants) {
    const variants = schema.anyOf || schema.oneOf || schema.allOf;
    const variantType = schema.anyOf ? 'anyOf' : schema.oneOf ? 'oneOf' : 'allOf';

    return (
      <div className="flex flex-col not-prose">
        {name && (
          <SchemaHeader name={name} schema={schema} required={required} variantType={variantType} />
        )}
        {/* Описание показывается только для множественных вариантов */}
        {showDescriptions && schema.description && (
          <div className="text-[14px] text-text-secondary leading-relaxed mb-2">
            <InlineCodeText text={schema.description} />
          </div>
        )}
        <div className="space-y-3">
          {variants?.map((variant, index) => {
            // Если вариант - это $ref, показываем название
            const variantName = variant.$ref
              ? variant.$ref.split('/').pop()
              : `Вариант ${index + 1}`;

            return (
              <VariantSection
                key={index}
                title={variantName || `Вариант ${index + 1}`}
                schema={variant}
                level={level}
                index={index}
                parentPath={parentPath}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Если allOf с одним элементом - просто рендерим этот элемент напрямую
  if (schema.allOf && schema.allOf.length === 1) {
    const singleSchema = schema.allOf[0];
    // Объединяем свойства, но НЕ дублируем description если у родителя уже есть name
    // (это означает, что описание уже показано выше)
    const mergedSchema = {
      ...singleSchema,
      description: name ? singleSchema.description : schema.description || singleSchema.description,
      nullable: schema.nullable !== undefined ? schema.nullable : singleSchema.nullable,
    };
    return (
      <SchemaTreeInner
        schema={mergedSchema}
        level={level}
        name={name}
        required={required}
        parentPath={parentPath}
      />
    );
  }

  if (
    (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'))) &&
    schema.properties
  ) {
    return (
      <div className="flex flex-col not-prose">
        {name && (
          <SchemaHeader name={name} schema={schema} required={required} typeOverride="object" />
        )}
        <div className="divide-y divide-background-border/60">
          {Object.entries(schema.properties).map(([propName, propSchema]) => (
            <PropertyRow
              key={propName}
              name={propName}
              schema={propSchema}
              required={schema.required?.includes(propName)}
              level={level}
              parentPath={parentPath}
            />
          ))}
        </div>
      </div>
    );
  }

  // Record<T> / additionalProperties
  if (
    (schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'))) &&
    schema.additionalProperties &&
    typeof schema.additionalProperties !== 'boolean'
  ) {
    const valueSchema = schema.additionalProperties;
    // Если есть properties — это объект (даже без явного type: object)
    const valueIsObject = valueSchema.properties && Object.keys(valueSchema.properties).length > 0;

    return (
      <div className="flex flex-col not-prose">
        {name && (
          <SchemaHeader name={name} schema={schema} required={required} typeOverride="object" />
        )}
        {/* description показывается только на root-уровне (когда есть name) */}
        {showDescriptions && name && schema.description && (
          <div className="text-[14px] text-text-secondary leading-relaxed mb-2 mt-1">
            <InlineCodeText text={schema.description} />
          </div>
        )}
        <div className={valueIsObject ? '' : 'pl-4 border-l border-background-border/60'}>
          {valueIsObject && valueSchema.properties ? (
            <div className="divide-y divide-background-border/60">
              {Object.entries(valueSchema.properties).map(([propName, propSchema]) => (
                <PropertyRow
                  key={propName}
                  name={propName}
                  schema={propSchema as Schema}
                  required={valueSchema.required?.includes(propName)}
                  level={level}
                  parentPath={parentPath ? `${parentPath}[*]` : '[*]'}
                />
              ))}
            </div>
          ) : (
            <SchemaTreeInner
              schema={valueSchema}
              level={level + 1}
              parentPath={parentPath ? `${parentPath}[*]` : '[*]'}
            />
          )}
        </div>
      </div>
    );
  }

  if (
    (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) &&
    schema.items
  ) {
    // Проверяем, является ли items объектом с properties
    const itemsIsObject = isItemsObjectWithProperties(schema.items);
    const arrayPath = parentPath ? `${parentPath}[]` : name ? `${name}[]` : '[]';

    return (
      <div className="flex flex-col not-prose">
        {name && (
          <SchemaHeader name={name} schema={schema} required={required} typeOverride="array" />
        )}
        {showDescriptions && schema.description && (
          <div className="text-[14px] text-text-secondary leading-relaxed mb-2 mt-1">
            <InlineCodeText text={schema.description} />
          </div>
        )}

        {/* Пример массива */}
        {showSchemaExamples && schema.example !== undefined && (
          <MetadataRow label="Пример">
            <CopyableCode value={JSON.stringify(schema.example)} />
          </MetadataRow>
        )}

        {/* Метаданные массива */}
        {(schema.minItems !== undefined || schema.maxItems !== undefined) && (
          <div className="text-[13px] text-text-secondary flex items-center gap-1 mb-2 mt-1">
            <span className="text-text-secondary text-[13px] shrink-0">Количество:</span>
            <code className="bg-background-secondary border border-background-border px-1.5 py-0.5 rounded text-[12px] font-mono text-text-primary">
              {formatRange(schema.minItems, schema.maxItems, 'элементов')}
            </code>
          </div>
        )}

        <div className={itemsIsObject ? '' : 'pl-4 border-l border-background-border/60'}>
          {itemsIsObject && schema.items ? (
            // Если items - это объект с properties, рендерим его как таблицу свойств
            <div className="divide-y divide-background-border/60">
              {Object.entries(schema.items.properties!).map(([propName, propSchema]) => {
                // Приводим propSchema к типу Schema для корректной работы
                const typedPropSchema = propSchema as Schema;
                return (
                  <PropertyRow
                    key={propName}
                    name={propName}
                    schema={typedPropSchema}
                    required={schema.items!.required?.includes(propName)}
                    level={level}
                    parentPath={arrayPath}
                  />
                );
              })}
            </div>
          ) : schema.items ? (
            // Иначе рендерим как обычную схему
            <SchemaTreeInner schema={schema.items} level={level + 1} parentPath={arrayPath} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-1 not-prose">
      <div className="flex items-baseline gap-2 mb-0">
        <span className="text-[13px] text-text-secondary font-medium">
          {(Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type) || 'any'}
          {schema.format && ` (${schema.format})`}
        </span>
      </div>
      {showDescriptions && schema.description && (
        <div className="text-[14px] text-text-secondary leading-relaxed">
          <InlineCodeText text={schema.description} />
        </div>
      )}
      <EnumValues schema={schema} fieldPath={parentPath} hideDescriptions={!showDescriptions} />
    </div>
  );
}

function VariantSection({
  title,
  schema,
  level,
  parentPath,
}: {
  title: string;
  schema: Schema;
  level: number;
  index: number;
  parentPath?: string;
}) {
  const targetPath = useContext(ExpandToPathContext);

  // Проверяем, нужно ли автоматически раскрыть этот вариант
  // Для вариантов сложнее определить путь, поэтому раскрываем все варианты если есть targetPath в этой ветке
  const shouldAutoExpand = targetPath && parentPath ? isPathPrefix(parentPath, targetPath) : false;

  const [isOpen, setIsOpen] = useState(true);

  // Обновляем состояние раскрытия при изменении targetPath
  useEffect(() => {
    if (shouldAutoExpand && !isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand based on URL hash navigation
      setIsOpen(true);
    }
  }, [shouldAutoExpand, isOpen]);

  return (
    <div className="border border-background-border rounded-lg overflow-visible">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 min-h-[var(--boxed-header-height)] bg-background-tertiary transition-colors text-left group/variant cursor-pointer select-none ${
          isOpen ? 'rounded-t-lg' : 'rounded-lg'
        }`}
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-secondary group-hover/variant:text-text-primary transition-all duration-200 shrink-0 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
          strokeWidth={2.5}
        />
        <span className="text-[13px] font-medium text-text-primary">{title}</span>
        <span className="text-[11px] text-text-secondary ml-auto">
          {Array.isArray(schema.type)
            ? schema.type.join(' | ')
            : schema.type || (schema.properties ? 'object' : 'any')}
        </span>
      </div>

      {isOpen && (
        <div className="px-4 py-0 border-t border-background-border">
          <SchemaTreeInner schema={schema} level={level + 1} parentPath={parentPath} />
        </div>
      )}
    </div>
  );
}

export interface PropertyRowProps {
  name: string;
  schema: Schema;
  required?: boolean;
  level: number;
  parentPath?: string;
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-[13px] text-text-secondary flex items-center gap-1 mb-0 mt-0">
      <span className="text-text-secondary text-[13px] shrink-0">{label}:</span>
      {children}
    </div>
  );
}

function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex">
      <code className="bg-background-secondary border border-background-border px-1.5 py-0.5 rounded text-[12px] font-mono text-text-primary relative block max-w-full truncate">
        {children}
      </code>
    </div>
  );
}

export function PropertyRow({ name, schema, required, level, parentPath }: PropertyRowProps) {
  const { showSchemaExamples, showDescriptions } = useDisplaySettings();

  // Генерируем уникальный ID для параметра
  const paramId = generateParamId(name, parentPath);
  const currentPath = parentPath ? `${parentPath}.${name}` : name;

  // Получаем целевой путь из контекста
  const targetPath = useContext(ExpandToPathContext);

  // Проверяем, нужно ли автоматически раскрыть этот блок
  const shouldAutoExpand = targetPath ? isPathPrefix(currentPath, targetPath) : false;

  const [isExpanded, setIsExpanded] = useState(true);

  // Обновляем состояние раскрытия при изменении targetPath
  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand based on URL hash navigation
      setIsExpanded(true);
    }
  }, [shouldAutoExpand, isExpanded]);

  // Скролл к параметру при загрузке страницы или при навигации из поиска
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tryScrollToParam = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const hashParamId = hash.slice(1); // убираем #
      if (hashParamId !== paramId) return;

      // Скролл к элементу с задержкой для открытия секций
      setTimeout(() => {
        const element = document.getElementById(paramId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    };

    // Проверяем сразу при монтировании
    tryScrollToParam();

    // Также слушаем событие навигации из поиска (для клиентской навигации)
    window.addEventListener('param-navigation', tryScrollToParam);
    return () => window.removeEventListener('param-navigation', tryScrollToParam);
  }, [paramId]);

  // allOf с одним элементом - не полиморфизм, а просто расширение
  const hasMultipleVariants = !!(
    schema.anyOf ||
    schema.oneOf ||
    (schema.allOf && schema.allOf.length > 1)
  );

  const isObjectType =
    schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'));
  const isArrayType =
    schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'));

  const hasProperties = !!(
    isObjectType &&
    schema.properties &&
    Object.keys(schema.properties).length > 0
  );
  const hasAdditionalProperties = !!(
    isObjectType &&
    schema.additionalProperties &&
    typeof schema.additionalProperties !== 'boolean'
  );
  const hasItems = !!(isArrayType && schema.items);
  const isNestedArray = !!(isArrayType && schema.items && schema.items.type === 'array');
  const isSimpleArray = !!(
    isArrayType &&
    schema.items &&
    !isNestedArray &&
    !isItemsObjectWithProperties(schema.items) &&
    !schema.items.anyOf &&
    !schema.items.oneOf &&
    !schema.items.allOf
  );
  const isComplex =
    hasProperties || hasAdditionalProperties || (hasItems && !isSimpleArray) || hasMultipleVariants;

  // Если allOf с одним элементом, обрабатываем особо
  if (schema.allOf && schema.allOf.length === 1 && !schema.anyOf && !schema.oneOf) {
    const singleSchema = schema.allOf[0];
    const mergedSchema = {
      ...singleSchema,
      description: schema.description || singleSchema.description,
      nullable: schema.nullable !== undefined ? schema.nullable : singleSchema.nullable,
      example: schema.example !== undefined ? schema.example : singleSchema.example,
      default: schema.default !== undefined ? schema.default : singleSchema.default,
    };
    return (
      <PropertyRow
        name={name}
        schema={mergedSchema}
        required={required}
        level={level}
        parentPath={parentPath}
      />
    );
  }

  let typeOverride: string | undefined;
  if (hasAdditionalProperties && !hasProperties) {
    typeOverride = 'object';
  } else if (isArrayType && schema.items) {
    // Для вложенных массивов строим "array of arrays of objects"
    let leafItems = schema.items;
    let arrayPrefix = 'array of ';
    while (leafItems.type === 'array' && leafItems.items) {
      arrayPrefix += 'arrays of ';
      leafItems = leafItems.items;
    }
    const itemType = Array.isArray(leafItems.type)
      ? leafItems.type.join(' | ')
      : leafItems.type || 'any';
    const itemFormat = leafItems.format ? `, (${leafItems.format})` : '';
    const pluralType = itemType.endsWith('s') ? itemType : `${itemType}s`;
    typeOverride = `${arrayPrefix}${pluralType}${itemFormat}`;
  }

  return (
    <div className="py-3 scroll-mt-20" id={paramId}>
      <div className="flex flex-col min-w-0">
        <SchemaHeader
          name={name}
          schema={schema}
          required={required}
          isComplex={isComplex}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          paramId={paramId}
          typeOverride={typeOverride}
          arrayDepth={
            isArrayType
              ? (() => {
                  let depth = 1;
                  let items = schema.items;
                  while (items?.type === 'array' && items.items) {
                    depth++;
                    items = items.items;
                  }
                  return depth;
                })()
              : 0
          }
        />

        {/* Описание показывается только если нет вариантов (anyOf/oneOf/allOf) */}
        {showDescriptions && schema.description && !hasMultipleVariants && (
          <div className="text-[14px] text-text-primary leading-relaxed mb-0 mt-1">
            <InlineCodeText text={schema.description} />
          </div>
        )}

        <div className="flex flex-col gap-1 mt-1 empty:hidden">
          {showSchemaExamples && schema.example !== undefined && !hasMultipleVariants && (
            <MetadataRow label="Пример">
              <CopyableCode
                value={
                  typeof schema.example === 'string'
                    ? schema.example
                    : JSON.stringify(schema.example)
                }
              />
            </MetadataRow>
          )}

          <EnumValues
            schema={schema.items?.enum ? schema.items : schema}
            fieldPath={currentPath}
            hideDescriptions={!showDescriptions}
          />
          {schema.default !== undefined && (
            <MetadataRow label="По умолчанию">
              <CodeBadge>
                {typeof schema.default === 'string'
                  ? schema.default
                  : JSON.stringify(schema.default)}
              </CodeBadge>
            </MetadataRow>
          )}
          {(schema.minimum !== undefined || schema.maximum !== undefined) && (
            <MetadataRow label="Диапазон">
              <CodeBadge>{formatRange(schema.minimum, schema.maximum)}</CodeBadge>
            </MetadataRow>
          )}
          {(schema.minLength !== undefined || schema.maxLength !== undefined) && (
            <MetadataRow label="Длина">
              <CodeBadge>{formatRange(schema.minLength, schema.maxLength, 'символов')}</CodeBadge>
            </MetadataRow>
          )}
          {(schema.minItems !== undefined || schema.maxItems !== undefined) && (
            <MetadataRow label="Количество">
              <CodeBadge>{formatRange(schema.minItems, schema.maxItems, 'элементов')}</CodeBadge>
            </MetadataRow>
          )}
          {schema.pattern && (
            <MetadataRow label="Паттерн">
              <CodeBadge>{schema.pattern}</CodeBadge>
            </MetadataRow>
          )}
        </div>
      </div>

      {hasMultipleVariants && (
        <div className="mt-2">
          <SchemaTreeInner schema={schema} level={level + 1} />
        </div>
      )}

      {!hasMultipleVariants && isComplex && isExpanded && hasProperties && (
        <div className="mt-2 ml-4 border-l border-background-border/60 pl-4">
          <SchemaTreeInner schema={schema} level={level + 1} parentPath={currentPath} />
        </div>
      )}

      {!hasMultipleVariants &&
        isComplex &&
        isExpanded &&
        hasAdditionalProperties &&
        !hasProperties && (
          <div className="mt-2 ml-4 border-l border-background-border/60 pl-4">
            <SchemaTreeInner schema={schema} level={level + 1} parentPath={currentPath} />
          </div>
        )}

      {!hasMultipleVariants && isComplex && isExpanded && isArrayType && schema.items && (
        <div className="mt-2 ml-4 border-l border-background-border/60 pl-4">
          {isItemsObjectWithProperties(schema.items) && schema.items.properties ? (
            // Если items - это объект с properties, показываем его свойства напрямую
            <div className="divide-y divide-background-border/60">
              {Object.entries(schema.items.properties).map(([propName, propSchema]) => (
                <PropertyRow
                  key={propName}
                  name={propName}
                  schema={propSchema as Schema}
                  required={schema.items!.required?.includes(propName)}
                  level={level + 1}
                  parentPath={`${currentPath}[]`}
                />
              ))}
            </div>
          ) : (
            // Иначе рендерим как обычную схему
            <SchemaTreeInner
              schema={schema.items}
              level={level + 1}
              parentPath={`${currentPath}[]`}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Экспортируемый компонент SchemaTree с провайдером контекста
export function SchemaTree({
  schema,
  level = 0,
  name,
  required = false,
  parentPath,
}: SchemaTreeProps) {
  const [targetPath, setTargetPath] = useState<string | null>(null);

  // Извлекаем целевой путь из URL hash при загрузке
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#param-')) {
        const path = getPathFromParamId(hash.slice(1));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing state from URL hash
        setTargetPath(path);
      }

      // Слушаем изменения hash (для навигации по якорям на той же странице)
      const handleHashChange = () => {
        const newHash = window.location.hash;
        if (newHash && newHash.startsWith('#param-')) {
          const path = getPathFromParamId(newHash.slice(1));
          setTargetPath(path);
        } else {
          setTargetPath(null);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  // Если это корневой уровень (level === 0), оборачиваем в провайдер контекста
  if (level === 0) {
    return (
      <ExpandToPathContext.Provider value={targetPath}>
        <SchemaTreeInner
          schema={schema}
          level={level}
          name={name}
          required={required}
          parentPath={parentPath}
        />
      </ExpandToPathContext.Provider>
    );
  }

  // Для вложенных уровней просто используем внутренний компонент
  return (
    <SchemaTreeInner
      schema={schema}
      level={level}
      name={name}
      required={required}
      parentPath={parentPath}
    />
  );
}
