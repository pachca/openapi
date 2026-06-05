'use client';

import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';

import { MarkdownActions } from './markdown-actions';
import { MethodBadge } from './method-badge';
import { CopyButton } from './copy-button';
import type { EndpointRequirements } from '@/lib/openapi/types';

const ROLES = ['owner', 'admin', 'user', 'bot'] as const;
const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  user: 'Сотрудник',
  bot: 'Бот',
};

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
          <div className="flex flex-wrap items-center gap-x-2 px-3 rounded-md text-[13px] font-medium text-text-primary border border-glass-border bg-glass backdrop-blur-md min-w-0">
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
                    href="/api/authorization"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-method-get/10 ![color:var(--color-method-get)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                  >
                    Без авторизации
                  </Link>
                )}
                {requirements.scope && (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Link
                        href="/api/authorization#skoupy"
                        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-method-get/10 ![color:var(--color-method-get)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                      >
                        {requirements.scope}
                        {requirements.scopeRoles && (
                          <span className="flex gap-0.5">
                            {ROLES.map((r) => (
                              <span
                                key={r}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  requirements.scopeRoles!.includes(r)
                                    ? 'bg-method-get/50'
                                    : 'bg-method-get/15'
                                }`}
                              />
                            ))}
                          </span>
                        )}
                      </Link>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        align="center"
                        sideOffset={4}
                        collisionPadding={8}
                        className="z-50 animate-tooltip rounded-lg px-2.5 py-1.5 shadow-xl border border-glass-heavy-border bg-glass-heavy backdrop-blur-md text-[12px] font-semibold whitespace-nowrap flex items-center gap-1.5"
                      >
                        {requirements.scopeRoles ? (
                          ROLES.map((r, i) => (
                            <span
                              key={r}
                              className={
                                requirements.scopeRoles!.includes(r)
                                  ? 'text-text-primary'
                                  : 'text-text-tertiary'
                              }
                            >
                              {i > 0 && <span className="text-text-tertiary/50 mr-1.5">·</span>}
                              {ROLE_LABELS[r]}
                            </span>
                          ))
                        ) : (
                          <span className="text-text-primary">Все роли</span>
                        )}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
                {requirements.plan && (
                  <Link
                    href="/api/authorization"
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 ![color:var(--color-primary)] ![text-decoration:none] hover:opacity-80 transition-opacity"
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
