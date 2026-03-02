import fs from 'fs';
import path from 'path';
import type { Endpoint, Schema, ParsedAPI } from '../../lib/openapi/types';
import { generateTitle } from '../../lib/openapi/mapper';
import { generateCurl } from '../../lib/code-generators/curl';
import { SKILL_TAG_MAP, COMMON_ENDPOINT_MAP } from './config';
import type { SkillConfig } from './config';
import { WORKFLOWS } from './workflows';

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
  baseUrl: string;
  allSkills: SkillConfig[];
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
    const ctx: SkillContext = { config, endpoints, baseUrl, allSkills: SKILL_TAG_MAP };

    const skillMd = generateSkillMd(ctx);
    const endpointsMd = generateEndpointsMd(ctx);

    const basePaths = [
      `skills/${config.name}`,
      `apps/docs/public/.well-known/skills/${config.name}`,
    ];

    for (const base of basePaths) {
      results.push({ path: `${base}/SKILL.md`, content: skillMd });
      results.push({ path: `${base}/references/endpoints.md`, content: endpointsMd });
    }

    if (config.name === 'pachca-bots') {
      const webhookEventsMd = generateWebhookEventsMd();
      for (const base of basePaths) {
        results.push({ path: `${base}/references/webhook-events.md`, content: webhookEventsMd });
      }
    }

    const tokenEstimate = Math.round(skillMd.split(/\s+/).length * 1.3);
    if (tokenEstimate > 5000) {
      console.warn(`⚠ ${config.name}/SKILL.md: ~${tokenEstimate} tokens (exceeds 5000 limit)`);
    } else if (tokenEstimate > 4000) {
      console.warn(`⚠ ${config.name}/SKILL.md: ~${tokenEstimate} tokens (exceeds 4000 target)`);
    }
  }

  const knownNames = new Set(SKILL_TAG_MAP.map((c) => c.name));
  for (const [name, endpoints] of skillEndpoints) {
    if (knownNames.has(name) || endpoints.length === 0) continue;

    const fallbackConfig: SkillConfig = {
      name,
      tags: [],
      description: `Автоматически обнаруженный скилл: ${name}.`,
      triggers: endpoints.map((ep) => ep.summary || `${ep.method} ${ep.path}`),
      negativeTriggers: [],
    };
    const ctx: SkillContext = {
      config: fallbackConfig,
      endpoints,
      baseUrl,
      allSkills: SKILL_TAG_MAP,
    };
    const skillMd = generateSkillMd(ctx);
    const endpointsMd = generateEndpointsMd(ctx);
    for (const base of [`skills/${name}`, `apps/docs/public/.well-known/skills/${name}`]) {
      results.push({ path: `${base}/SKILL.md`, content: skillMd });
      results.push({ path: `${base}/references/endpoints.md`, content: endpointsMd });
    }
    console.warn(`⚠ Created fallback skill "${name}" with ${endpoints.length} endpoints`);
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

function generateSkillMd(ctx: SkillContext): string {
  const { config, endpoints, baseUrl, allSkills } = ctx;
  const workflows = WORKFLOWS[config.name] || [];

  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`name: ${config.name}`);
  lines.push(`description: >`);
  const descLines = config.description.match(/.{1,80}(\s|$)/g) || [config.description];
  for (const dl of descLines) {
    lines.push(`  ${dl.trim()}`);
  }
  lines.push('allowed-tools: Bash(curl *)');
  lines.push('---');
  lines.push('');

  // Header + auth
  lines.push(`# ${config.name}`);
  lines.push('');
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push('Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`');
  if (config.botOnly) {
    lines.push(
      'Токен: **только бот** (Автоматизации → Интеграции → API). Пользовательский токен не подойдёт — формы требуют исходящий вебхук.'
    );
  } else {
    lines.push(
      'Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).'
    );
  }
  lines.push('Если токен неизвестен — спроси у пользователя перед выполнением запросов.');
  lines.push('');

  // "Когда НЕ использовать" — only nearest alternatives
  const nearestAlts = config.nearestAlternatives || [];
  if (nearestAlts.length > 0) {
    lines.push('## Когда НЕ использовать');
    lines.push('');
    for (const altEntry of nearestAlts) {
      if (typeof altEntry === 'string') {
        const alt = allSkills.find((s) => s.name === altEntry);
        if (alt) {
          const altTriggers = alt.triggers.slice(0, 3).join(', ');
          lines.push(`- ${altTriggers} → **${alt.name}**`);
        }
      } else {
        lines.push(`- ${altEntry.text} → **${altEntry.name}**`);
      }
    }
    lines.push('');
  }

  // Workflows
  if (workflows.length > 0) {
    lines.push('## Пошаговые сценарии');
    lines.push('');
    for (const wf of workflows) {
      lines.push(`### ${wf.title}`);
      lines.push('');
      for (let i = 0; i < wf.steps.length; i++) {
        lines.push(`${i + 1}. ${wf.steps[i]}`);
      }
      if (wf.curl) {
        lines.push('');
        lines.push('```bash');
        lines.push(wf.curl);
        lines.push('```');
      }
      if (wf.notes) {
        lines.push('');
        lines.push(`> ${wf.notes}`);
      }
      lines.push('');
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

  // Gotchas (including rate limit and errors — replaces old "Обработка ошибок" section)
  const gotchas = extractGotchas(endpoints, config);
  if (gotchas.length > 0) {
    lines.push('## Ограничения и gotchas');
    lines.push('');
    for (const gotcha of gotchas) {
      lines.push(`- ${gotcha}`);
    }
    lines.push('');
  }

  // Endpoints table (replaces old multi-line "Доступные операции" section)
  if (endpoints.length > 0) {
    lines.push('## Эндпоинты');
    lines.push('');
    lines.push('| Метод | Путь | Скоуп |');
    lines.push('|-------|------|-------|');
    for (const ep of endpoints) {
      const parts: string[] = [];
      if (ep.requirements?.scope) parts.push(ep.requirements.scope);
      if (ep.requirements?.plan) {
        const planNames: Record<string, string> = { corporation: 'Корпорация' };
        parts.push(`тариф: ${planNames[ep.requirements.plan] ?? ep.requirements.plan}`);
      }
      const scope = parts.length > 0 ? parts.join(' · ') : '—';
      lines.push(`| ${ep.method} | ${ep.path} | ${scope} |`);
    }
    lines.push('');
  }

  // Reference link
  lines.push('## Подробнее');
  lines.push('');
  lines.push('см. [references/endpoints.md](references/endpoints.md)');
  lines.push('');

  return lines.join('\n');
}

/** Resolve allOf/oneOf/anyOf to a flat schema (first match wins). */
function resolveComposed(schema: Schema): Schema {
  if (schema.allOf?.length) {
    // Merge all allOf schemas into one
    let merged: Schema = {};
    for (const sub of schema.allOf) {
      merged = { ...merged, ...sub };
    }
    // Preserve top-level description/example if present
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
        gotchas.push(`\`${fullName}\`: допустимые значения — ${values}`);
      }
    }
    if (prop.maxLength) {
      const key = `maxLength:${fullName}`;
      if (!seen.has(key)) {
        seen.add(key);
        gotchas.push(`\`${fullName}\`: максимум ${prop.maxLength} символов`);
      }
    }
    // Recurse into nested objects
    if (prop.type === 'object' && prop.properties) {
      collectSchemaGotchas(prop.properties, seen, gotchas, fullName);
    }
  }
}

function extractGotchas(endpoints: Endpoint[], config: SkillConfig): string[] {
  const gotchas: string[] = [];
  const seen = new Set<string>();

  // Rate limit (replaces the old error table)
  if (config.name === 'pachca-messages') {
    gotchas.push('Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.');
  } else {
    gotchas.push('Rate limit: ~50 req/sec. При 429 — подожди и повтори.');
  }

  // Skill-specific errors
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

  // Collect all maximum values per query parameter across endpoints
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
      gotchas.push(`\`${name}\`: максимум ${uniqueValues[0]}`);
    } else {
      const details = entries.map((e) => `${e.max} (${e.endpoint})`).join(', ');
      gotchas.push(`\`${name}\`: максимум — ${details}`);
    }
  }

  // Pagination — only if there are GET endpoints (skip for e.g. pachca-forms with only POST)
  const hasGetEndpoints = endpoints.some((ep) => ep.method === 'GET');
  if (hasGetEndpoints) {
    gotchas.push('Пагинация: cursor-based (limit + cursor), НЕ page-based');
  }

  // Extra manually defined gotchas from config
  if (config.extraGotchas) {
    for (const g of config.extraGotchas) {
      gotchas.push(g);
    }
  }

  return gotchas;
}

function generateEndpointsMd(ctx: SkillContext): string {
  const { config, endpoints, baseUrl } = ctx;
  const lines: string[] = [];

  lines.push(`# ${config.name} — Справочник эндпоинтов`);
  lines.push('');

  for (const ep of endpoints) {
    const title = generateTitle(ep);
    lines.push(`## ${title}`);
    lines.push('');
    lines.push(`**${ep.method}** \`${ep.path}\``);
    lines.push('');
    if (ep.requirements?.scope || ep.requirements?.plan) {
      const planNames: Record<string, string> = { corporation: 'Корпорация' };
      const parts: string[] = [];
      if (ep.requirements.scope) parts.push(`Скоуп: \`${ep.requirements.scope}\``);
      if (ep.requirements.plan)
        parts.push(`Тариф: **${planNames[ep.requirements.plan] ?? ep.requirements.plan}**`);
      lines.push(`> ${parts.join(' · ')}`);
      lines.push('');
    }

    if (ep.description) {
      lines.push(
        ep.description
          .split('\n')
          .filter((l) => !l.startsWith('#'))
          .join('\n')
          .trim()
      );
      lines.push('');
    }

    if (ep.parameters.length > 0) {
      lines.push('**Параметры:**');
      lines.push('');
      for (const p of ep.parameters) {
        const req = p.required ? '**обязательный**' : 'опциональный';
        const type = p.schema?.type || 'string';
        lines.push(`- \`${p.name}\` (${p.in}, ${type}, ${req}): ${p.description || ''}`);
        if (p.schema?.enum) {
          lines.push(`  - Значения: ${p.schema.enum.map((v) => `\`${v}\``).join(', ')}`);
        }
      }
      lines.push('');
    }

    if (ep.requestBody) {
      const jsonContent = ep.requestBody.content['application/json'];
      if (jsonContent?.schema?.properties) {
        lines.push('**Тело запроса** (`application/json`):');
        lines.push('');
        renderSchemaProps(lines, jsonContent.schema, 0);
        lines.push('');
      }
    }

    lines.push('**Пример:**');
    lines.push('');
    lines.push('```bash');
    lines.push(generateCurl(ep, baseUrl));
    lines.push('```');
    lines.push('');

    const successResp = ep.responses['200'] || ep.responses['201'] || ep.responses['204'];
    if (successResp?.content?.['application/json']?.schema) {
      const respSchema = successResp.content['application/json'].schema;
      if (respSchema.properties) {
        lines.push('**Ответ:**');
        lines.push('');
        renderSchemaProps(lines, respSchema, 0);
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  // Extra endpoint content (e.g. form block types for pachca-forms)
  if (config.extraEndpointContent) {
    lines.push(config.extraEndpointContent);
    lines.push('');
  }

  return lines.join('\n');
}

function renderSchemaProps(lines: string[], schema: Schema, depth: number) {
  if (!schema.properties || depth > 3) return;
  const indent = '  '.repeat(depth);
  const required = schema.required || [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const req = required.includes(name) ? '**обязательный**' : 'опциональный';
    let type = prop.type || 'object';
    if (prop.enum) {
      type += ` (${prop.enum.map((v) => `\`${v}\``).join(' | ')})`;
    }
    if (prop.type === 'array' && prop.items?.type) {
      type = `array[${prop.items.type}]`;
    }
    lines.push(`${indent}- \`${name}\` (${type}, ${req}): ${prop.description || ''}`);

    if (prop.type === 'object' && prop.properties) {
      renderSchemaProps(lines, prop, depth + 1);
    }
    if (prop.type === 'array' && prop.items?.properties) {
      renderSchemaProps(lines, prop.items, depth + 1);
    }
  }
}

function generateWebhookEventsMd(): string {
  const lines: string[] = [];

  lines.push('# Типы событий Webhook');
  lines.push('');
  lines.push('Исходящие вебхуки отправляют JSON на указанный URL при наступлении событий.');
  lines.push('Подпись: `Pachca-Signature` (HMAC-SHA256 от тела запроса с Signing secret).');
  lines.push('');

  lines.push('## Новые сообщения');
  lines.push('');
  lines.push('Отправляется при новом сообщении в чате, где участвует бот.');
  lines.push('Можно фильтровать по командам (начало сообщения).');
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

  lines.push('## Добавление и удаление реакций');
  lines.push('');
  lines.push('Отправляется при добавлении/удалении реакции в чате, где участвует бот.');
  lines.push(
    'Поля: `event` (add/remove), `type` (reaction), `code` (emoji), `message_id`, `user_id`.'
  );
  lines.push('');

  lines.push('## Нажатие кнопок');
  lines.push('');
  lines.push('Отправляется при нажатии Data-кнопки в сообщении бота.');
  lines.push('Содержит `trigger_id` для открытия форм через `POST /views/open`.');
  lines.push('');

  lines.push('## Изменение состава участников чатов');
  lines.push('');
  lines.push('Отправляется при добавлении/удалении участников в чатах, где состоит бот.');
  lines.push('');

  lines.push('## Изменение состава участников пространства');
  lines.push('');
  lines.push(
    'Глобальное событие (не требует добавления бота в чат). События: invite, confirm, update, suspend, activate, delete.'
  );
  lines.push('');

  lines.push('## Безопасность');
  lines.push('');
  lines.push('1. Проверь подпись: `HMAC-SHA256(Signing secret, raw body)` === `Pachca-Signature`');
  lines.push('2. Проверь `webhook_timestamp` — должен быть в пределах 1 минуты');
  lines.push('3. Проверь IP отправителя: `37.200.70.177`');
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

function generateIndexJson(): string {
  const skills = SKILL_TAG_MAP.map((config) => {
    const files = ['SKILL.md', 'references/endpoints.md'];
    if (config.name === 'pachca-bots') {
      files.push('references/webhook-events.md');
    }
    return {
      name: config.name,
      description: config.description.slice(0, 1024),
      files,
    };
  });

  const index = {
    repository: 'pachca/openapi',
    install: 'npx skills add pachca/openapi',
    documentation: 'https://dev.pachca.com',
    skills,
  };

  return JSON.stringify(index, null, 2) + '\n';
}

function generateAgentsMd(baseUrl: string): string {
  const lines: string[] = [];

  lines.push('# Pachca API — Agent Skills');
  lines.push('');
  lines.push(
    'Этот репозиторий содержит скиллы для AI-агентов для работы с [API Пачки](https://dev.pachca.com).'
  );
  lines.push('');
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push('Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`');
  lines.push('');
  lines.push('## Доступные скиллы');
  lines.push('');
  lines.push('| Скилл | Описание | Путь |');
  lines.push('|-------|---------|------|');
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    lines.push(
      `| ${config.name} | ${shortDesc} | [skills/${config.name}/SKILL.md](skills/${config.name}/SKILL.md) |`
    );
  }
  lines.push('');
  lines.push('## Установка');
  lines.push('');
  lines.push('```bash');
  lines.push('npx skills add pachca/openapi');
  lines.push('```');
  lines.push('');
  lines.push(
    'Подробнее: [документация API](https://dev.pachca.com), [OpenAPI спецификация](https://dev.pachca.com/openapi.yaml)'
  );
  lines.push('');

  return lines.join('\n');
}
