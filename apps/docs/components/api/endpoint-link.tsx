'use client';

import Link from 'next/link';
import * as Tooltip from '@radix-ui/react-tooltip';

const ENDPOINT_METHOD_COLORS: Record<string, string> = {
  GET: 'bg-method-get/10 text-method-get',
  POST: 'bg-method-post/10 text-method-post',
  PUT: 'bg-method-put/10 text-method-put',
  DELETE: 'bg-method-delete/10 text-method-delete',
  PATCH: 'bg-method-patch/10 text-method-patch',
};

const ROLES = ['owner', 'admin', 'user', 'bot'] as const;
const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  user: 'Сотрудник',
  bot: 'Бот',
};

const PLAN_NAMES: Record<string, string> = {
  corporation: 'Корпорация',
};

interface EndpointLinkProps {
  method?: string;
  href?: string;
  scope?: string;
  scopeRoles?: string;
  plan?: string;
  noAuth?: boolean;
  children: React.ReactNode;
}

export function EndpointLink({
  method,
  href,
  scope,
  scopeRoles: scopeRolesStr,
  plan,
  noAuth,
  children,
}: EndpointLinkProps) {
  const scopeRoles = scopeRolesStr ? scopeRolesStr.split(',') : undefined;
  const hasBadges = scope || plan || noAuth;

  const badge = method ? (
    <span
      className={`endpoint-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider -translate-y-px no-underline ${ENDPOINT_METHOD_COLORS[method] || ''}`}
    >
      {method}
    </span>
  ) : null;

  const linkContent = (
    <>
      {badge}
      <span className="font-semibold underline underline-offset-[3px] decoration-1 decoration-current/30 group-hover:decoration-current group-hover:decoration-[1.5px] transition-all">
        {children}
      </span>
    </>
  );

  if (!href) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        {badge}
        <span>{children}</span>
      </span>
    );
  }

  const link = (
    <Link
      href={href}
      className="endpoint-link group inline-flex items-baseline gap-1.5 !no-underline hover:!no-underline"
    >
      {linkContent}
    </Link>
  );

  if (!hasBadges) {
    return link;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="center"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 animate-tooltip rounded-lg px-2 py-1.5 shadow-xl border border-glass-heavy-border bg-glass-heavy backdrop-blur-md whitespace-nowrap flex items-center gap-1.5"
        >
          {noAuth && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-method-get/10 ![color:var(--color-method-get)]">
              Без авторизации
            </span>
          )}
          {scope && (
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-method-get/10 ![color:var(--color-method-get)]">
              {scope}
              {scopeRoles && (
                <span className="flex gap-0.5">
                  {ROLES.map((r) => (
                    <span
                      key={r}
                      className={`w-1.5 h-1.5 rounded-full ${
                        scopeRoles.includes(r) ? 'bg-method-get/50' : 'bg-method-get/15'
                      }`}
                      title={ROLE_LABELS[r]}
                    />
                  ))}
                </span>
              )}
            </span>
          )}
          {plan && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 ![color:var(--color-primary)]">
              {PLAN_NAMES[plan] ?? plan}
            </span>
          )}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
