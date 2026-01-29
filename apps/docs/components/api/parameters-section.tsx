import type { Endpoint, Parameter } from '@/lib/openapi/types';
import { PropertyRow } from './schema-tree';
import { SectionHeader } from './section-header';

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
        <div className="border-t border-background-border py-6">
          <SectionHeader title="Параметры пути" />
          <ParametersList parameters={pathParams} />
        </div>
      )}

      {queryParams.length > 0 && (
        <div className="border-t border-background-border py-6">
          <SectionHeader title="Query-параметры" />
          <ParametersList parameters={queryParams} />
        </div>
      )}

      {headerParams.length > 0 && (
        <div className="border-t border-background-border py-6">
          <SectionHeader title="Headers" />
          <ParametersList parameters={headerParams} />
        </div>
      )}
    </div>
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
