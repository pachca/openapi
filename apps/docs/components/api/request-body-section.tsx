'use client';

import { useState } from 'react';
import type { Endpoint } from '@/lib/openapi/types';
import { SectionHeader } from './section-header';
import { SchemaTree } from './schema-tree';
import { CodeBlock } from './code-block';
import { BoxedPanel } from './boxed-panel';
import { CopyButton } from './copy-button';
import { InlineCodeText } from './inline-code-text';
import { generateRequestExamples } from '@/lib/openapi/example-generator';

interface RequestBodySectionProps {
  endpoint: Endpoint;
}

export function RequestBodySection({ endpoint }: RequestBodySectionProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'example'>('schema');
  const requestBody = endpoint.requestBody;
  if (!requestBody) return null;

  // Prefer application/json, fall back to multipart/form-data (e.g. avatar upload)
  // and to a form body (the OAuth flow)
  const contentType = requestBody.content['application/json']
    ? 'application/json'
    : requestBody.content['multipart/form-data']
      ? 'multipart/form-data'
      : requestBody.content['application/x-www-form-urlencoded']
        ? 'application/x-www-form-urlencoded'
        : null;
  if (!contentType) return null;

  const content = requestBody.content[contentType];
  if (!content?.schema) return null;

  const isMultipart = contentType === 'multipart/form-data';
  // Hide JSON example tab for multipart (binary blob makes no sense as JSON).
  // Every authored example is shown, one panel each: the code tabs on the right
  // send only the first one.
  const requestExamples = isMultipart ? [] : generateRequestExamples(requestBody);
  const hasExample = requestExamples.length > 0;

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
              {requestExamples.length > 1 ? 'Примеры' : 'Пример'}
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
          requestExamples.map((example, index) => {
            const json = JSON.stringify(example.value, null, 2);
            const label =
              example.label ??
              (requestExamples.length > 1 ? `Пример ${index + 1}` : 'Пример тела запроса');
            return (
              <div key={index} className="my-4">
                {example.description && (
                  <div className="mb-2 text-[14px] text-text-secondary leading-relaxed">
                    <InlineCodeText text={example.description} />
                  </div>
                )}
                <BoxedPanel
                  className="my-0"
                  header={
                    <>
                      <span className="text-[13px] font-medium text-text-primary truncate">
                        {label}
                      </span>
                      <CopyButton text={json} />
                    </>
                  }
                  contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
                >
                  <CodeBlock code={json} language="json" />
                </BoxedPanel>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
