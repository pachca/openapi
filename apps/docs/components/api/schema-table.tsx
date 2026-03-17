'use client';

import React, { useState, type ReactNode } from 'react';
import { CopiedTooltip } from './copied-tooltip';
import type { Schema } from '@/lib/openapi/types';

interface SchemaTableProps {
  schema: Schema;
}

function getTypeName(schema: Schema): string {
  // $ref — show model name
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() || 'object';
    if (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) {
      return `array of ${refName}`;
    }
    return refName;
  }

  // array
  if (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) {
    if (schema.items) {
      const itemType = getTypeName(schema.items);
      return `array of ${itemType}`;
    }
    return 'array';
  }

  // anyOf/oneOf — join variant types
  const variants = schema.anyOf || schema.oneOf;
  if (variants && variants.length > 0) {
    const types = variants.map((v) => getTypeName(v));
    return types.join(' | ');
  }

  // allOf with single element
  if (schema.allOf && schema.allOf.length === 1) {
    return getTypeName(schema.allOf[0]);
  }

  const baseType = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type || 'any';
  return baseType;
}

function getFormat(schema: Schema): string | null {
  if (schema.format) return schema.format;

  // For allOf with single element, check inner schema
  if (schema.allOf?.length === 1) {
    return schema.allOf[0].format || null;
  }

  return null;
}

function buildExample(schema: Schema): unknown | undefined {
  // Explicit example
  if (schema.example !== undefined) return schema.example;

  // allOf with single element
  if (schema.allOf?.length === 1) return buildExample(schema.allOf[0]);

  // anyOf/oneOf — first variant with an example
  const variants = schema.anyOf || schema.oneOf;
  if (variants) {
    for (const v of variants) {
      const ex = buildExample(v);
      if (ex !== undefined) return ex;
    }
  }

  // Object with properties — build from required fields + first optional with example
  if (schema.properties) {
    const requiredSet = new Set(schema.required || []);
    const obj: Record<string, unknown> = {};
    let hasAny = false;
    // First pass: required fields
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!requiredSet.has(key)) continue;
      const ex = buildExample(propSchema);
      if (ex !== undefined) {
        obj[key] = ex;
        hasAny = true;
      }
    }
    // Second pass: optional fields (include only if no conflict with other optional fields)
    const optionalWithExamples: string[] = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (requiredSet.has(key)) continue;
      if (buildExample(propSchema) !== undefined) optionalWithExamples.push(key);
    }
    // If only one optional has example, include it; if multiple, skip to avoid conflicts
    if (optionalWithExamples.length === 1) {
      const key = optionalWithExamples[0];
      obj[key] = buildExample(schema.properties[key])!;
      hasAny = true;
    }
    if (hasAny) return obj;
  }

  // Array with items
  if (
    (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) &&
    schema.items
  ) {
    const itemEx = buildExample(schema.items);
    if (itemEx !== undefined) return [itemEx];
  }

  return undefined;
}

function getExample(schema: Schema): string | null {
  const ex = buildExample(schema);
  if (ex === undefined) return null;
  if (typeof ex === 'string') return `"${ex}"`;
  return JSON.stringify(ex);
}

interface PropertyInfo {
  name: string;
  type: string;
  format: string | null;
  description: string | null;
  example: string | null;
  required: boolean;
  nullable: boolean;
  deprecated: boolean;
}

function collectProperties(schema: Schema): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  if (!schema.properties) return props;

  const requiredFields = new Set(schema.required || []);

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    props.push({
      name,
      type: getTypeName(propSchema),
      format: getFormat(propSchema),
      description: propSchema.description || null,
      example: getExample(propSchema),
      required: requiredFields.has(name),
      nullable: propSchema.nullable || false,
      deprecated: propSchema.deprecated || false,
    });
  }

  return props;
}

function renderInlineMarkdown(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code
        key={i}
        className="text-[12px] font-mono text-text-primary bg-glass px-1 py-0.5 rounded-md border border-glass-border"
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

function CopyableCell({ text, children }: { text: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textArea);
    }
  };

  return (
    <CopiedTooltip open={copied}>
      <span onClick={handleCopy} className="cursor-pointer">
        {children}
      </span>
    </CopiedTooltip>
  );
}

export function SchemaTable({ schema }: SchemaTableProps) {
  const properties = collectProperties(schema);

  if (properties.length === 0) {
    return <p className="text-[13px] text-text-secondary italic">Нет свойств</p>;
  }

  return (
    <div className="my-6 overflow-x-auto not-prose">
      <table className="w-full border-none text-[14px]">
        <thead className="border-b border-glass-border">
          <tr>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Параметр
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Тип
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Описание
            </th>
            <th className="text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!">
              Пример
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-divider">
          {properties.map((prop) => (
            <tr key={prop.name} className={prop.deprecated ? 'opacity-50' : ''}>
              {/* Property name */}
              <td className="py-5 pl-0! text-text-primary align-top">
                <CopyableCell text={prop.name}>
                  <span className="text-[14px] font-bold font-mono text-text-primary hover:text-accent transition-colors">
                    {prop.name}
                  </span>
                </CopyableCell>
              </td>

              {/* Type */}
              <td className="py-5 pl-0! text-text-primary align-top whitespace-nowrap">
                <span className="text-text-secondary">{prop.type}</span>
                {prop.format && <span className="text-text-tertiary ml-1">({prop.format})</span>}
                {prop.nullable && <span className="text-text-tertiary ml-1">| null</span>}
              </td>

              {/* Description */}
              <td className="py-5 pl-0! text-text-primary align-top leading-relaxed min-w-[200px]">
                {prop.deprecated && (
                  <span className="text-[11px] font-semibold text-method-delete bg-method-delete/10 px-1.5 py-0.5 rounded-full mr-1.5">
                    deprecated
                  </span>
                )}
                {prop.description ? renderInlineMarkdown(prop.description) : '—'}
              </td>

              {/* Example */}
              <td className="py-5 pl-0! pr-0! text-text-primary align-top w-[300px] min-w-[300px] max-w-[300px]">
                {prop.example ? (
                  prop.example.startsWith('{') || prop.example.startsWith('[') ? (
                    <CopyableCell text={JSON.stringify(JSON.parse(prop.example), null, 2)}>
                      <pre className="text-[12px] font-mono text-text-primary whitespace-pre m-0 px-2 py-1.5 rounded-md bg-glass border border-glass-border overflow-x-auto hover:border-accent/50 transition-colors">
                        {JSON.stringify(JSON.parse(prop.example), null, 2)}
                      </pre>
                    </CopyableCell>
                  ) : (
                    <CopyableCell text={prop.example}>
                      <code className="text-[12px] font-mono text-text-primary bg-glass px-1.5 py-0.5 rounded-md border border-glass-border inline-block break-all! whitespace-normal! overflow-wrap-anywhere hover:border-accent/50 transition-colors">
                        {prop.example}
                      </code>
                    </CopyableCell>
                  )
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
