'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { EndpointLink } from '@/components/api/endpoint-link';
import {
  SCOPE_ROLES as ROLES,
  SCOPE_ROLE_LABELS as ROLE_LABELS,
  type ScopeRole,
} from '@/lib/scope-roles';

type Action = 'read' | 'write' | 'destructive';

export interface McpToolRow {
  name: string;
  method: string;
  /** Title of the API method, «Список чатов» */
  title: string;
  operation: string;
  href?: string;
  scope?: string;
  plan?: string;
  roles: string[];
  audience: string;
  action: Action;
  actionLabel: string;
  /** Area of the API the method belongs to, used only by the search */
  area: string;
}

const TH =
  'text-left py-4 pl-0! text-text-primary! font-semibold! text-[15px]! normal-case! tracking-normal! bg-transparent!';

const ACTION_OPTIONS: { value: Action | 'all'; label: string }[] = [
  { value: 'all', label: 'Любое действие' },
  { value: 'read', label: 'Чтение' },
  { value: 'write', label: 'Изменение' },
  { value: 'destructive', label: 'Опасное изменение' },
];

const ROLE_OPTIONS: { value: ScopeRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Все роли' },
  ...ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
];

/**
 * The MCP tools as one table with a search and two filters: by the action mark
 * the program gets and by the role the tool is available to.
 */
export function McpToolsTable({ rows }: { rows: McpToolRow[] }) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<Action | 'all'>('all');
  const [role, setRole] = useState<ScopeRole | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (action === 'all' || row.action === action) &&
        (role === 'all' || row.roles.includes(role)) &&
        (!q ||
          [row.name, row.title, row.operation, row.scope ?? '', row.area].some((s) =>
            s.toLowerCase().includes(q)
          ))
    );
  }, [rows, search, action, role]);

  return (
    <div className="my-6 not-prose">
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            aria-label="Поиск по инструментам"
            className="w-full pl-[calc(0.75rem+1rem+0.375rem)] pr-8 h-9 rounded-md border border-glass-border bg-glass backdrop-blur-md text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <FilterDropdown
          ariaLabel="Кому доступен"
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
        />
        <FilterDropdown
          ariaLabel="Действие"
          options={ACTION_OPTIONS}
          value={action}
          onChange={setAction}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-none text-[14px]">
          <thead className="border-b border-glass-border">
            <tr>
              <th className={TH}>Инструмент</th>
              <th className={TH}>Метод API</th>
              <th className={TH}>Кому доступен</th>
              <th className={TH}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 pl-0! text-center text-[13px] text-text-secondary">
                  Ничего не найдено
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.name}>
                  <td className="py-3 pl-0! pr-3 align-top text-text-primary whitespace-nowrap">
                    <CopyableInlineCode className="text-[12px]! mx-0!">
                      {row.name}
                    </CopyableInlineCode>
                  </td>
                  <td className="py-3 pl-0! pr-3 align-top text-text-primary break-words">
                    <EndpointLink
                      method={row.method}
                      href={row.href}
                      scope={row.scope}
                      roles={row.roles.join(',')}
                      plan={row.plan}
                    >
                      {row.title}
                    </EndpointLink>
                  </td>
                  <td className="py-3 pl-0! pr-3 align-top text-text-secondary">{row.audience}</td>
                  <td className="py-3 pl-0! align-top text-text-secondary">{row.actionLabel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterDropdown<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0]!;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`${ariaLabel}: ${current.label}`}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-md border bg-glass backdrop-blur-md text-[13px] font-medium whitespace-nowrap cursor-pointer outline-none transition-colors ${
            value === options[0]!.value
              ? 'border-glass-border text-text-primary'
              : 'border-primary text-primary'
          }`}
        >
          {current.label}
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 space-y-0.5 shadow-xl animate-dropdown"
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
        >
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                value === option.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-primary hover:bg-glass-hover data-highlighted:bg-glass-hover'
              }`}
            >
              {option.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
