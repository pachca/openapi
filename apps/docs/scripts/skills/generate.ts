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
  path.join(REPO_ROOT, '.claude/skills'),
  path.join(REPO_ROOT, '.cursor/rules'),
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
      `.claude/skills/${config.name}`,
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
      title: name.replace('pachca-', '').replace(/-/g, ' '),
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
    for (const base of [
      `skills/${name}`,
      `.claude/skills/${name}`,
      `apps/docs/public/.well-known/skills/${name}`,
    ]) {
      results.push({ path: `${base}/SKILL.md`, content: skillMd });
      results.push({ path: `${base}/references/endpoints.md`, content: endpointsMd });
    }
    console.warn(`⚠ Created fallback skill "${name}" with ${endpoints.length} endpoints`);
  }

  const overviewMd = generateOverviewSkillMd(baseUrl);
  for (const base of ['skills/default', 'apps/docs/public/.well-known/skills/default']) {
    results.push({ path: `${base}/SKILL.md`, content: overviewMd });
  }

  results.push({
    path: 'apps/docs/public/.well-known/skills/index.json',
    content: generateIndexJson(),
  });
  results.push({ path: 'AGENTS.md', content: generateAgentsMd(baseUrl) });
  results.push({
    path: '.cursor/rules/pachca-api.mdc',
    content: generateCursorMdc(baseUrl),
  });

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
  const siblings = allSkills.filter((s) => s.name !== config.name);

  const lines: string[] = [];

  lines.push('---');
  lines.push(`name: ${config.name}`);
  lines.push(`description: >`);
  const descLines = config.description.match(/.{1,80}(\s|$)/g) || [config.description];
  for (const dl of descLines) {
    lines.push(`  ${dl.trim()}`);
  }
  lines.push('---');
  lines.push('');

  lines.push(`# ${config.title}`);
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
  lines.push('');

  lines.push('## Когда использовать');
  lines.push('');
  for (const trigger of config.triggers) {
    lines.push(`- ${trigger}`);
  }
  lines.push('');

  lines.push('## Когда НЕ использовать');
  lines.push('');
  for (const sibling of siblings) {
    const sibTriggers = sibling.triggers.slice(0, 3).join(', ');
    lines.push(`- ${sibTriggers} → **${sibling.name}**`);
  }
  lines.push('');

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

  lines.push('## Обработка ошибок');
  lines.push('');
  lines.push('| Код | Причина | Что делать |');
  lines.push('|-----|---------|------------|');
  lines.push(
    '| 422 | Неверные параметры | Проверь обязательные поля, типы данных, допустимые значения enum |'
  );
  lines.push('| 429 | Rate limit | Подожди и повтори. Лимит: ~50 req/sec, сообщения ~4 req/sec |');
  lines.push('| 403 | Нет доступа | Бот не в чате, или endpoint только для админов/владельцев |');
  lines.push('| 404 | Не найдено | Неверный id. Проверь что сущность существует |');
  lines.push('| 401 | Не авторизован | Проверь токен в заголовке Authorization |');
  if (config.errors) {
    for (const err of config.errors) {
      lines.push(`| ${err.code} | ${err.reason} | ${err.action} |`);
    }
  }
  lines.push('');

  lines.push('## Доступные операции');
  lines.push('');
  for (const ep of endpoints) {
    const title = generateTitle(ep);
    lines.push(`### ${title}`);
    lines.push('');
    lines.push(`\`${ep.method} ${ep.path}\``);
    lines.push('');
    if (ep.description) {
      const firstLine = ep.description.split('\n')[0].trim();
      if (firstLine !== title) {
        lines.push(firstLine);
        lines.push('');
      }
    }

    const requiredBody = generateRequiredBodyExample(ep);
    if (requiredBody) {
      lines.push('```json');
      lines.push(JSON.stringify(requiredBody, null, 2));
      lines.push('```');
      lines.push('');
    }
  }

  const gotchas = extractGotchas(endpoints);
  if (gotchas.length > 0) {
    lines.push('## Ограничения и gotchas');
    lines.push('');
    for (const gotcha of gotchas) {
      lines.push(`- ${gotcha}`);
    }
    lines.push('');
  }

  lines.push('## Подробнее');
  lines.push('');
  lines.push('см. [references/endpoints.md](references/endpoints.md)');
  lines.push('');

  return lines.join('\n');
}

function generateRequiredBodyExample(ep: Endpoint): unknown | null {
  if (!ep.requestBody) return null;
  const jsonContent = ep.requestBody.content['application/json'];
  if (!jsonContent?.schema) return null;

  return buildRequiredOnly(jsonContent.schema);
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

function buildFieldValue(fieldSchema: Schema): unknown {
  const resolved = resolveComposed(fieldSchema);

  if (resolved.example !== undefined) return resolved.example;

  if (resolved.enum?.length) return resolved.enum[0];

  if (resolved.type === 'object') {
    if (resolved.properties) {
      const nested = buildRequiredOnly(resolved);
      return nested || {};
    }
    return {};
  }
  if (resolved.type === 'array') return [];
  if (resolved.type === 'integer' || resolved.type === 'number') return 0;
  if (resolved.type === 'boolean') return false;
  return '';
}

function buildRequiredOnly(schema: Schema): Record<string, unknown> | null {
  const resolved = resolveComposed(schema);
  if (!resolved.properties) return null;
  const required = resolved.required || [];
  if (required.length === 0) return null;

  const result: Record<string, unknown> = {};
  for (const fieldName of required) {
    const fieldSchema = resolved.properties[fieldName];
    if (!fieldSchema) continue;
    result[fieldName] = buildFieldValue(fieldSchema);
  }

  return Object.keys(result).length > 0 ? result : null;
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
        gotchas.push(
          `\`${fullName}\`: допустимые значения — ${prop.enum.map((v) => `\`${v}\``).join(', ')}`
        );
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

function extractGotchas(endpoints: Endpoint[]): string[] {
  const gotchas: string[] = [];
  const seen = new Set<string>();

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

    const queryParams = ep.parameters.filter((p) => p.in === 'query');
    for (const p of queryParams) {
      if (p.schema?.maximum) {
        const key = `max:${p.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        gotchas.push(`\`${p.name}\`: максимум ${p.schema.maximum}`);
      }
    }
  }

  gotchas.push('Пагинация: cursor-based (limit + cursor), НЕ page-based');

  return gotchas;
}

function generateEndpointsMd(ctx: SkillContext): string {
  const { config, endpoints, baseUrl } = ctx;
  const lines: string[] = [];

  lines.push(`# ${config.title} — Справочник эндпоинтов`);
  lines.push('');

  for (const ep of endpoints) {
    const title = generateTitle(ep);
    lines.push(`## ${title}`);
    lines.push('');
    lines.push(`**${ep.method}** \`${ep.path}\``);
    lines.push('');

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

function generateOverviewSkillMd(baseUrl: string): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push('name: pachca-api');
  lines.push('description: >');
  lines.push('  REST API мессенджера Пачка. Управление сообщениями, чатами,');
  lines.push('  пользователями, ботами, задачами и безопасностью.');
  lines.push('  Используй этот скилл как точку входа для выбора нужного скилла.');
  lines.push('---');
  lines.push('');
  lines.push('# Пачка API');
  lines.push('');
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push('Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`');
  lines.push(
    'Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).'
  );
  lines.push('');
  lines.push('## Доступные скиллы');
  lines.push('');
  lines.push('| Скилл | Когда использовать |');
  lines.push('|-------|--------------------|');
  for (const config of SKILL_TAG_MAP) {
    const shortTriggers = config.triggers.slice(0, 3).join(', ');
    lines.push(`| [${config.name}](../${config.name}/SKILL.md) | ${shortTriggers} |`);
  }
  lines.push('');
  lines.push('## Быстрый старт');
  lines.push('');
  lines.push(
    '1. Получи токен: Автоматизации → Интеграции → API (бот) или Автоматизации → API (пользователь)'
  );
  lines.push('2. Определи задачу → выбери скилл из таблицы выше');
  lines.push('3. Открой SKILL.md нужного скилла → следуй пошаговому сценарию');
  lines.push('');
  lines.push('## Общие правила');
  lines.push('');
  lines.push('- Пагинация: cursor-based (`limit` + `cursor`), НЕ page-based');
  lines.push('- Rate limit: ~50 req/sec, сообщения ~4 req/sec');
  lines.push('- Формат: JSON (`Content-Type: application/json`)');
  lines.push('- Ошибки: 422 (параметры), 429 (rate limit), 403 (нет доступа), 404 (не найдено)');
  lines.push('');

  return lines.join('\n');
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

  return JSON.stringify({ skills }, null, 2) + '\n';
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
  lines.push('npx skills add dev.pachca.com');
  lines.push('```');
  lines.push('');
  lines.push(
    'Подробнее: [документация API](https://dev.pachca.com), [OpenAPI спецификация](https://dev.pachca.com/openapi.yaml)'
  );
  lines.push('');

  return lines.join('\n');
}

function generateCursorMdc(baseUrl: string): string {
  const lines: string[] = [];

  lines.push('---');
  lines.push('description: Pachca API — корпоративный мессенджер');
  lines.push('globs: "**/*"');
  lines.push('---');
  lines.push('');
  lines.push('# Pachca API');
  lines.push('');
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push('Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`');
  lines.push('');
  lines.push('## Скиллы');
  lines.push('');

  for (const config of SKILL_TAG_MAP) {
    lines.push(`### ${config.title} (${config.name})`);
    lines.push('');
    lines.push(config.description.split('.').slice(0, 2).join('.') + '.');
    lines.push('');

    const workflows = WORKFLOWS[config.name];
    if (workflows && workflows.length > 0) {
      for (const wf of workflows.slice(0, 3)) {
        lines.push(`**${wf.title}:**`);
        for (let i = 0; i < wf.steps.length; i++) {
          lines.push(`${i + 1}. ${wf.steps[i]}`);
        }
        if (wf.notes) {
          lines.push(`> ${wf.notes}`);
        }
        lines.push('');
      }
    }
  }

  lines.push('## Ошибки');
  lines.push('');
  lines.push('| Код | Что делать |');
  lines.push('|-----|-----------|');
  lines.push('| 422 | Проверь обязательные поля и допустимые значения |');
  lines.push('| 429 | Rate limit — подожди и повтори |');
  lines.push('| 403 | Нет доступа — проверь права токена |');
  lines.push('| 404 | Сущность не найдена — проверь id |');
  lines.push('');

  return lines.join('\n');
}
