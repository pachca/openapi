'use client';

import { useState, useMemo, useCallback } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import Link from 'next/link';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import { GuideCodeBlock } from '@/components/api/guide-code-block';
import type { WorkflowCardData, StepSegment } from './agent-skills-workflows';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-method-get/10 text-method-get',
  POST: 'bg-method-post/10 text-method-post',
  PUT: 'bg-method-put/10 text-method-put',
  DELETE: 'bg-method-delete/10 text-method-delete',
  PATCH: 'bg-method-patch/10 text-method-patch',
};

const CATEGORY_COLORS: Record<string, string> = {
  Messages: 'bg-method-post/10 text-method-post',
  Thread: 'bg-method-post/10 text-method-post',
  Reactions: 'bg-method-post/10 text-method-post',
  'Read member': 'bg-method-get/10 text-method-get',
  Chats: 'bg-method-put/10 text-method-put',
  Members: 'bg-method-put/10 text-method-put',
  Users: 'bg-primary/10 text-primary',
  'Group tags': 'bg-primary/10 text-primary',
  Profile: 'bg-primary/10 text-primary',
  Bots: 'bg-method-patch/10 text-method-patch',
  'Link Previews': 'bg-method-patch/10 text-method-patch',
  Views: 'bg-method-delete/10 text-method-delete',
  Tasks: 'bg-accent-yellow/10 text-accent-yellow',
  Search: 'bg-method-get/10 text-method-get',
  Security: 'bg-accent-red/10 text-accent-red',
};

const CATEGORY_LABELS: Record<string, string> = {
  Messages: 'Сообщения',
  Thread: 'Треды',
  Reactions: 'Реакции на сообщения',
  'Read member': 'Прочтение сообщения',
  Chats: 'Чаты',
  Members: 'Участники чатов',
  Users: 'Сотрудники',
  'Group tags': 'Теги',
  Profile: 'Профиль и статус',
  Bots: 'Боты и Webhook',
  'Link Previews': 'Ссылки',
  Views: 'Формы',
  Tasks: 'Напоминания',
  Search: 'Поиск',
  Security: 'Безопасность',
};

/* ── Helpers ── */

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <CopyableInlineCode key={i}>{part.slice(1, -1)}</CopyableInlineCode>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function StepContent({ segments }: { segments: StepSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <InlineText key={i} text={seg.value} />;

        const badge = seg.method ? (
          <span
            className={`endpoint-badge px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider -translate-y-px no-underline ${METHOD_COLORS[seg.method] || ''}`}
          >
            {seg.method}
          </span>
        ) : null;

        const displayLabel = seg.label || seg.value.split('?')[0];
        const query = seg.value.includes('?') ? '?' + seg.value.split('?')[1] : null;

        if (seg.href) {
          return (
            <span key={i}>
              <Link
                href={seg.href}
                className="endpoint-link group inline-flex items-baseline gap-1 !no-underline hover:!no-underline"
              >
                {badge}
                <span className="font-semibold underline underline-offset-4 decoration-1 decoration-current/30 group-hover:decoration-current group-hover:decoration-[1.5px] transition-all">
                  {displayLabel}
                </span>
              </Link>
              {query && (
                <>
                  {' '}
                  <CopyableInlineCode>{query}</CopyableInlineCode>
                </>
              )}
            </span>
          );
        }

        return (
          <span key={i} className="inline-flex items-baseline gap-1">
            {badge}
            <span>{displayLabel}</span>
          </span>
        );
      })}
    </>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/* ── Sub-components ── */

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_COLORS[category] || 'bg-glass text-text-secondary'}`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

function CommandBlock({ code }: { code: string }) {
  return <GuideCodeBlock code={code} language="bash" className="" />;
}

function FeaturedSection({
  workflows,
  onNavigate,
}: {
  workflows: WorkflowCardData[];
  onNavigate: (id: string) => void;
}) {
  if (!workflows.length) return null;

  return (
    <div className="mb-6">
      <p className="text-[14px] font-semibold text-text-secondary mb-3">Популярные сценарии</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {workflows.map((wf) => (
          <button
            key={wf.id}
            type="button"
            onClick={() => onNavigate(wf.id)}
            className="flex flex-col gap-2 p-4 rounded-lg border border-glass-border bg-glass backdrop-blur-md hover:bg-glass-hover transition-colors text-left cursor-pointer"
          >
            <span className="font-semibold text-[14px] text-text-primary">{wf.title}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {wf.categories.slice(0, 2).map((cat) => (
                <CategoryBadge key={cat} category={cat} />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */

interface Props {
  workflows: WorkflowCardData[];
}

export function AgentSkillsWorkflowsClient({ workflows }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const allCategories = useMemo(() => {
    const cats = new Map<string, number>();
    workflows.forEach((wf) => {
      wf.categories.forEach((c) => cats.set(c, (cats.get(c) || 0) + 1));
    });
    return Array.from(cats.entries());
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    let result = workflows;

    if (activeCategory) {
      result = result.filter((wf) => wf.categories.includes(activeCategory));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((wf) => {
        if (wf.title.toLowerCase().includes(q)) return true;
        return wf.steps.some(
          (step) =>
            step.segments.some((seg) => seg.value.toLowerCase().includes(q)) ||
            (step.command && step.command.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [workflows, activeCategory, search]);

  const featuredWorkflows = useMemo(() => workflows.filter((wf) => wf.featured), [workflows]);

  const titleToId = useMemo(() => {
    const map = new Map<string, string>();
    workflows.forEach((wf) => map.set(wf.title, wf.id));
    return map;
  }, [workflows]);

  const handleNavigate = useCallback((id: string) => {
    setSearch('');
    setActiveCategory(null);
    setExpandedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  return (
    <div className="not-prose my-4">
      {/* Featured */}
      {featuredWorkflows.length > 0 && (
        <FeaturedSection workflows={featuredWorkflows} onNavigate={handleNavigate} />
      )}

      {/* Toolbar: title + search + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
        <span className="text-[15px] font-semibold text-text-primary">
          {search.trim() || activeCategory ? (
            filteredWorkflows.length === 0 ? (
              'Сценарии не найдены'
            ) : (
              <>
                {filteredWorkflows.length}{' '}
                {pluralize(filteredWorkflows.length, 'сценарий', 'сценария', 'сценариев')}
              </>
            )
          ) : (
            <>
              Все{' '}
              <span className="text-text-tertiary font-normal text-[13px]">{workflows.length}</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-2 sm:w-auto w-full">
          {/* Search */}
          <div className="relative group/search flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within/search:text-text-primary pointer-events-none transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full sm:w-48 pl-9 pr-4 py-1.5 rounded-lg border border-glass-border bg-glass backdrop-blur-md text-[14px] font-medium text-text-primary placeholder:text-text-tertiary placeholder:font-medium focus:outline-none transition-colors"
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

          {/* Filter dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 h-[34px] rounded-lg border border-glass-border bg-glass backdrop-blur-md text-[14px] font-medium text-text-primary transition-all outline-none focus:outline-none focus:ring-0 select-none cursor-pointer group whitespace-nowrap shrink-0">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                {activeCategory ? (CATEGORY_LABELS[activeCategory] ?? activeCategory) : 'Все'}
                <ChevronDown
                  className="w-3.5 h-3.5 shrink-0 text-text-secondary group-hover:text-text-primary transition-colors"
                  strokeWidth={2.5}
                />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] max-h-80 overflow-y-auto bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 shadow-xl animate-dropdown"
                align="end"
                side="bottom"
                sideOffset={6}
                avoidCollisions={false}
              >
                <DropdownMenu.Item
                  onClick={() => setActiveCategory(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                    activeCategory === null
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-primary hover:bg-glass-hover'
                  }`}
                >
                  Все категории
                </DropdownMenu.Item>
                {allCategories.map(([cat, count]) => (
                  <DropdownMenu.Item
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                      activeCategory === cat
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-primary hover:bg-glass-hover'
                    }`}
                  >
                    <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span
                      className={`text-[12px] ml-3 ${activeCategory === cat ? 'text-white/70' : 'text-text-tertiary'}`}
                    >
                      {count}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Workflow list */}
      <Accordion.Root
        type="multiple"
        value={expandedIds}
        onValueChange={setExpandedIds}
        className="divide-y divide-glass-divider"
      >
        {filteredWorkflows.map((wf) => (
          <Accordion.Item key={wf.id} value={wf.id} id={wf.id} className="overflow-hidden">
            <Accordion.Header asChild>
              <div>
                <Accordion.Trigger className="w-full py-3 cursor-pointer select-none outline-none group/header text-left">
                  <div className="flex items-center gap-x-2">
                    <div className="shrink-0 flex items-center justify-center">
                      <ChevronDown
                        className="w-3.5 h-3.5 text-text-secondary group-hover/header:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]/header:rotate-0"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="font-semibold text-[14px] text-text-primary truncate">
                      {wf.title}
                    </span>
                    <span className="text-[13px] text-text-secondary shrink-0">
                      {wf.stepCount} {pluralize(wf.stepCount, 'шаг', 'шага', 'шагов')}
                    </span>
                    <div className="flex-1" />
                    <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
                      {wf.categories.map((cat) => (
                        <CategoryBadge key={cat} category={cat} />
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:hidden flex-wrap gap-1 pl-6 mt-1">
                    {wf.categories.map((cat) => (
                      <CategoryBadge key={cat} category={cat} />
                    ))}
                  </div>
                </Accordion.Trigger>
              </div>
            </Accordion.Header>
            <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden pb-3">
              <div className="pb-2 pt-2 ml-4 border-l border-glass-divider pl-4">
                {/* Requirements */}
                {(wf.requirements.plans.length > 0 || wf.requirements.scopes.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {wf.requirements.scopes.map((scope) => (
                      <Link
                        key={scope}
                        href="/api/authorization#skoupy"
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-method-get/10 ![color:var(--color-method-get)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                      >
                        {scope}
                      </Link>
                    ))}
                    {wf.requirements.plans.map((plan) => (
                      <Link
                        key={plan}
                        href="/api/authorization"
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-callout-warning-bg)] ![color:var(--color-callout-warning-text)] ![text-decoration:none] hover:opacity-80 transition-opacity"
                      >
                        {plan === 'corporation' ? 'Корпорация' : plan}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Steps */}
                {wf.steps.length === 1 ? (
                  <ul className="!mb-0 list-disc list-outside text-[14px] text-text-primary">
                    <li className="leading-relaxed">
                      <StepContent segments={wf.steps[0].segments} />
                      {wf.steps[0].command && (
                        <div className="mt-1.5">
                          <CommandBlock code={wf.steps[0].command} />
                        </div>
                      )}
                    </li>
                  </ul>
                ) : (
                  <ol className="!mb-0 list-decimal list-outside space-y-2 text-[14px] text-text-primary">
                    {wf.steps.map((step, j) => (
                      <li key={j} className="leading-relaxed">
                        <StepContent segments={step.segments} />
                        {step.command && (
                          <div className="mt-1.5">
                            <CommandBlock code={step.command} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Notes */}
                {wf.notes && (
                  <p className="mt-3 !mb-0 text-[13px] text-text-secondary leading-relaxed">
                    <StepContent segments={wf.notes} />
                  </p>
                )}

                {/* Related */}
                {wf.related && wf.related.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {wf.related.map((title) => {
                        const relId = titleToId.get(title);
                        return relId ? (
                          <button
                            key={title}
                            type="button"
                            onClick={() => handleNavigate(relId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium bg-glass backdrop-blur-md border border-glass-border text-text-primary hover:bg-glass-hover transition-colors cursor-pointer min-w-0 max-w-full"
                          >
                            <span className="truncate min-w-0">{title}</span>
                            <span className="text-text-secondary shrink-0">→</span>
                          </button>
                        ) : (
                          <span
                            key={title}
                            className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-glass border border-glass-border text-text-tertiary"
                          >
                            {title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
