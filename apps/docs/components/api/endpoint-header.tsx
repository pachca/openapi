'use client';

import Link from 'next/link';

import { MarkdownActions } from './markdown-actions';
import { MethodBadge } from './method-badge';
import { CopyButton } from './copy-button';
import type { EndpointRequirements } from '@/lib/openapi/types';

const planNames: Record<string, string> = {
  corporation: 'Корпорация',
};

interface EndpointHeaderProps {
  title: string;
  pageUrl: string;
  method?: string;
  path?: string;
  requirements?: EndpointRequirements;
}

export function EndpointHeader({
  title,
  pageUrl,
  method,
  path,
  requirements,
}: EndpointHeaderProps) {
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${pageUrl}` : pageUrl;

  const hasBadges =
    requirements && (requirements.scope || requirements.plan || requirements.auth === false);

  return (
    <div className="mb-8">
      <h1 className="text-text-primary mb-2!">{title}</h1>
      <div className="mt-0">
        <MarkdownActions pageUrl={pageUrl} pageTitle={title} />
      </div>

      {method && path && (
        <div className="mt-4 not-prose">
          <div className="flex flex-wrap items-center gap-x-2 px-3 rounded-md text-[13px] font-medium text-text-primary border border-background-border bg-background min-w-0">
            <div className="flex gap-2 items-center overflow-hidden flex-1 min-w-0 min-h-[var(--boxed-header-height)]">
              <MethodBadge
                method={method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'}
              />
              <span className="font-mono text-[13px] text-text-primary font-bold truncate">
                {path}
              </span>
            </div>
            {hasBadges && (
              <div className="flex items-center gap-1.5 order-last sm:order-none basis-full sm:basis-auto pb-2 sm:pb-0">
                {requirements.auth === false && (
                  <Link
                    href="/guides/authorization"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-callout-info-bg)] ![color:var(--color-callout-info-text)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                  >
                    Без авторизации
                  </Link>
                )}
                {requirements.scope && (
                  <Link
                    href="/guides/authorization#скоупы"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-callout-info-bg)] ![color:var(--color-callout-info-text)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                  >
                    {requirements.scope}
                  </Link>
                )}
                {requirements.plan && (
                  <Link
                    href="/guides/authorization"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-callout-warning-bg)] ![color:var(--color-callout-warning-text)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                  >
                    {planNames[requirements.plan] ?? requirements.plan}
                  </Link>
                )}
              </div>
            )}
            <div className="shrink-0 min-h-[var(--boxed-header-height)] flex items-center">
              <CopyButton text={`[${title} - ${method.toUpperCase()} ${path}](${fullUrl})`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
