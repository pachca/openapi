'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { SkillWorkflowData } from './agent-skills-workflows';

interface Props {
  skills: SkillWorkflowData[];
}

export function AgentSkillsWorkflowsClient({ skills }: Props) {
  return (
    <Accordion.Root type="multiple" className="my-6 divide-y divide-background-border">
      {skills.map((skill) => (
        <Accordion.Item key={skill.name} value={skill.name} className="overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-[15px] font-medium text-text-primary hover:text-text-primary/80 transition-colors duration-200 cursor-pointer outline-none group">
              <span className="flex items-center gap-2">
                <span>{skill.title}</span>
                <span className="text-xs text-text-secondary bg-background-secondary rounded-full px-2 py-0.5">
                  {skill.workflows.length}{' '}
                  {pluralize(skill.workflows.length, 'сценарий', 'сценария', 'сценариев')}
                </span>
              </span>
              <ChevronDown
                className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]:rotate-0 shrink-0"
                strokeWidth={2.5}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
            <div className="pb-4 space-y-4">
              {skill.workflows.map((wf, i) => (
                <div key={i} className={i > 0 ? 'pt-4 border-t border-background-border/50' : ''}>
                  <p className="font-medium text-text-primary text-[14px] mb-2">{wf.title}</p>
                  <ol className="list-decimal list-outside ml-5 space-y-1 text-[14px] text-text-primary">
                    {wf.steps.map((step, j) => (
                      <li
                        key={j}
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: step }}
                      />
                    ))}
                  </ol>
                  {wf.notes && (
                    <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
                      {wf.notes}
                    </p>
                  )}
                </div>
              ))}
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
