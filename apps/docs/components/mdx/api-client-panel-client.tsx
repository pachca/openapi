'use client';

import Link from 'next/link';
import { GuideCodeBlock } from '@/components/api/guide-code-block';
import { CodeBlock } from '@/components/api/code-block';
import { CopyButton } from '@/components/api/copy-button';
import { LangTabs } from '@/components/api/lang-tabs';
import { useCodeLang } from '@/lib/use-code-lang';
import type { ApiClient } from '@/lib/api-clients';

export function ApiClientPanelClient({
  baseUrl,
  clients,
}: {
  baseUrl: string;
  clients: ApiClient[];
}) {
  const [lang, setLang] = useCodeLang(clients[0]?.id ?? 'cli');
  // The shared value may be a language without an install entry (e.g. cURL) — fall back then.
  const active = clients.find((c) => c.id === lang) ?? clients[0];

  return (
    <div className="not-prose flex flex-col gap-4">
      {/* Base URL — standard titled code block */}
      <GuideCodeBlock title="Базовый URL" code={baseUrl} language="text" className="m-0" />

      {/* Client libraries — tabs header (scrolls on narrow), code below the divider */}
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border border-glass-border bg-glass overflow-hidden">
          {/* Tab bar: scrolls on narrow; copy button pinned right (blur like a code block) */}
          {/* border-b lives on the tab row (content), so the active underline and the divider
              stay flush even if a horizontal scrollbar reserves space below them */}
          <div className="relative">
            <div className="overflow-x-auto no-scrollbar">
              <LangTabs
                items={clients.map((c) => ({ id: c.id, label: c.short ?? c.label }))}
                activeId={active?.id}
                onSelect={setLang}
                className="w-max min-w-full pl-4 pr-12 border-b border-glass-border"
              />
            </div>
            {active && (
              <div className="absolute top-0 right-0 z-10 rounded-bl-xl rounded-tl-xl pt-2 pb-2 pl-3 pr-3 backdrop-blur-sm">
                <CopyButton text={active.install} />
              </div>
            )}
          </div>
          {/* Active install command (pl-0: .line already has 1rem left padding, aligns with tabs) */}
          <div className="py-2.5 pl-0 pr-4 overflow-x-auto custom-scrollbar">
            {active && <CodeBlock code={active.install} language={active.lang} />}
          </div>
        </div>

        {active && (
          <div className="px-1 text-[13px] leading-relaxed text-text-tertiary">
            {active.blurb} в{' '}
            <Link
              href={active.href}
              className="endpoint-link font-medium text-text-tertiary underline underline-offset-2 hover:text-text-secondary transition-colors"
            >
              документации {active.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
