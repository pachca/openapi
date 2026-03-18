'use client';

import { useState, useMemo, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { Endpoint } from '@/lib/openapi/types';
import { generateCurl } from '@/lib/code-generators/curl';
import { generateCLI } from '@/lib/code-generators/cli';
import { generateResponseExample, type ExampleOptions } from '@/lib/openapi/example-generator';
import { CopyButton } from './copy-button';
import { CodeBlock } from './code-block';
import { BoxedPanel } from './boxed-panel';

interface CodeExamplesProps {
  endpoint: Endpoint;
  baseUrl?: string;
  title?: string;
  show?: 'request' | 'response' | 'both';
  responseMode?: 'full' | 'minimal';
  sdkExamples?: Record<string, string>;
  langs?: Language[];
  className?: string;
}

type Language = 'curl' | 'cli' | 'typescript' | 'python' | 'go' | 'kotlin' | 'swift';

const STORAGE_KEY = 'pachca-docs-code-lang';

const languageLabels: Record<Language, string> = {
  cli: 'Pachca CLI',
  curl: 'cURL',
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  kotlin: 'Kotlin',
  swift: 'Swift',
};

export function CodeExamples({
  endpoint,
  baseUrl,
  title,
  show = 'both',
  responseMode = 'full',
  sdkExamples,
  langs,
  className,
}: CodeExamplesProps) {
  const allLangs = Object.keys(languageLabels) as Language[];
  const visibleLangs = langs ?? allLangs;
  const defaultLang = visibleLangs[0];

  const [activeTab, setActiveTab] = useState<Language>(defaultLang);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in languageLabels && visibleLangs.includes(saved as Language)) {
      setActiveTab(saved as Language); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (lang: Language) => {
    setActiveTab(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const code = useMemo(() => {
    if (activeTab === 'curl') return generateCurl(endpoint, baseUrl);
    if (activeTab === 'cli') return generateCLI(endpoint);
    return sdkExamples?.[activeTab] || '';
  }, [activeTab, endpoint, baseUrl, sdkExamples]);

  const languages = Object.fromEntries(visibleLangs.map((l) => [l, languageLabels[l]])) as Record<
    Language,
    string
  >;

  const successCodes = ['200', '201', '204'];
  const successCode = successCodes.find((code) => endpoint.responses[code]) || '200';
  const successResponse = endpoint.responses[successCode];
  const resOpts: ExampleOptions | undefined =
    responseMode === 'minimal' ? { minimal: true } : undefined;
  const rawResponseExample = generateResponseExample(successResponse, resOpts);

  const isEmptyObject =
    rawResponseExample !== null &&
    typeof rawResponseExample === 'object' &&
    !Array.isArray(rawResponseExample) &&
    Object.keys(rawResponseExample as Record<string, unknown>).length === 0;
  const responseExample = isEmptyObject ? undefined : rawResponseExample;

  const hasResponse = responseExample !== undefined;
  const showRequest = show === 'request' || show === 'both';
  const showResponse = (show === 'response' || show === 'both') && hasResponse;

  const responsePanel = showResponse ? (
    <BoxedPanel
      id="response-examples"
      className={showRequest ? 'my-0' : (className ?? 'my-0')}
      header={
        <>
          <span className="text-[13px] font-medium text-text-primary truncate">
            {show === 'response' ? title || `Ответ ${successCode}` : `Ответ ${successCode}`}
          </span>
          <CopyButton text={JSON.stringify(responseExample, null, 2)} />
        </>
      }
      contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
    >
      <CodeBlock code={JSON.stringify(responseExample, null, 2)} language="json" />
    </BoxedPanel>
  ) : null;

  if (!showRequest) {
    return responsePanel;
  }

  const requestPanel = (
    <BoxedPanel
      id="request-examples"
      className={showResponse ? 'mt-0 mb-6' : (className ?? 'my-0')}
      header={
        <>
          <span className="text-[13px] font-medium text-text-primary truncate mr-4">
            {title || endpoint.title || endpoint.summary || endpoint.path}
          </span>

          <div className="flex items-center gap-0 shrink-0">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1 px-2 h-7 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary transition-all outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 select-none cursor-pointer group">
                  {languages[activeTab]}
                  <ChevronDown
                    className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors"
                    strokeWidth={2.5}
                  />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[140px] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 space-y-0.5 shadow-xl animate-dropdown"
                  align="end"
                >
                  {(Object.keys(languages) as Language[]).map((lang) => (
                    <DropdownMenu.Item
                      key={lang}
                      onClick={() => handleTabChange(lang)}
                      className={`flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                        activeTab === lang
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-primary hover:bg-glass-hover'
                      }`}
                    >
                      {languages[lang]}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <CopyButton text={code} />
          </div>
        </>
      }
      contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
    >
      <CodeBlock code={code} language={getLanguageForHighlight(activeTab)} />
    </BoxedPanel>
  );

  if (!showResponse) {
    return requestPanel;
  }

  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      {requestPanel}
      {responsePanel}
    </div>
  );
}
function getLanguageForHighlight(lang: Language): string {
  const languageMap: Record<Language, string> = {
    curl: 'bash',
    cli: 'bash',
    typescript: 'typescript',
    python: 'python',
    go: 'go',
    kotlin: 'kotlin',
    swift: 'swift',
  };
  return languageMap[lang];
}
