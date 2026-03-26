'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { Schema } from '@/lib/openapi/types';
import { CopyableCode } from './schema-tree';
import { InlineCodeText } from './inline-code-text';

const ROLES = ['owner', 'admin', 'user', 'bot'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  user: 'Сотрудник',
  bot: 'Бот',
};

interface ScopeRolesTableProps {
  schema: Schema;
}

export function ScopeRolesTable({ schema }: ScopeRolesTableProps) {
  const [activeRole, setActiveRole] = useState<Role>('owner');
  const [search, setSearch] = useState('');

  const scopeRoles = schema['x-scope-roles'];
  const enumValues = schema.enum as string[] | undefined;
  const descriptions = schema['x-enum-descriptions'];

  const filteredScopes = useMemo(() => {
    if (!scopeRoles || !enumValues) return [];
    let scopes = enumValues.filter((scope) => scopeRoles[scope]?.includes(activeRole));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      scopes = scopes.filter(
        (scope) =>
          scope.toLowerCase().includes(q) || descriptions?.[scope]?.toLowerCase().includes(q)
      );
    }

    return scopes;
  }, [activeRole, search, enumValues, scopeRoles, descriptions]);

  if (!scopeRoles || !enumValues) return null;

  const totalRoles = ROLES.length;

  const tabs = ROLES.map((role) => ({
    key: role,
    label: ROLE_LABELS[role],
    count: enumValues.filter((s) => scopeRoles[s]?.includes(role)).length,
  }));

  return (
    <div className="not-prose">
      {/* Tabs */}
      <div className="mb-6 border-b border-glass-border">
        <div className="flex gap-6 overflow-x-auto scrollbar-none -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveRole(tab.key)}
              className={`flex items-baseline gap-1.5 h-9 text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer select-none border-b ${
                activeRole === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              <span className="text-[13px] opacity-50 tabular-nums">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative group/search mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-[calc(0.75rem+1rem+0.375rem)] pr-8 h-9 rounded-md border border-glass-border bg-glass backdrop-blur-md text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scope list */}
      <div className="border border-glass-border rounded-xl overflow-hidden">
        {filteredScopes.length === 0 ? (
          <div className="px-4 py-4 text-center text-[13px] text-text-secondary">
            Ничего не найдено
          </div>
        ) : (
          <div className="divide-y divide-glass-divider">
            {filteredScopes.map((scope) => (
              <div key={scope} className="px-3 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CopyableCode value={scope} className="text-[13px]! font-medium" />
                  {scopeRoles[scope] && scopeRoles[scope].length < totalRoles && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <span className="flex gap-1 ml-auto cursor-default">
                          {ROLES.map((r) => (
                            <span
                              key={r}
                              className={`w-1.5 h-1.5 rounded-full ${
                                scopeRoles[scope].includes(r) ? 'bg-primary' : 'bg-glass-border'
                              }`}
                            />
                          ))}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          align="end"
                          sideOffset={4}
                          collisionPadding={8}
                          className="z-50 animate-tooltip bg-text-primary text-[12px] font-semibold rounded-md px-2.5 py-1.5 shadow-xl whitespace-nowrap flex items-center gap-1.5"
                        >
                          {ROLES.map((r, i) => (
                            <span
                              key={r}
                              className={
                                scopeRoles[scope].includes(r)
                                  ? 'text-background'
                                  : 'text-background/40'
                              }
                            >
                              {i > 0 && <span className="text-background/20 mr-1.5">·</span>}
                              {ROLE_LABELS[r]}
                            </span>
                          ))}
                          <Tooltip.Arrow className="fill-text-primary" width={8} height={4} />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  )}
                </div>
                {descriptions?.[scope] && (
                  <div className="text-[13px] text-text-primary leading-relaxed pl-0.5">
                    <InlineCodeText text={descriptions[scope]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
