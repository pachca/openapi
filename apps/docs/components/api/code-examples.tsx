'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { Endpoint } from '@/lib/openapi/types';
import { generateCurl } from '@/lib/code-generators/curl';
import { generateJavaScript } from '@/lib/code-generators/javascript';
import { generatePython } from '@/lib/code-generators/python';
import { generateRuby } from '@/lib/code-generators/ruby';
import { generatePHP } from '@/lib/code-generators/php';
import { generateJava } from '@/lib/code-generators/java';
import { generateNodeJS } from '@/lib/code-generators/nodejs';
import { generateGo } from '@/lib/code-generators/go';
import { generateDotNet } from '@/lib/code-generators/dotnet';
import { generateResponseExample, generateRequestExample } from '@/lib/openapi/example-generator';
import { CopyButton } from './copy-button';
import { CodeBlock } from './code-block';
import { MethodBadge } from './method-badge';
import { BoxedPanel } from './boxed-panel';

interface CodeExamplesProps {
  endpoint: Endpoint;
  baseUrl?: string;
}

type Language =
  | 'curl'
  | 'javascript'
  | 'python'
  | 'ruby'
  | 'php'
  | 'java'
  | 'nodejs'
  | 'go'
  | 'dotnet';

export function CodeExamples({ endpoint, baseUrl }: CodeExamplesProps) {
  const [activeTab, setActiveTab] = useState<Language>('curl');

  const examples = {
    curl: generateCurl(endpoint, baseUrl),
    javascript: generateJavaScript(endpoint, baseUrl),
    python: generatePython(endpoint, baseUrl),
    ruby: generateRuby(endpoint, baseUrl),
    php: generatePHP(endpoint, baseUrl),
    java: generateJava(endpoint, baseUrl),
    nodejs: generateNodeJS(endpoint, baseUrl),
    go: generateGo(endpoint, baseUrl),
    dotnet: generateDotNet(endpoint, baseUrl),
  };

  const languages: Record<Language, string> = {
    curl: 'cURL',
    javascript: 'JavaScript',
    python: 'Python',
    ruby: 'Ruby',
    php: 'PHP',
    java: 'Java',
    nodejs: 'Node.js',
    go: 'Go',
    dotnet: '.NET',
  };

  const successCodes = ['200', '201', '204'];
  const successCode = successCodes.find((code) => endpoint.responses[code]) || '200';
  const successResponse = endpoint.responses[successCode];
  const responseExample = generateResponseExample(successResponse);

  return (
    <div className="flex flex-col">
      {/* Request Section */}
      <BoxedPanel
        id="request-examples"
        className="mt-0 mb-10"
        header={
          <>
            <div className="flex items-center gap-3 overflow-hidden mr-4">
              <MethodBadge method={endpoint.method} />
              <code className="text-[13px] font-mono text-text-primary font-bold truncate">
                {endpoint.path}
              </code>
            </div>

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
                    className="z-50 min-w-[140px] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    align="end"
                  >
                    {(Object.keys(languages) as Language[]).map((lang) => (
                      <DropdownMenu.Item
                        key={lang}
                        onClick={() => setActiveTab(lang)}
                        className={`flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                          activeTab === lang
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                        }`}
                      >
                        {languages[lang]}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              <CopyButton text={examples[activeTab]} />
            </div>
          </>
        }
        contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
      >
        <CodeBlock code={examples[activeTab]} language={getLanguageForHighlight(activeTab)} />
      </BoxedPanel>

      {/* Response Section */}
      {responseExample && (
        <BoxedPanel
          id="response-examples"
          className="my-0"
          header={
            <>
              <span className="py-2 text-[10px] font-bold uppercase tracking-widest text-text-primary">
                пример ответа
              </span>
              <CopyButton text={JSON.stringify(responseExample, null, 2)} />
            </>
          }
          contentClassName="px-6 py-2 pl-0 overflow-x-auto custom-scrollbar"
        >
          <CodeBlock code={JSON.stringify(responseExample, null, 2)} language="json" />
        </BoxedPanel>
      )}
    </div>
  );
}
function getLanguageForHighlight(lang: Language): string {
  const languageMap: Record<Language, string> = {
    curl: 'bash',
    javascript: 'javascript',
    python: 'python',
    ruby: 'ruby',
    php: 'php',
    java: 'java',
    nodejs: 'javascript',
    go: 'go',
    dotnet: 'csharp',
  };
  return languageMap[lang];
}
