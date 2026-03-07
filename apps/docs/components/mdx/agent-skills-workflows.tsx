import { WORKFLOWS } from '@pachca/spec/workflows';
import type { Workflow } from '@pachca/spec/workflows';
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

export interface WorkflowCardData {
  id: string;
  title: string;
  skillName: string;
  categories: string[];
  steps: { segments: StepSegment[]; command?: string }[];
  notes?: StepSegment[];
  featured: boolean;
  requirements: { scopes: string[]; plans: string[] };
  related?: string[];
  stepCount: number;
}

const STEP_RE = /(GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s,—.()]+(?:\{[^}]+\}[^\s,—.()]*)*)/g;

function deriveRequirements(wf: Workflow, endpoints: Endpoint[]) {
  const scopes = new Set<string>();
  const plans = new Set<string>();
  for (const step of wf.steps) {
    for (const m of step.description.matchAll(STEP_RE)) {
      const ep = findEndpoint(m[1], m[2], endpoints);
      if (ep?.requirements?.scope) scopes.add(ep.requirements.scope);
      if (ep?.requirements?.plan) plans.add(ep.requirements.plan);
    }
  }
  return { scopes: [...scopes], plans: [...plans] };
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
  const segments: StepSegment[] = [];
  let last = 0;

  for (const m of text.matchAll(STEP_RE)) {
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

export async function AgentSkillsWorkflows() {
  const { endpoints } = await parseOpenAPI();

  const allWorkflows: WorkflowCardData[] = [];

  for (const skill of SKILL_TAG_MAP) {
    const rawWorkflows = WORKFLOWS[skill.name] ?? [];
    if (!rawWorkflows.length) continue;

    rawWorkflows.forEach((wf, index) => {
      allWorkflows.push({
        id: `${skill.name}-${index}`,
        title: wf.title,
        skillName: skill.name,
        categories: skill.tags,
        steps: wf.steps.map((step) => ({
          segments: parseStep(step.description, endpoints),
          command: step.command,
        })),
        notes: wf.notes ? parseStep(wf.notes, endpoints) : undefined,
        featured: wf.featured ?? false,
        requirements: deriveRequirements(wf, endpoints),
        related: wf.related,
        stepCount: wf.steps.length,
      });
    });
  }

  return <AgentSkillsWorkflowsClient workflows={allWorkflows} />;
}
