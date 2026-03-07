import fs from 'fs';
import path from 'path';
import type { Endpoint, Schema, ParsedAPI } from '../../lib/openapi/types';
import { generateTitle } from '../../lib/openapi/mapper';
import { SKILL_TAG_MAP, COMMON_ENDPOINT_MAP, ROUTER_SKILL_CONFIG, TOP_OPERATIONS } from './config';
import type { SkillConfig } from './config';
import { WORKFLOWS } from '@pachca/spec/workflows';
import type { Workflow } from '@pachca/spec/workflows';

const REPO_ROOT = path.join(process.cwd(), '..', '..');

const OUTPUT_DIRS = [
  path.join(REPO_ROOT, 'skills'),
  path.join(process.cwd(), 'public/.well-known/skills'),
];

function cleanOutputDirs() {
  for (const dir of OUTPUT_DIRS) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
  const agentsMd = path.join(REPO_ROOT, 'AGENTS.md');
  if (fs.existsSync(agentsMd)) {
    fs.unlinkSync(agentsMd);
  }
  // Clean up legacy directories no longer generated
  for (const legacy of ['.claude/skills', '.cursor/rules']) {
    const dir = path.join(REPO_ROOT, legacy);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
}

interface SkillContext {
  config: SkillConfig;
  endpoints: Endpoint[];
  allEndpoints: Endpoint[];
  baseUrl: string;
  allSkills: SkillConfig[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function generateAllSkills(api: ParsedAPI) {
  cleanOutputDirs();

  const baseUrl = api.servers[0]?.url || 'https://api.pachca.com/api/shared/v1';
  const skillEndpoints = groupEndpointsBySkill(api.endpoints);
  const results: { path: string; content: string }[] = [];

  for (const config of SKILL_TAG_MAP) {
    if (config.description.length > 1024) {
      console.warn(
        `⚠ ${config.name}: description ${config.description.length} chars (max 1024 per RFC)`
      );
    }

    const endpoints = skillEndpoints.get(config.name) || [];
    const ctx: SkillContext = {
      config,
      endpoints,
      allEndpoints: api.endpoints,
      baseUrl,
      allSkills: SKILL_TAG_MAP,
    };

    const skillMd = generateSkillMd(ctx);

    const basePaths = [
      `skills/${config.name}`,
      `apps/docs/public/.well-known/skills/${config.name}`,
    ];

    for (const base of basePaths) {
      results.push({ path: `${base}/SKILL.md`, content: skillMd });
    }

    // Generate inline:false workflow reference files
    const workflows = WORKFLOWS[config.name] || [];
    const refWorkflows = workflows.filter((wf) => wf.inline === false);
    for (const wf of refWorkflows) {
      const slug = slugify(wf.titleEn || wf.title);
      const refMd = renderCLIWorkflow(wf, 'en');
      for (const base of basePaths) {
        results.push({ path: `${base}/references/${slug}.md`, content: refMd });
      }
    }

    if (config.name === 'pachca-bots') {
      const webhookEventsMd = generateWebhookEventsMd();
      for (const base of basePaths) {
        results.push({ path: `${base}/references/webhook-events.md`, content: webhookEventsMd });
      }
    }

    // Validation
    const lineCount = skillMd.split('\n').length;
    if (lineCount > 500) {
      console.warn(`⚠ ${config.name}/SKILL.md: ${lineCount} lines (exceeds 500 line limit)`);
    }
    const tokenEstimate = Math.round(skillMd.split(/\s+/).length * 1.3);
    if (tokenEstimate > 5000) {
      console.warn(`⚠ ${config.name}/SKILL.md: ~${tokenEstimate} tokens (exceeds 5000 limit)`);
    } else if (tokenEstimate > 4000) {
      console.warn(`⚠ ${config.name}/SKILL.md: ~${tokenEstimate} tokens (exceeds 4000 target)`);
    }

    // Validate workflow steps
    for (const wf of workflows) {
      if (wf.inline !== false && wf.steps.length > 3) {
        console.warn(
          `⚠ ${config.name}: scenario "${wf.title}" has ${wf.steps.length} steps in SKILL.md (max 3, consider inline: false)`
        );
      }
      for (const step of wf.steps) {
        if (step.apiMethod && !step.command) {
          console.warn(
            `⚠ ${config.name}: step "${step.description.slice(0, 50)}" has API method but no command`
          );
        }
      }
    }
  }

  const knownNames = new Set(SKILL_TAG_MAP.map((c) => c.name));
  for (const [name, endpoints] of skillEndpoints) {
    if (knownNames.has(name) || endpoints.length === 0) continue;

    const fallbackConfig: SkillConfig = {
      name,
      tags: [],
      description: `Auto-discovered skill: ${name}.`,
      triggers: endpoints.map((ep) => ep.summary || `${ep.method} ${ep.path}`),
      negativeTriggers: [],
    };
    const ctx: SkillContext = {
      config: fallbackConfig,
      endpoints,
      allEndpoints: api.endpoints,
      baseUrl,
      allSkills: SKILL_TAG_MAP,
    };
    const skillMd = generateSkillMd(ctx);
    for (const base of [`skills/${name}`, `apps/docs/public/.well-known/skills/${name}`]) {
      results.push({ path: `${base}/SKILL.md`, content: skillMd });
    }
    console.warn(`⚠ Created fallback skill "${name}" with ${endpoints.length} endpoints`);
  }

  // Generate router skill
  const routerMd = generateRouterSkillMd();
  for (const base of ['skills/pachca', 'apps/docs/public/.well-known/skills/pachca']) {
    results.push({ path: `${base}/SKILL.md`, content: routerMd });
  }

  results.push({
    path: 'apps/docs/public/.well-known/skills/index.json',
    content: generateIndexJson(),
  });
  results.push({ path: 'AGENTS.md', content: generateAgentsMd(baseUrl) });

  return results;
}

function groupEndpointsBySkill(endpoints: Endpoint[]) {
  const result = new Map<string, Endpoint[]>();
  for (const config of SKILL_TAG_MAP) {
    result.set(config.name, []);
  }

  for (const ep of endpoints) {
    const tag = ep.tags[0] || 'Common';
    let assigned = false;

    if (tag === 'Common') {
      for (const [pathPrefix, skillName] of Object.entries(COMMON_ENDPOINT_MAP)) {
        if (ep.path === pathPrefix || ep.path.startsWith(pathPrefix + '/')) {
          result.get(skillName)?.push(ep);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        result.get('pachca-profile')?.push(ep);
      }
      continue;
    }

    for (const config of SKILL_TAG_MAP) {
      if (config.tags.includes(tag)) {
        result.get(config.name)?.push(ep);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      const fallbackName = `pachca-${tag.toLowerCase().replace(/\s+/g, '-')}`;
      console.warn(`⚠ Unassigned tag "${tag}" → fallback skill "${fallbackName}"`);
      if (!result.has(fallbackName)) {
        result.set(fallbackName, []);
      }
      result.get(fallbackName)?.push(ep);
    }
  }

  return result;
}

function renderCLIWorkflow(workflow: Workflow, lang: 'ru' | 'en' = 'ru'): string {
  const title = lang === 'en' ? workflow.titleEn || workflow.title : workflow.title;
  let md = `### ${title}\n\n`;

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const desc = lang === 'en' ? step.descriptionEn || step.description : step.description;
    const notes = lang === 'en' ? step.notesEn || step.notes : step.notes;
    md += `${i + 1}. ${desc}`;
    if (step.command) {
      md += `:\n   \`\`\`bash\n   ${step.command}\n   \`\`\``;
    }
    md += '\n';
    if (notes) {
      md += `   > ${notes}\n`;
    }
    md += '\n';
  }

  const wfNotes = lang === 'en' ? workflow.notesEn || workflow.notes : workflow.notes;
  if (wfNotes) {
    md += `> ${wfNotes}\n\n`;
  }

  return md;
}

function generateSkillMd(ctx: SkillContext): string {
  const { config, endpoints } = ctx;
  const allWorkflows = WORKFLOWS[config.name] || [];
  const inlineWorkflows = allWorkflows.filter((wf) => wf.inline !== false);
  const refWorkflows = allWorkflows.filter((wf) => wf.inline === false);

  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${config.name}`);
  lines.push(`description: >`);
  const descLines = config.description.match(/.{1,80}(\s|$)/g) || [config.description];
  for (const dl of descLines) {
    lines.push(`  ${dl.trim()}`);
  }
  lines.push('allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)');
  lines.push('---');
  lines.push('');

  // Header
  lines.push(`# ${config.name}`);
  lines.push('');

  // Quick start (zero-friction)
  lines.push('## Quick start');
  lines.push('');
  lines.push(
    'Ask user for Pachca token (bot: Automations → Integrations → API, or user: Automations → API).'
  );
  if (config.botOnly) {
    lines.push('**Bot only** — user token will not work.');
  }
  lines.push('');
  lines.push('Run commands with `npx @pachca/cli` and `--token` flag:');
  lines.push('');
  lines.push('    npx @pachca/cli <command> --token $PACHCA_TOKEN');
  lines.push('');
  lines.push('Or set `PACHCA_TOKEN` for multiple commands:');
  lines.push('');
  lines.push('    export PACHCA_TOKEN=<token>');
  lines.push('    npx @pachca/cli <command>');
  lines.push('');
  lines.push('Help: `npx @pachca/cli --help` | Scenarios: `npx @pachca/cli guide`');
  lines.push('');
  lines.push(
    '> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`'
  );
  lines.push('');

  // Preflight check
  lines.push('## Before you start');
  lines.push('');
  lines.push('1. If user has a saved profile — check status:');
  lines.push('');
  lines.push('       npx @pachca/cli auth status');
  lines.push('');
  lines.push('   If OK — use commands without `--token`.');
  lines.push('');
  lines.push('2. If profile is not configured — ask for token and use `--token` flag:');
  lines.push('');
  lines.push('       npx @pachca/cli auth status --token $PACHCA_TOKEN');
  lines.push('');
  lines.push("3. If you don't know command parameters — run `pachca <command> --help`.");
  lines.push('');

  // Inline workflows (max 3 steps)
  if (inlineWorkflows.length > 0) {
    lines.push('## Step-by-step scenarios');
    lines.push('');
    for (const wf of inlineWorkflows) {
      lines.push(renderCLIWorkflow(wf, 'en'));
    }
  }

  // Extra sections (e.g. event_key table for pachca-security)
  if (config.extraSections) {
    for (const section of config.extraSections) {
      lines.push(`## ${section.title}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }
  }

  // Gotchas (including rate limit and errors)
  const gotchas = extractGotchas(endpoints, config);
  if (gotchas.length > 0) {
    lines.push('## Constraints and gotchas');
    lines.push('');
    for (const gotcha of gotchas) {
      lines.push(`- ${gotcha}`);
    }
    lines.push('');
  }

  // Endpoints table
  if (endpoints.length > 0) {
    lines.push('## Endpoints');
    lines.push('');
    lines.push('| Method | Path | Description |');
    lines.push('|--------|------|-------------|');
    for (const ep of endpoints) {
      const title = generateTitle(ep);
      lines.push(`| ${ep.method} | ${ep.path} | ${title} |`);
    }
    lines.push('');
  }

  // Reference links for complex workflows
  if (refWorkflows.length > 0) {
    lines.push('## Complex scenarios');
    lines.push('');
    lines.push('For complex scenarios read files from references/:');
    for (const wf of refWorkflows) {
      const slug = slugify(wf.titleEn || wf.title);
      const title = wf.titleEn || wf.title;
      lines.push(`  references/${slug}.md — ${title}`);
    }
    lines.push('');
  }

  // Special reference files
  if (config.name === 'pachca-bots') {
    lines.push('  references/webhook-events.md — Webhook event types');
    lines.push('');
  }

  // Fallback instruction
  lines.push(
    "> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions."
  );
  lines.push('');

  return lines.join('\n');
}

/** Resolve allOf/oneOf/anyOf to a flat schema (first match wins). */
function resolveComposed(schema: Schema): Schema {
  if (schema.allOf?.length) {
    let merged: Schema = {};
    for (const sub of schema.allOf) {
      merged = { ...merged, ...sub };
    }
    if (schema.description) merged.description = schema.description;
    if (schema.example !== undefined) merged.example = schema.example;
    return merged;
  }
  if (schema.oneOf?.length) return schema.oneOf[0];
  if (schema.anyOf?.length) return schema.anyOf[0];
  return schema;
}

function collectSchemaGotchas(
  properties: Record<string, Schema>,
  seen: Set<string>,
  gotchas: string[],
  prefix = ''
): void {
  for (const [name, rawProp] of Object.entries(properties)) {
    const prop = resolveComposed(rawProp);
    const fullName = prefix ? `${prefix}.${name}` : name;

    if (prop.enum && prop.enum.length > 0) {
      const key = `enum:${fullName}`;
      if (!seen.has(key)) {
        seen.add(key);
        const enumDescriptions = prop['x-enum-descriptions'];
        const values = prop.enum
          .map((v) => {
            const key = v as string;
            const desc = enumDescriptions?.[key];
            return desc ? `\`${key}\` (${desc})` : `\`${key}\``;
          })
          .join(', ');
        gotchas.push(`\`${fullName}\`: allowed values — ${values}`);
      }
    }
    if (prop.maxLength) {
      const key = `maxLength:${fullName}`;
      if (!seen.has(key)) {
        seen.add(key);
        gotchas.push(`\`${fullName}\`: max ${prop.maxLength} characters`);
      }
    }
    if (prop.type === 'object' && prop.properties) {
      collectSchemaGotchas(prop.properties, seen, gotchas, fullName);
    }
  }
}

function extractGotchas(endpoints: Endpoint[], config: SkillConfig): string[] {
  const gotchas: string[] = [];
  const seen = new Set<string>();

  if (config.name === 'pachca-messages') {
    gotchas.push('Rate limit: ~50 req/sec, messages ~4 req/sec. On 429 — wait and retry.');
  } else {
    gotchas.push('Rate limit: ~50 req/sec. On 429 — wait and retry.');
  }

  if (config.errors) {
    for (const err of config.errors) {
      gotchas.push(`${err.code}: ${err.reason}. ${err.action}`);
    }
  }

  for (const ep of endpoints) {
    if (ep.requestBody) {
      const jsonContent = ep.requestBody.content['application/json'];
      if (jsonContent?.schema) {
        const resolved = resolveComposed(jsonContent.schema);
        if (resolved.properties) {
          collectSchemaGotchas(resolved.properties, seen, gotchas);
        }
      }
    }
  }

  const paramMaximums = new Map<string, { max: number; endpoint: string }[]>();
  for (const ep of endpoints) {
    const queryParams = ep.parameters.filter((p) => p.in === 'query');
    for (const p of queryParams) {
      if (p.schema?.maximum) {
        const entries = paramMaximums.get(p.name) ?? [];
        entries.push({
          max: p.schema.maximum as number,
          endpoint: `${ep.method.toUpperCase()} ${ep.path}`,
        });
        paramMaximums.set(p.name, entries);
      }
    }
  }

  for (const [name, entries] of paramMaximums) {
    const uniqueValues = [...new Set(entries.map((e) => e.max))];
    if (uniqueValues.length === 1) {
      gotchas.push(`\`${name}\`: max ${uniqueValues[0]}`);
    } else {
      const details = entries.map((e) => `${e.max} (${e.endpoint})`).join(', ');
      gotchas.push(`\`${name}\`: max — ${details}`);
    }
  }

  const hasGetEndpoints = endpoints.some((ep) => ep.method === 'GET');
  if (hasGetEndpoints) {
    gotchas.push('Pagination: cursor-based (limit + cursor)');
  }

  if (config.extraGotchas) {
    for (const g of config.extraGotchas) {
      gotchas.push(g);
    }
  }

  return gotchas;
}

function generateWebhookEventsMd(): string {
  const lines: string[] = [];

  lines.push('# Webhook event types');
  lines.push('');
  lines.push('Outgoing webhooks send JSON to specified URL when events occur.');
  lines.push('Signature: `Pachca-Signature` (HMAC-SHA256 of request body with Signing secret).');
  lines.push('');

  lines.push('## New messages');
  lines.push('');
  lines.push('Sent when a new message appears in a chat where the bot is a member.');
  lines.push('Can filter by commands (message prefix).');
  lines.push('');
  lines.push('```json');
  lines.push(
    JSON.stringify(
      {
        event: 'new',
        type: 'message',
        webhook_timestamp: 1744618734,
        chat_id: 918264,
        content: 'Текст сообщения',
        user_id: 134412,
        id: 56431,
        created_at: '2025-04-14T08:18:54.000Z',
        parent_message_id: null,
        entity_type: 'discussion',
        entity_id: 918264,
        thread: null,
        url: 'https://app.pachca.com/chats/124511?message=56431',
      },
      null,
      2
    )
  );
  lines.push('```');
  lines.push('');

  lines.push('## Reaction add/remove');
  lines.push('');
  lines.push('Sent when a reaction is added/removed in a chat where the bot is a member.');
  lines.push(
    'Fields: `event` (add/remove), `type` (reaction), `code` (emoji), `message_id`, `user_id`.'
  );
  lines.push('');

  lines.push('## Button clicks');
  lines.push('');
  lines.push('Sent when a Data-button in bot message is clicked.');
  lines.push('Contains `trigger_id` for opening forms via `POST /views/open`.');
  lines.push('');

  lines.push('## Chat member changes');
  lines.push('');
  lines.push('Sent when members are added/removed in chats where the bot is a member.');
  lines.push('');

  lines.push('## Space member changes');
  lines.push('');
  lines.push(
    'Global event (does not require bot in chat). Events: invite, confirm, update, suspend, activate, delete.'
  );
  lines.push('');

  lines.push('## Security');
  lines.push('');
  lines.push('1. Verify signature: `HMAC-SHA256(Signing secret, raw body)` === `Pachca-Signature`');
  lines.push('2. Check `webhook_timestamp` — must be within 1 minute');
  lines.push('3. Verify sender IP: `37.200.70.177`');
  lines.push('');
  lines.push('```javascript');
  lines.push(
    'const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");'
  );
  lines.push("if (signature !== request.headers['pachca-signature']) {");
  lines.push('  throw "Invalid signature";');
  lines.push('}');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function generateRouterSkillMd(): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push(`name: ${ROUTER_SKILL_CONFIG.name}`);
  lines.push('description: >');
  const descLines = ROUTER_SKILL_CONFIG.description.match(/.{1,80}(\s|$)/g) || [
    ROUTER_SKILL_CONFIG.description,
  ];
  for (const dl of descLines) {
    lines.push(`  ${dl.trim()}`);
  }
  lines.push('allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)');
  lines.push('---');
  lines.push('');
  lines.push('# pachca');
  lines.push('');
  lines.push('Pachca — corporate messenger with REST API and CLI.');
  lines.push('');
  lines.push('## Quick start (zero-install)');
  lines.push('');
  lines.push('```bash');
  lines.push('npx @pachca/cli <command> --token <TOKEN>');
  lines.push('```');
  lines.push('');
  lines.push('## For regular use');
  lines.push('');
  lines.push('```bash');
  lines.push('npm install -g @pachca/cli && pachca auth login');
  lines.push('```');
  lines.push('');
  lines.push('## Routing');
  lines.push('');
  lines.push("Match the user's task to the right skill below, then activate it.");
  lines.push('');
  lines.push('| User task | Skill |');
  lines.push('|-----------|-------|');
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    lines.push(`| ${shortDesc} | Use \`${config.name}\` |`);
  }
  lines.push('');
  lines.push('## CLI commands');
  lines.push('');
  lines.push('Full list: `pachca commands`');
  lines.push('Complex scenarios: see references/ in each skill');
  lines.push('Help: `pachca <command> --help`');
  lines.push('');

  return lines.join('\n');
}

function generateIndexJson(): string {
  const skills = SKILL_TAG_MAP.map((config) => {
    const workflows = WORKFLOWS[config.name] || [];
    const refWorkflows = workflows.filter((wf) => wf.inline === false);
    const files = ['SKILL.md'];
    for (const wf of refWorkflows) {
      files.push(`references/${slugify(wf.titleEn || wf.title)}.md`);
    }
    if (config.name === 'pachca-bots') {
      files.push('references/webhook-events.md');
    }
    return {
      name: config.name,
      description: config.description.slice(0, 1024),
      files,
    };
  });

  // Add router and lite skills
  skills.push({
    name: ROUTER_SKILL_CONFIG.name,
    description: ROUTER_SKILL_CONFIG.description.slice(0, 1024),
    files: ['SKILL.md'],
  });
  const index = {
    repository: 'pachca/openapi',
    install: 'npx skills add pachca/openapi',
    documentation: 'https://dev.pachca.com',
    skills,
  };

  return JSON.stringify(index, null, 2) + '\n';
}

function generateAgentsMd(_baseUrl: string): string {
  const lines: string[] = [];

  lines.push('# Pachca API — Agent Skills');
  lines.push('');
  lines.push('Pachca — corporate messenger with REST API and CLI.');
  lines.push('');
  lines.push('## Quick start (zero-install)');
  lines.push('');
  lines.push('```bash');
  lines.push('npx @pachca/cli <command> --token <TOKEN>');
  lines.push('```');
  lines.push('');
  lines.push('For regular use:');
  lines.push('');
  lines.push('```bash');
  lines.push('npm install -g @pachca/cli && pachca auth login');
  lines.push('```');
  lines.push('');
  lines.push('## Auth');
  lines.push('');
  lines.push(
    '`--token <TOKEN>` flag or `PACHCA_TOKEN` env var. Get token: Settings → Automations → API (admin) or bot settings (bot).'
  );
  lines.push('');
  lines.push('## Routing');
  lines.push('');
  lines.push("Match the user's task to the right skill:");
  lines.push('');
  lines.push('| User task | Skill |');
  lines.push('|-----------|-------|');
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    lines.push(`| ${shortDesc} | \`${config.name}\` |`);
  }
  lines.push('');
  lines.push('## Top-5 operations');
  lines.push('');
  lines.push('```bash');
  for (let i = 0; i < TOP_OPERATIONS.length; i++) {
    const op = TOP_OPERATIONS[i];
    if (i > 0) lines.push('');
    lines.push(`# ${op.comment}`);
    lines.push(op.command);
  }
  lines.push('```');
  lines.push('');
  lines.push('## Available skills');
  lines.push('');
  lines.push('| Skill | Description | Path |');
  lines.push('|-------|-------------|------|');
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    lines.push(
      `| ${config.name} | ${shortDesc} | [skills/${config.name}/SKILL.md](skills/${config.name}/SKILL.md) |`
    );
  }
  lines.push('');
  lines.push('## Key constraints');
  lines.push('');
  lines.push(
    '- Rate limit: ~4 req/sec per chat (messages), ~50 req/sec (other). Respect `Retry-After` on 429.'
  );
  lines.push('- Pagination: cursor-based (`limit` + `cursor`). Check `meta.paginate.next_page`.');
  lines.push('- Admin operations (user/tag management, message deletion) require admin token.');
  lines.push('');
  lines.push('## Install');
  lines.push('');
  lines.push('```bash');
  lines.push('npx skills add pachca/openapi');
  lines.push('```');
  lines.push('');
  lines.push(
    'More: [API docs](https://dev.pachca.com) · [Full reference](https://dev.pachca.com/llms-full.txt) · [OpenAPI spec](https://dev.pachca.com/openapi.yaml) · CLI help: `pachca --help`'
  );
  lines.push('');

  return lines.join('\n');
}
