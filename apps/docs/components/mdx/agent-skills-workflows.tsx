import { WORKFLOWS } from '@/scripts/skills/workflows';
import { SKILL_TAG_MAP } from '@/scripts/skills/config';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateTitle, generateUrlFromOperation } from '@/lib/openapi/mapper';
import type { Endpoint } from '@/lib/openapi/types';
import { AgentSkillsWorkflowsClient } from './agent-skills-workflows-client';

export interface StepSegment {
  type: 'text' | 'endpoint';
  value: string;
  label?: string;
  method?: string;
  href?: string;
}

function findEndpoint(
  method: string,
  rawPath: string,
  endpoints: Endpoint[]
): Endpoint | undefined {
  const path = rawPath.split('?')[0];
  return endpoints.find((e) => e.method.toUpperCase() === method && e.path === path);
}

function parseStep(text: string, endpoints: Endpoint[]): StepSegment[] {
  const RE = /(GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s,—.()]+(?:\{[^}]+\}[^\s,—.()]*)*)/g;
  const segments: StepSegment[] = [];
  let last = 0;

  for (const m of text.matchAll(RE)) {
    if (m.index! > last) {
      segments.push({ type: 'text', value: text.slice(last, m.index!) });
    }
    const method = m[1];
    const path = m[2];
    const ep = findEndpoint(method, path, endpoints);
    segments.push({
      type: 'endpoint',
      value: path,
      label: ep ? generateTitle(ep) : undefined,
      method,
      href: ep ? generateUrlFromOperation(ep) : undefined,
    });
    last = m.index! + m[0].length;
  }

  if (last < text.length) {
    segments.push({ type: 'text', value: text.slice(last) });
  }

  return segments;
}

export interface SkillWorkflowData {
  name: string;
  tags: string[];
  workflows: {
    title: string;
    steps: StepSegment[][];
    notes?: StepSegment[];
  }[];
}

export async function AgentSkillsWorkflows() {
  const { endpoints } = await parseOpenAPI();

  const skills: SkillWorkflowData[] = [];

  for (const skill of SKILL_TAG_MAP) {
    const rawWorkflows = WORKFLOWS[skill.name] ?? [];
    if (!rawWorkflows.length) continue;

    const workflows = rawWorkflows.map((wf) => ({
      title: wf.title,
      steps: wf.steps.map((step) => parseStep(step, endpoints)),
      notes: wf.notes ? parseStep(wf.notes, endpoints) : undefined,
    }));

    skills.push({ name: skill.name, tags: skill.tags, workflows });
  }

  return <AgentSkillsWorkflowsClient skills={skills} />;
}
