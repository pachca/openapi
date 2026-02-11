'use client';

import { MarkdownActions } from './markdown-actions';
import { MethodBadge } from './method-badge';
import { CopyButton } from './copy-button';

interface EndpointHeaderProps {
  title: string;
  pageUrl: string;
  method?: string;
  path?: string;
}

export function EndpointHeader({ title, pageUrl, method, path }: EndpointHeaderProps) {
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${pageUrl}` : pageUrl;

  return (
    <div className="mb-8">
      <h1 className="text-text-primary mb-2!">{title}</h1>
      <div className="mt-0">
        <MarkdownActions pageUrl={pageUrl} pageTitle={title} method={method} path={path} />
      </div>

      {method && path && (
        <div className="flex items-center justify-between gap-2 px-3 min-h-[var(--boxed-header-height)] rounded-md text-[13px] font-medium text-text-primary border border-background-border bg-background mt-4">
          <div className="flex gap-2 items-center overflow-hidden">
            <MethodBadge
              method={method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'}
            />
            <span className="font-mono text-[13px] text-text-primary font-bold truncate">
              {path}
            </span>
          </div>
          <CopyButton text={`[${title} - ${method.toUpperCase()} ${path}](${fullUrl})`} />
        </div>
      )}
    </div>
  );
}
