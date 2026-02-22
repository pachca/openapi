'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { CopyableInlineCode } from '@/components/api/copyable-inline-code';
import type { SkillWorkflowData, StepSegment } from './agent-skills-workflows';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-method-get/10 text-method-get',
  POST: 'bg-method-post/10 text-method-post',
  PUT: 'bg-method-put/10 text-method-put',
  DELETE: 'bg-method-delete/10 text-method-delete',
  PATCH: 'bg-method-patch/10 text-method-patch',
};

/** Render text with backtick-wrapped fragments as <code> */
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

interface Props {
  skills: SkillWorkflowData[];
}

export function AgentSkillsWorkflowsClient({ skills }: Props) {
  return (
    <Accordion.Root type="multiple" className="not-prose my-4 divide-y divide-background-border">
      {skills.map((skill) => (
        <Accordion.Item key={skill.name} value={skill.name} className="overflow-hidden">
          <Accordion.Header asChild>
            <div>
              <Accordion.Trigger className="w-full flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-3 cursor-pointer select-none outline-none group/header">
                <div className="shrink-0 self-center flex items-center justify-center">
                  <ChevronDown
                    className="w-3.5 h-3.5 text-text-secondary group-hover/header:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]/header:rotate-0"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="font-bold font-mono text-[14px] text-text-primary">
                  {skill.name}
                </span>
                <span className="text-[13px] text-text-secondary">
                  {skill.workflows.length}{' '}
                  {pluralize(skill.workflows.length, 'сценарий', 'сценария', 'сценариев')}
                </span>
              </Accordion.Trigger>
            </div>
          </Accordion.Header>
          <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="pb-3">
              <div className="ml-4 border-l border-background-border/60 pl-4">
                <div className="divide-y divide-background-border/60">
                  {skill.workflows.map((wf, i) => (
                    <div key={i} className="py-3">
                      <p className="font-semibold text-[14px] text-text-primary mb-1">{wf.title}</p>
                      {wf.steps.length === 1 ? (
                        <ul className="!mb-0 list-disc list-outside ml-5 space-y-0.5 text-[14px] text-text-primary">
                          <li className="leading-relaxed">
                            <StepContent segments={wf.steps[0]} />
                          </li>
                        </ul>
                      ) : (
                        <ol className="!mb-0 list-decimal list-outside ml-5 space-y-0.5 text-[14px] text-text-primary">
                          {wf.steps.map((stepSegments, j) => (
                            <li key={j} className="leading-relaxed">
                              <StepContent segments={stepSegments} />
                            </li>
                          ))}
                        </ol>
                      )}
                      {wf.notes && (
                        <p className="mt-4 !mb-0 text-[13px] text-text-secondary leading-relaxed">
                          <StepContent segments={wf.notes} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
