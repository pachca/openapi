'use client';

import { useState } from 'react';
import type { Endpoint } from '@/lib/openapi/types';
import { SectionHeader } from './section-header';
import { SchemaTree } from './schema-tree';
import { CodeBlock } from './code-block';
import { BoxedPanel } from './boxed-panel';
import { CopyButton } from './copy-button';
import { InlineCodeText } from './inline-code-text';
import { generateRequestExample } from '@/lib/openapi/example-generator';

interface RequestBodySectionProps {
  endpoint: Endpoint;
}

export function RequestBodySection({ endpoint }: RequestBodySectionProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'example'>('schema');
  const requestBody = endpoint.requestBody;
  if (!requestBody) return null;

  // Prefer application/json, fall back to multipart/form-data (e.g. avatar upload)
  const contentType = requestBody.content['application/json']
    ? 'application/json'
    : requestBody.content['multipart/form-data']
      ? 'multipart/form-data'
      : null;
  if (!contentType) return null;

  const content = requestBody.content[contentType];
  if (!content?.schema) return null;

  const isMultipart = contentType === 'multipart/form-data';
  // Hide JSON example tab for multipart (binary blob makes no sense as JSON)
  const requestExample = isMultipart ? undefined : generateRequestExample(requestBody);
  const hasExample = requestExample !== undefined;

  return (
    <div className="py-6 pb-6 mb-0">
      <SectionHeader title="Тело запроса" subtitle={contentType}>
        {hasExample && (
          <>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all ${
                activeTab === 'schema'
                  ? 'bg-background text-text-primary '
                  : 'text-text-tertiary hover:text-text-primary cursor-pointer'
              }`}
            >
              Схема
            </button>
            <button
              onClick={() => setActiveTab('example')}
              className={`px-3 py-1 rounded-md text-[13px] font-medium transition-all ${
                activeTab === 'example'
                  ? 'bg-background text-text-primary'
                  : 'text-text-tertiary hover:text-text-primary cursor-pointer'
              }`}
            >
              Пример
            </button>
          </>
        )}
      </SectionHeader>

      {requestBody.description && (
        <div className="mt-4 mb-0 text-[14px] text-text-secondary leading-relaxed">
          <InlineCodeText text={requestBody.description} />
        </div>
      )}

      <div className="pt-3">
        {activeTab === 'schema' || !hasExample ? (
          <SchemaTree schema={content.schema} />
        ) : (
          <BoxedPanel
            className="my-4"
            header={
              <>
                <span className="text-[13px] font-medium text-text-primary truncate">
                  Пример тела запроса
                </span>
                <CopyButton text={JSON.stringify(requestExample, null, 2)} />
              </>
            }
            contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
          >
            <CodeBlock code={JSON.stringify(requestExample, null, 2)} language="json" />
          </BoxedPanel>
        )}
      </div>
    </div>
  );
}
