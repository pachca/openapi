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
                <span className="font-semibold underline underline-offset-[3px] decoration-1 decoration-current/30 group-hover:decoration-current group-hover:decoration-[1.5px] transition-all">
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
      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CATEGORY_COLORS[category] || 'bg-background-secondary text-text-secondary'}`}
    >
      {category}
    </span>
  );
}

function CurlBlock({ code }: { code: string }) {
  return <GuideCodeBlock code={code} language="bash" title="Пример запроса" className="" />;
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
            className="flex flex-col gap-2 p-4 rounded-lg border border-background-border hover:bg-background-tertiary/50 transition-colors text-left cursor-pointer"
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
        return wf.steps.some((step) => step.some((seg) => seg.value.toLowerCase().includes(q)));
      });
    }

    return result;
  }, [workflows, activeCategory, search]);

  const featuredWorkflows = useMemo(() => workflows.filter((wf) => wf.featured), [workflows]);

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
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-[15px] font-semibold text-text-primary shrink-0">
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

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-48 pl-9 pr-4 py-1.5 rounded-lg border border-background-border bg-background-secondary text-[14px] font-medium text-text-primary placeholder:text-text-tertiary placeholder:font-medium focus:outline-none focus:bg-background transition-colors"
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
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-background-border bg-background text-[14px] font-medium text-text-primary transition-all outline-none focus:outline-none focus:ring-0 select-none cursor-pointer group">
                <Filter className="w-3.5 h-3.5" />
                {activeCategory || 'Все'}
                <ChevronDown
                  className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors"
                  strokeWidth={2.5}
                />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] max-h-80 overflow-y-auto bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-dropdown"
                align="end"
                side="bottom"
                sideOffset={6}
                avoidCollisions={false}
              >
                <DropdownMenu.Item
                  onClick={() => setActiveCategory(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                    activeCategory === null
                      ? 'bg-primary text-white'
                      : 'text-text-primary hover:bg-background-tertiary'
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
                        ? 'bg-primary text-white'
                        : 'text-text-primary hover:bg-background-tertiary'
                    }`}
                  >
                    <span>{cat}</span>
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
        className="divide-y divide-background-border"
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
              <div className="pb-2 pt-2 ml-4 border-l border-background-border/60 pl-4">
                {/* Steps */}
                {wf.steps.length === 1 ? (
                  <ul className="!mb-0 list-disc list-outside text-[14px] text-text-primary">
                    <li className="leading-relaxed">
                      <StepContent segments={wf.steps[0]} />
                    </li>
                  </ul>
                ) : (
                  <ol className="!mb-0 list-decimal list-outside space-y-1.5 text-[14px] text-text-primary">
                    {wf.steps.map((stepSegments, j) => (
                      <li key={j} className="leading-relaxed">
                        <StepContent segments={stepSegments} />
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

                {/* Curl */}
                {wf.curl && (
                  <div className="mt-5">
                    <CurlBlock code={wf.curl} />
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
