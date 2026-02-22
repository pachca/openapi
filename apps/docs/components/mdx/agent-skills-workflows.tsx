import { WORKFLOWS } from '@/scripts/skills/workflows';
import { SKILL_TAG_MAP } from '@/scripts/skills/config';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import type { Endpoint } from '@/lib/openapi/types';
import { AgentSkillsWorkflowsClient } from './agent-skills-workflows-client';

/**
 * Resolve METHOD /path references in step text to links
 * e.g. "POST /messages" -> <a href="/messages/create"><code>POST /messages</code></a>
 */
function resolveMethodRefs(
  text: string,
  endpoints: Endpoint[]
): { text: string; hasLinks: boolean } {
  const METHOD_PATH_RE = /(GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s,—.(]+(?:\{[^}]+\}[^\s,—.(]*)*)/g;

  let hasLinks = false;
  const resolved = text.replace(METHOD_PATH_RE, (match, method: string, apiPath: string) => {
    const endpoint = endpoints.find((e) => e.method.toUpperCase() === method && e.path === apiPath);
    if (endpoint) {
      hasLinks = true;
      const url = generateUrlFromOperation(endpoint);
      return `<a href="${url}" class="text-primary hover:underline"><code>${method} ${apiPath}</code></a>`;
    }
    return `<code>${method} ${apiPath}</code>`;
  });

  return { text: resolved, hasLinks };
}

export interface SkillWorkflowData {
  name: string;
  title: string;
  workflows: {
    title: string;
    steps: string[];
    notes?: string;
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
      steps: wf.steps.map((step) => resolveMethodRefs(step, endpoints).text),
      notes: wf.notes,
    }));

    skills.push({
      name: skill.name,
      title: skill.title,
      workflows,
    });
  }

  return <AgentSkillsWorkflowsClient skills={skills} />;
}
