'use client';

import { MarkdownActions } from './markdown-actions';
import { MethodBadge } from './method-badge';
interface EndpointHeaderProps {
  title: string;
  pageUrl: string;
  method?: string;
  path?: string;
}

export function EndpointHeader({ title, pageUrl, method, path }: EndpointHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-text-primary mb-2!">{title}</h1>
      <div className="mt-0">
        <MarkdownActions pageUrl={pageUrl} pageTitle={title} method={method} path={path} />
      </div>

      {method && path && (
        <div className="flex items-center gap-2 mt-4">
          <MethodBadge
            method={method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'}
          />
          <span className="font-mono text-[13px] text-text-primary font-bold truncate">{path}</span>
        </div>
      )}
    </div>
  );
}
