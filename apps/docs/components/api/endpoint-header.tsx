'use client';

import { MarkdownActions } from './markdown-actions';
import { MethodBadge } from './method-badge';
import { MoveDown } from 'lucide-react';

interface EndpointHeaderProps {
  title: string;
  pageUrl: string;
  method?: string;
  path?: string;
}

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  const scrollContainer = document.querySelector('main');
  if (element && scrollContainer) {
    const offset = 80; // отступ сверху
    const elementPosition = element.getBoundingClientRect().top;
    const containerScrollTop = scrollContainer.scrollTop;
    const containerTop = scrollContainer.getBoundingClientRect().top;

    scrollContainer.scrollTo({
      top: containerScrollTop + elementPosition - containerTop - offset,
      behavior: 'smooth',
    });
    // Update URL hash without triggering scroll
    window.history.pushState(null, '', `#${id}`);
  }
}

export function EndpointHeader({ title, pageUrl, method, path }: EndpointHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-text-primary mb-2!">{title}</h1>
      <div className="mt-0">
        <MarkdownActions pageUrl={pageUrl} pageTitle={title} method={method} path={path} />
      </div>

      {method && path && (
        <div className="flex items-center gap-2 mt-4 xl:hidden">
          <button
            onClick={() => scrollToSection('request-examples')}
            className="group flex items-center justify-between gap-2 px-3 min-h-[var(--boxed-header-height)] rounded-md text-[13px] font-medium text-text-primary hover:bg-background-tertiary  transition-all outline-none border border-background-border bg-background cursor-pointer w-full"
          >
            <div className="flex gap-2 items-center overflow-hidden">
              <MethodBadge
                method={method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'}
              />
              <span className="font-mono text-[13px] text-text-primary font-bold truncate">
                {path}
              </span>
            </div>
            <MoveDown
              className="w-3.5 h-3.5 shrink-0 text-text-secondary group-hover:text-text-primary"
              strokeWidth={2.5}
            />
          </button>
        </div>
      )}
    </div>
  );
}
