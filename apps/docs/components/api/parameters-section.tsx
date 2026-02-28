'use client';

import type { Endpoint, Parameter, ParamNameEntry, Schema } from '@/lib/openapi/types';
import { PropertyRow, ValuesBox, CopyableCode } from './schema-tree';
import { SectionHeader } from './section-header';
import { useDisplaySettings } from '@/components/layout/display-settings-context';

interface ParametersSectionProps {
  endpoint: Endpoint;
}

export function ParametersSection({ endpoint }: ParametersSectionProps) {
  const { parameters } = endpoint;
  if (!parameters || parameters.length === 0) {
    return null;
  }

  const pathParams = parameters.filter((p) => p.in === 'path');
  const queryParams = parameters.filter((p) => p.in === 'query');
  const headerParams = parameters.filter((p) => p.in === 'header');

  return (
    <div className="mb-0">
      {pathParams.length > 0 && (
        <div className="py-6">
          <SectionHeader title="Параметры пути" />
          <ParametersList parameters={pathParams} />
        </div>
      )}

      {queryParams.length > 0 && (
        <div className="py-6">
          <SectionHeader title="Параметры строки запроса" />
          <ParametersList parameters={queryParams} />
        </div>
      )}

      {headerParams.length > 0 && (
        <div className="py-6">
          <SectionHeader title="Headers" />
          <ParametersList parameters={headerParams} />
        </div>
      )}
    </div>
  );
}

function resolveEnumValues(schema: Schema): unknown[] | undefined {
  if (schema.enum) return schema.enum;
  if (schema.allOf) {
    for (const sub of schema.allOf) {
      if (sub.enum) return sub.enum;
    }
  }
  return undefined;
}

function resolveEnumDescriptions(schema: Schema): Record<string, string> | undefined {
  if (schema['x-enum-descriptions']) return schema['x-enum-descriptions'];
  if (schema.allOf) {
    for (const sub of schema.allOf) {
      if (sub['x-enum-descriptions']) return sub['x-enum-descriptions'];
    }
  }
  return undefined;
}

function resolveSchemaType(schema: Schema): string | undefined {
  if (schema.type) return Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (schema.allOf) {
    for (const sub of schema.allOf) {
      if (sub.type) return Array.isArray(sub.type) ? sub.type[0] : sub.type;
    }
  }
  return undefined;
}

function formatEnumDescriptions(
  enumValues: unknown[],
  enumDescriptions: Record<string, string>
): string | undefined {
  const descs = enumValues
    .map((v) => enumDescriptions[String(v)])
    .filter(Boolean)
    .map((d) => d.toLowerCase());
  if (descs.length === 0) return undefined;
  return `(${descs.join(' или ')})`;
}

function ParamNamesSection({
  entries,
  enumValues,
  enumDescriptions,
}: {
  entries: ParamNameEntry[];
  enumValues?: unknown[];
  enumDescriptions?: Record<string, string>;
}) {
  const { showDescriptions } = useDisplaySettings();

  const enumSuffix =
    enumDescriptions && enumValues
      ? formatEnumDescriptions(enumValues, enumDescriptions)
      : undefined;

  return (
    <ValuesBox title="Возможные параметры и значения">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`px-3 py-2.5 flex flex-col gap-1.5 ${i === entries.length - 1 ? 'rounded-b-lg' : ''}`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <CopyableCode value={entry.name} />
            {enumValues && (
              <>
                <span className="text-[13px] text-text-secondary">=</span>
                {enumValues.map((v, j) => (
                  <span key={j} className="flex items-center gap-1.5">
                    {j > 0 && <span className="text-[13px] text-text-secondary">или</span>}
                    <CopyableCode value={String(v)} />
                  </span>
                ))}
              </>
            )}
          </div>
          {showDescriptions && (entry.description || enumSuffix) && (
            <div className="text-[13px] text-text-primary leading-relaxed pl-0.5">
              {entry.description}
              {entry.description && enumSuffix && ' '}
              {enumSuffix && <span className="text-text-secondary">{enumSuffix}</span>}
            </div>
          )}
        </div>
      ))}
    </ValuesBox>
  );
}

function ParametersList({ parameters }: { parameters: Parameter[] }) {
  return (
    <div className="divide-y divide-background-border/60">
      {parameters.map((param, idx) => {
        // Приоритет: param.example > первый из param.examples > schema.example
        let example = param.example;
        if (example === undefined && param.examples) {
          const firstKey = Object.keys(param.examples)[0];
          if (firstKey) example = param.examples[firstKey].value;
        }
        if (example === undefined) example = param.schema.example;

        const paramNames = param['x-param-names'];

        if (paramNames) {
          const enumValues = resolveEnumValues(param.schema);
          const enumDescriptions = resolveEnumDescriptions(param.schema);
          const schemaType = resolveSchemaType(param.schema);

          // Для параметров с x-param-names форматируем default как "sort[id]=desc"
          // (первое имя параметра + значение по умолчанию)
          const rawDefault = param.schema.default;
          const formattedDefault =
            rawDefault !== undefined && paramNames.length > 0
              ? `${paramNames[0].name}=${String(rawDefault)}`
              : rawDefault;

          return (
            <PropertyRow
              key={idx}
              name={param.name}
              schema={{
                type: schemaType || 'string',
                description: param.description || param.schema.description,
                default: formattedDefault,
              }}
              required={param.required}
              level={0}
            >
              <ParamNamesSection
                entries={paramNames}
                enumValues={enumValues}
                enumDescriptions={enumDescriptions}
              />
            </PropertyRow>
          );
        }

        return (
          <PropertyRow
            key={idx}
            name={param.name}
            schema={{
              ...param.schema,
              description: param.description || param.schema.description,
              example,
              default: param.schema.default,
              enum: param.schema.enum,
            }}
            required={param.required}
            level={0}
          />
        );
      })}
    </div>
  );
}
