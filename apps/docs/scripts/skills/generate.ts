import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import * as yaml from 'js-yaml';

/**
 * The Pachca plugin is hand-written in `plugins/pachca`: skills, MCP configs and one
 * manifest per host (`plugin.json` for Codex, VS Code and Copilot,
 * `.claude-plugin/plugin.json` for Claude Code and the Claude app,
 * `.cursor-plugin/plugin.json` for Cursor). This module checks all of it and
 * publishes the skills on the docs site.
 *
 * Skills come in two kinds:
 * - knowledge skills, `pachca` and `pachca-<topic>`: the agent picks them by their
 *   description; they are published;
 * - commands, any other name: `disable-model-invocation: true` and
 *   `agents/openai.yaml` with `allow_implicit_invocation: false`, so they run only
 *   when the user calls them; they ship in the plugin only.
 *
 * Written into the plugin: the `version` of the three manifests, one patch above
 * the version in `main` once the plugin files (all but `evals/`) differ from the
 * ones in `main` (the content hash and version are kept in `plugin-version.json`
 * next to this module), and `evals/mocks/pachca/_tools.json` for the eval suite.
 *
 * Published, knowledge skills only:
 * - `/.well-known/agent-skills/index.json` — discovery index v0.2.0; a skill with
 *   references goes as a `.tar.gz` archive next to it, a single file as `SKILL.md`;
 * - `/.well-known/skills/index.json` and `/.well-known/skills/<name>/**` — the
 *   earlier index format (a `files` list and a content `version`), which
 *   `npx skills` falls back to after `agent-skills`, and the plain files that
 *   llms.txt and the docs link to;
 * - `/skills/<name>.zip` — the skill folder zipped with `<name>/` at the top, for
 *   upload to the Claude app and Yandex AI Studio;
 * - `/skill.md` — the entry skill, with links into its references made absolute;
 * - `AGENTS.md`.
 *
 * There is no root `SKILL.md`: `npx skills add pachca/openapi` installs a root
 * skill alone and skips the rest. It finds the plugin's skills through
 * `.claude-plugin/marketplace.json`.
 */

const SITE_URL = 'https://dev.pachca.com';
const REPO_ROOT = path.join(process.cwd(), '..', '..');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const PLUGIN_REL = 'plugins/pachca';
const SOURCE_REL = `${PLUGIN_REL}/skills`;
const SOURCE_DIR = path.join(REPO_ROOT, SOURCE_REL);
const ENTRY_SKILL = 'pachca';
const DISCOVERY_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const PLUGIN_DIR = path.join(REPO_ROOT, PLUGIN_REL);
const PLUGIN_SOURCE = './plugins/pachca';
const MCP_URL = 'https://mcp.pachca.com/mcp';
const AGENT_PLUGINS_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const AGENT_PLUGINS_MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
/** The closed field set of an Agent Plugins 1.0.0 manifest. */
const AGENT_PLUGINS_KEYS = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions',
]);
/**
 * One manifest per host, all with the same version: Agent Plugins (Codex, VS Code,
 * Copilot), Claude (Claude Code, the Claude app), Cursor.
 */
const VERSIONED_MANIFESTS = [
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.cursor-plugin/plugin.json',
];
/** Files at the plugin root that ship and make up the version, next to `skills/**`. */
const PLUGIN_ROOT_FILES = [...VERSIONED_MANIFESTS, '.mcp.json', 'mcp.json', 'README.md'];
/** What may sit at the plugin root. A `bin/` would make the Claude app refuse the plugin. */
const PLUGIN_LAYOUT = new Set([
  '.claude-plugin',
  '.cursor-plugin',
  '.mcp.json',
  'mcp.json',
  'plugin.json',
  'README.md',
  'skills',
  'evals',
]);
/**
 * Major.minor of the plugin version. The patch grows by one whenever the plugin
 * files change. Raise only for a breaking change: the patch then starts at 0.
 */
const PLUGIN_VERSION_BASE = '1.0';
/** The last content hash of the plugin and the version given to it. */
const PLUGIN_VERSION_REL = 'apps/docs/scripts/skills/plugin-version.json';
/** Codex metadata of a skill: interface and invocation policy. */
const OPENAI_YAML = 'agents/openai.yaml';

/** Limits from the Agent Skills spec, tightened: a skill stays short and links out. */
const MAX_DESCRIPTION = 1024;
const MAX_LINES = 300;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/**
 * Knowledge skills keep to the Agent Skills fields we use: uploads to the Claude app
 * and the Skills API reject any key outside the spec. Commands add Claude Code fields
 * and ship in the plugin only.
 */
const KNOWLEDGE_KEYS = new Set(['name', 'description']);
const COMMAND_KEYS = new Set(['name', 'description', 'argument-hint', 'disable-model-invocation']);
/** Knowledge skills are `pachca` and `pachca-<topic>`; a command takes any other name. */
const KNOWLEDGE_NAME_RE = /^pachca(-[a-z0-9]+)*$/;
/** Internal identifiers that must never reach the public repository or the site. */
const LEAKS: [RegExp, string][] = [
  [/\b(?:BAK|WEB|PRO|SEC|DES|AGT|DEVP)-\d+\b/, 'an internal ticket id'],
  [/x-beta/i, 'the beta header'],
  [/\bstaply\b/i, 'an internal repository'],
  [/(?:^|[\s(`])plans\//, 'an internal plans/ path'],
];

/**
 * One line per skill for llms.txt and the agent card, in Russian like the rest
 * of llms.txt. A new skill needs a line here, the build checks it.
 */
export const SKILL_SUMMARIES: Record<string, string> = {
  pachca:
    'Вход: подключение агента через MCP, плагин или CLI, выбор токена, проверка подключения, отказ 401/403 или нет инструмента',
  'pachca-messaging':
    'Как писать: оформление, упоминания, куда отвечать, черновики, отложенные и повторяющиеся, файлы, пересылка, реакции, закрепы, правки',
  'pachca-search':
    'Поиск и пересказ: сообщения, чаты, сотрудники, тред целиком, дайджесты, решения и напоминания по итогам, кто в теге или чате',
  'pachca-admin':
    'Администрирование: сотрудники, состав тегов и чатов, доступ к API, вкладка «Все токены», журнал аудита, экспорт, DLP',
  'pachca-bots':
    'Боты и интеграции: вебхуки, события, токены и права, кнопки, формы, разворачивание ссылок, витрина',
  'pachca-ai-agent':
    'AI-агент в Пачке: зовут упоминанием, контекст треда, реакция agent-thinking, ответ в тред, карточка .md, бот или MCP',
  'pachca-oauth':
    'Приложение от имени сотрудника: OAuth с PKCE, обмен кода, хранение токенов, отзыв',
  'pachca-api':
    'API из кода и CI: токены, пагинация, лимиты и 429, ошибки, файлы, SDK, CLI в скриптах',
};

type Json = Record<string, unknown>;
/** A nested value of parsed JSON or YAML, or undefined. */
const at = (value: unknown, ...keys: string[]): unknown =>
  keys.reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Json)[k] : undefined), value);

interface Skill {
  name: string;
  description: string;
  /**
   * A command: `disable-model-invocation: true`, runs only when the user calls it
   * (`/pachca:<name>`). Ships in the plugin, never published on the site.
   */
  command: boolean;
  /** Path inside the skill → content; `SKILL.md` first, then the rest sorted. */
  files: Map<string, Buffer>;
}

interface PublishedFile {
  /** Path from the repository root. */
  path: string;
  content: string | Buffer;
}

/** RFC digest format: `sha256:` + 64 lowercase hex chars. */
function sha256(content: string | Buffer): string {
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex');
}

function listFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}

function readSkills(problems: string[]): Skill[] {
  const skills: Skill[] = [];
  for (const e of fs.readdirSync(SOURCE_DIR, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    const dir = path.join(SOURCE_DIR, e.name);
    const rel = listFiles(dir);
    if (!rel.includes('SKILL.md')) {
      problems.push(`${SOURCE_REL}/${e.name}: no SKILL.md`);
      continue;
    }
    const files = new Map<string, Buffer>();
    for (const f of ['SKILL.md', ...rel.filter((f) => f !== 'SKILL.md')]) {
      files.set(f, fs.readFileSync(path.join(dir, f)));
    }
    const text = files.get('SKILL.md')!.toString('utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) {
      problems.push(`${SOURCE_REL}/${e.name}/SKILL.md: no frontmatter`);
      continue;
    }
    let meta: Record<string, unknown>;
    try {
      meta = (yaml.load(m[1]) as Record<string, unknown>) ?? {};
    } catch (err) {
      problems.push(
        `${SOURCE_REL}/${e.name}/SKILL.md: frontmatter is not valid YAML (${(err as Error).message.split('\n')[0]})`
      );
      continue;
    }
    const command = meta['disable-model-invocation'] === true;
    if ('disable-model-invocation' in meta && !command) {
      problems.push(`${SOURCE_REL}/${e.name}: disable-model-invocation is either true or absent`);
    }
    const allowed = command ? COMMAND_KEYS : KNOWLEDGE_KEYS;
    for (const key of Object.keys(meta)) {
      if (!allowed.has(key))
        problems.push(`${SOURCE_REL}/${e.name}: unexpected frontmatter key "${key}"`);
    }
    if (meta.name !== e.name)
      problems.push(`${SOURCE_REL}/${e.name}: name "${meta.name}" differs from the folder`);
    if (!NAME_RE.test(e.name) || e.name.length > 64)
      problems.push(`${SOURCE_REL}/${e.name}: invalid skill name`);
    if (/claude|anthropic/.test(e.name))
      problems.push(
        `${SOURCE_REL}/${e.name}: the Claude app rejects "claude" or "anthropic" in a name`
      );
    if (command === KNOWLEDGE_NAME_RE.test(e.name)) {
      problems.push(
        command
          ? `${SOURCE_REL}/${e.name}: a command must not be named like a knowledge skill (pachca, pachca-<topic>)`
          : `${SOURCE_REL}/${e.name}: a knowledge skill is named pachca or pachca-<topic>; a command needs disable-model-invocation: true`
      );
    }
    const hint = meta['argument-hint'];
    if (command && (typeof hint !== 'string' || !hint.trim()))
      problems.push(`${SOURCE_REL}/${e.name}: a command needs argument-hint`);
    const description = typeof meta.description === 'string' ? meta.description.trim() : '';
    if (!description) problems.push(`${SOURCE_REL}/${e.name}: empty description`);
    if (description.length > MAX_DESCRIPTION) {
      problems.push(
        `${SOURCE_REL}/${e.name}: description ${description.length} chars (max ${MAX_DESCRIPTION})`
      );
    }
    if (/[<>]/.test(description))
      problems.push(
        `${SOURCE_REL}/${e.name}: < or > in the description, the Claude app rejects it`
      );
    // The plugin list shows the start of the description, and the people reading it
    // speak Russian: the first sentence is Russian, the trigger phrases of both
    // languages follow it.
    if (description && !/[А-Яа-яЁё]/.test(description.split(/[.:]/)[0]))
      problems.push(`${SOURCE_REL}/${e.name}: the description must start in Russian`);
    skills.push({ name: e.name, description, command, files });
  }
  return skills.sort((a, b) =>
    a.name === ENTRY_SKILL ? -1 : b.name === ENTRY_SKILL ? 1 : a.name.localeCompare(b.name)
  );
}

/** Text inside code spans and fenced blocks: where tool and command names live. */
function codeText(md: string): string {
  const fenced = [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const inline = [...md.replace(/```[\s\S]*?```/g, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  return [...fenced, ...inline].join('\n');
}

interface ManifestTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: unknown;
  annotations?: unknown;
}

function loadManifestTools(): ManifestTool[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'packages/spec/mcp-manifest.json'), 'utf8')
  ) as { tools: ManifestTool[]; service_tools?: ManifestTool[] };
  return [...manifest.tools, ...(manifest.service_tools ?? [])];
}

/**
 * Mocked MCP tools of the plugin's eval suite carry the real descriptions and
 * schemas from the manifest, so an eval run sees the tools as a live session
 * does. Only the tools some case mocks are listed.
 */
function evalToolsJson(tools: ManifestTool[], problems: string[]): PublishedFile | null {
  const evalsDir = path.join(REPO_ROOT, PLUGIN_REL, 'evals');
  if (!fs.existsSync(evalsDir)) return null;
  const mocked = new Set<string>();
  for (const f of listFiles(evalsDir)) {
    const m = f.match(/(?:^|\/)mocks\/pachca\/(pachca_[a-z0-9_]+)\.md$/);
    if (m) mocked.add(m[1]);
  }
  const byName = new Map(tools.map((t) => [t.name, t]));
  for (const name of mocked) {
    if (!byName.has(name))
      problems.push(`${PLUGIN_REL}/evals: mock for a missing MCP tool ${name}`);
  }
  const listed = [...mocked]
    .filter((n) => byName.has(n))
    .sort()
    .map((n) => {
      const t = byName.get(n)!;
      return {
        name: t.name,
        ...(t.title ? { title: t.title } : {}),
        description: t.description,
        inputSchema: t.inputSchema,
        ...(t.annotations ? { annotations: t.annotations } : {}),
      };
    });
  return {
    path: `${PLUGIN_REL}/evals/mocks/pachca/_tools.json`,
    content: JSON.stringify({ tools: listed }, null, 2) + '\n',
  };
}

function loadCliCommands(): Set<string> {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'packages/cli/oclif.manifest.json'), 'utf8')
  ) as { commands: Record<string, unknown> };
  return new Set(Object.keys(manifest.commands));
}

/** Path on the site → the file that serves it, for links to dev.pachca.com. */
function sitePathExists(urlPath: string): boolean {
  const clean = decodeURIComponent(urlPath.replace(/[#?].*$/, '')).replace(/\/$/, '');
  const candidates = /\.[a-z]+$/.test(clean) ? [clean] : [`${clean}.md`, `${clean}/index.md`];
  return candidates.some((c) => fs.existsSync(path.join(PUBLIC_DIR, c)));
}

interface CheckContext {
  skills: Set<string>;
  tools: Set<string>;
  commands: Set<string>;
  /** Every skill of the plugin, knowledge skills and commands. */
  pluginSkills: Set<string>;
  problems: string[];
}

/** Checks any published Markdown: leaks, site links, tool, CLI and skill names. */
function checkMarkdown(md: string, label: string, ctx: CheckContext) {
  const lines = md.split('\n').length;
  if (lines > MAX_LINES) ctx.problems.push(`${label}: ${lines} lines (max ${MAX_LINES})`);

  for (const [re, what] of LEAKS) {
    if (re.test(md)) ctx.problems.push(`${label}: ${what}`);
  }

  for (const m of md.matchAll(/(?<![\w/.])https:\/\/dev\.pachca\.com(\/[^\s)`'"<>,]*)/g)) {
    const urlPath = m[1].replace(/[.:;]+$/, '');
    if (!sitePathExists(urlPath)) ctx.problems.push(`${label}: link to a missing page ${m[0]}`);
  }

  const code = codeText(md);
  for (const m of code.matchAll(/\bpachca_[a-z0-9_]+/g)) {
    if (!ctx.tools.has(m[0])) ctx.problems.push(`${label}: no MCP tool ${m[0]}`);
  }
  // `pachca` in command position: a line start or after a pipe, `&&`, `;` or `(`.
  for (const m of code.matchAll(
    /(?:^|[|;&(])[ \t]*(?:\$[ \t]+)?pachca ([a-z][a-z-]*)(?: ([a-z][a-z-]*))?/gm
  )) {
    const [topic, action] = [m[1], m[2]];
    const ok =
      (action && ctx.commands.has(`${topic}:${action}`)) ||
      ctx.commands.has(topic) ||
      (!action && [...ctx.commands].some((c) => c.startsWith(`${topic}:`)));
    if (!ok) {
      ctx.problems.push(`${label}: no CLI command "pachca ${topic}${action ? ` ${action}` : ''}"`);
    }
  }
  for (const m of md.matchAll(/→ `?(pachca(?:-[a-z]+)*)`?/g)) {
    if (!ctx.skills.has(m[1])) ctx.problems.push(`${label}: points to a missing skill ${m[1]}`);
  }
  for (const m of md.matchAll(/\/pachca:([a-z-]+)/g)) {
    if (!ctx.pluginSkills.has(m[1]))
      ctx.problems.push(`${label}: no plugin skill or command /pachca:${m[1]}`);
  }
}

function checkSkill(skill: Skill, ctx: CheckContext) {
  const where = (f: string) => `${SOURCE_REL}/${skill.name}/${f}`;
  const skillMd = skill.files.get('SKILL.md')!.toString('utf8');

  for (const [file, buf] of skill.files) {
    if (!file.endsWith('.md')) continue;
    const md = buf.toString('utf8');
    checkMarkdown(md, where(file), ctx);
    for (const s of md.matchAll(/`(pachca-[a-z-]+)` skill/g)) {
      if (!ctx.skills.has(s[1])) ctx.problems.push(`${where(file)}: no skill ${s[1]}`);
    }

    for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (target.startsWith('#') || /^(?:https?|mailto):/.test(target)) continue;
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), target.replace(/#.*$/, ''))
      );
      if (!skill.files.has(resolved)) ctx.problems.push(`${where(file)}: broken link ${target}`);
    }
  }

  for (const file of skill.files.keys()) {
    if (file !== 'SKILL.md' && file !== OPENAI_YAML && !skillMd.includes(`](${file}`)) {
      ctx.problems.push(`${where(file)}: not linked from SKILL.md`);
    }
  }
  for (const m of skill.description.matchAll(/→ (pachca(?:-[a-z]+)*)/g)) {
    if (!ctx.skills.has(m[1])) {
      ctx.problems.push(
        `${SOURCE_REL}/${skill.name}: description points to a missing skill ${m[1]}`
      );
    }
  }

  let implicit: unknown;
  const openai = skill.files.get(OPENAI_YAML);
  if (openai) {
    try {
      implicit = at(yaml.load(openai.toString('utf8')), 'policy', 'allow_implicit_invocation');
    } catch (e) {
      ctx.problems.push(
        `${where(OPENAI_YAML)}: not valid YAML (${(e as Error).message.split('\n')[0]})`
      );
    }
  }
  if (skill.command) {
    if (implicit !== false) {
      ctx.problems.push(
        `${where(OPENAI_YAML)}: a command needs policy.allow_implicit_invocation: false, or Codex starts it on its own`
      );
    }
    if (/\$(?:ARGUMENTS\b|\d)/.test(skillMd)) {
      ctx.problems.push(
        `${where('SKILL.md')}: $ARGUMENTS and $1 are filled in by only some programs; say in words what the user gives with the command`
      );
    }
  } else if (implicit === false) {
    ctx.problems.push(`${where(OPENAI_YAML)}: a knowledge skill must stay available to the agent`);
  }
}

function readJson(abs: string, label: string, problems: string[]): Json | null {
  if (!fs.existsSync(abs)) {
    problems.push(`${label}: missing`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8')) as Json;
  } catch (e) {
    problems.push(`${label}: not valid JSON (${(e as Error).message})`);
    return null;
  }
}

/**
 * Marketplaces at the repository root: each lists the one plugin folder and leaves
 * the version to the plugin manifests (Claude Code silently prefers plugin.json).
 * Returns the Codex category, which the Codex interface must repeat.
 */
function checkMarketplaces(description: unknown, problems: string[]): unknown {
  const read = (rel: string) => readJson(path.join(REPO_ROOT, rel), rel, problems);
  const entry = (m: Json | null, label: string): Json | undefined => {
    if (!m) return undefined;
    if (m.name !== 'pachca') problems.push(`${label}: name is not pachca`);
    const plugins = Array.isArray(m.plugins) ? (m.plugins as Json[]) : [];
    if (plugins.length !== 1 || plugins[0].name !== 'pachca') {
      problems.push(`${label}: one plugin entry named pachca expected`);
      return undefined;
    }
    if ('version' in m || 'version' in plugins[0] || at(m, 'metadata', 'version') !== undefined) {
      problems.push(`${label}: no version here, the plugin manifests carry it`);
    }
    return plugins[0];
  };
  for (const rel of ['.claude-plugin/marketplace.json', '.cursor-plugin/marketplace.json']) {
    const m = read(rel);
    const e = entry(m, rel);
    if (e && e.source !== PLUGIN_SOURCE) problems.push(`${rel}: source is not ${PLUGIN_SOURCE}`);
    if (e && description !== undefined && 'description' in e && e.description !== description) {
      problems.push(`${rel}: the plugin entry description differs from the plugin manifests`);
    }
    const top = m && (m.description ?? at(m, 'metadata', 'description'));
    if (typeof top === 'string' && /claude code/i.test(top)) {
      problems.push(`${rel}: the description names one program, every host shows it`);
    }
  }
  const codexRel = '.agents/plugins/marketplace.json';
  const codex = entry(read(codexRel), codexRel);
  if (codex && !isDeepStrictEqual(codex.source, { source: 'local', path: PLUGIN_SOURCE })) {
    problems.push(`${codexRel}: source is not {source: local, path: ${PLUGIN_SOURCE}}`);
  }
  if (
    codex &&
    (typeof at(codex, 'policy', 'installation') !== 'string' ||
      typeof at(codex, 'policy', 'authentication') !== 'string' ||
      typeof codex.category !== 'string')
  ) {
    problems.push(
      `${codexRel}: Codex wants policy.installation, policy.authentication and category`
    );
  }
  return codex?.category;
}

/**
 * A hash of what the plugin ships (everything but `evals/`), with `version` cut
 * out of the manifests first, so writing the version back changes nothing.
 */
function pluginHash(): string {
  const files = [...PLUGIN_ROOT_FILES, ...listFiles(SOURCE_DIR).map((f) => `skills/${f}`)].sort();
  const hash = crypto.createHash('sha256');
  for (const f of files) {
    const abs = path.join(PLUGIN_DIR, f);
    if (!fs.existsSync(abs)) continue; // reported by checkPlugin
    let data = fs.readFileSync(abs);
    if (VERSIONED_MANIFESTS.includes(f)) {
      try {
        const { version: _version, ...rest } = JSON.parse(data.toString('utf8')) as Json;
        data = Buffer.from(JSON.stringify(rest));
      } catch {
        continue; // reported by checkPlugin
      }
    }
    hash.update(`${f}\0${data.length}\0`);
    hash.update(data);
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * The commit the plugin version counts from: where this branch left `main`, so a
 * branch with several commits that change the plugin still releases the next
 * version after the one users have. On `main` itself that is HEAD. Without
 * `origin/main` (a shallow clone) HEAD stands in.
 */
function versionBaseRef(): string {
  try {
    return execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'HEAD';
  }
}

/** A file at the version base; null when it is not there or there is no git checkout. */
function committedFile(rel: string): string | null {
  try {
    return execFileSync('git', ['show', `${versionBaseRef()}:${rel}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

/**
 * The version record to count from: the one in `main` (see `versionBaseRef`), so
 * rebuilding, a second commit or a reverted change does not move the version. Before the first
 * record, the committed `plugin.json` version. Outside a git checkout (the
 * Docker build has no `.git`) the files on disk stand in.
 */
function baseVersionRecord(problems: string[]): Json | null {
  const parse = (text: string, label: string): Json | null => {
    try {
      return JSON.parse(text) as Json;
    } catch (e) {
      problems.push(`${label}: not valid JSON (${(e as Error).message})`);
      return null;
    }
  };
  const record = committedFile(PLUGIN_VERSION_REL);
  if (record !== null) return parse(record, `${PLUGIN_VERSION_REL} in main`);
  const manifest = committedFile(`${PLUGIN_REL}/plugin.json`);
  if (manifest !== null)
    return { version: parse(manifest, `${PLUGIN_REL}/plugin.json in main`)?.version };
  const recordAbs = path.join(REPO_ROOT, PLUGIN_VERSION_REL);
  if (fs.existsSync(recordAbs)) return readJson(recordAbs, PLUGIN_VERSION_REL, problems);
  return {
    version: readJson(path.join(PLUGIN_DIR, 'plugin.json'), `${PLUGIN_REL}/plugin.json`, [])
      ?.version,
  };
}

/**
 * The plugin version: the one in `main` while the plugin files match it, the next
 * patch once they differ, so it only grows for clients that compare versions by
 * order and moves once per release, however many commits a branch has.
 * Semver without pre-release or build metadata: every client keeps it intact.
 */
function pluginVersion(problems: string[]): { version: string; record: PublishedFile } {
  const hash = pluginHash();
  const recorded = baseVersionRecord(problems);
  const last = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(recorded?.version));
  const [major, minor] = PLUGIN_VERSION_BASE.split('.').map(Number);
  let version = `${PLUGIN_VERSION_BASE}.0`;
  if (last) {
    const [lastMajor, lastMinor, lastPatch] = last.slice(1).map(Number);
    if (lastMajor === major && lastMinor === minor) {
      version = recorded?.hash === hash ? last[0] : `${PLUGIN_VERSION_BASE}.${lastPatch + 1}`;
    } else if (lastMajor > major || (lastMajor === major && lastMinor > minor)) {
      problems.push(
        `${PLUGIN_VERSION_REL}: version ${last[0]} is above PLUGIN_VERSION_BASE ${PLUGIN_VERSION_BASE}; the version only grows`
      );
    }
  }
  return {
    version,
    record: {
      path: PLUGIN_VERSION_REL,
      content: JSON.stringify({ hash, version }, null, 2) + '\n',
    },
  };
}

/** Writes the version into one manifest, touching nothing but that line. */
function stampVersion(f: string, version: string, problems: string[]): PublishedFile | null {
  const abs = path.join(PLUGIN_DIR, f);
  if (!fs.existsSync(abs)) return null; // reported by checkPlugin
  const text = fs.readFileSync(abs, 'utf8');
  const versionLine = /^([ \t]*)"version":[ \t]*"[^"\n]*"/m;
  const nameLine = /^([ \t]*)"name":[ \t]*"pachca",[ \t]*\n/m;
  const next = versionLine.test(text)
    ? text.replace(versionLine, `$1"version": "${version}"`)
    : text.replace(
        nameLine,
        (line, indent: string) => `${line}${indent}"version": "${version}",\n`
      );
  let ok = false;
  try {
    const { version: _old, ...before } = JSON.parse(text) as Json;
    const { version: written, ...after } = JSON.parse(next) as Json;
    // JSON.parse keeps the last of two "version" keys, stricter parsers reject the file.
    const once = (next.match(/"version"[ \t]*:/g) ?? []).length === 1;
    ok = once && written === version && isDeepStrictEqual(before, after);
  } catch {
    // reported by checkPlugin
  }
  if (!ok) {
    problems.push(
      `${PLUGIN_REL}/${f}: cannot write the version; keep "name": "pachca", on its own line and one "version" at the top level`
    );
    return null;
  }
  return { path: `${PLUGIN_REL}/${f}`, content: next };
}

/**
 * The plugin around the skills: layout, the three manifests in step, one MCP
 * address, no secret outside Cursor's header, the marketplaces. Returns the
 * manifests with the version written in, and the version record.
 */
function checkPlugin(problems: string[]): PublishedFile[] {
  const rel = (p: string) => `${PLUGIN_REL}/${p}`;
  for (const e of fs.readdirSync(PLUGIN_DIR)) {
    if (PLUGIN_LAYOUT.has(e) || e === '.DS_Store') continue;
    problems.push(`${rel(e)}: not part of the plugin layout (${[...PLUGIN_LAYOUT].join(', ')})`);
  }
  for (const dir of ['.claude-plugin', '.cursor-plugin']) {
    const abs = path.join(PLUGIN_DIR, dir);
    if (!fs.existsSync(abs)) continue; // reported as a missing manifest below
    for (const f of listFiles(abs)) {
      if (f !== 'plugin.json')
        problems.push(`${rel(`${dir}/${f}`)}: only plugin.json belongs here`);
    }
  }
  if (!fs.existsSync(path.join(PLUGIN_DIR, 'README.md')))
    problems.push(`${rel('README.md')}: missing`);

  const json = new Map<string, Json>();
  for (const f of [...VERSIONED_MANIFESTS, '.mcp.json', 'mcp.json']) {
    const v = readJson(path.join(PLUGIN_DIR, f), rel(f), problems);
    if (v) json.set(f, v);
  }
  const portable = json.get('plugin.json');
  const claude = json.get('.claude-plugin/plugin.json');
  const cursor = json.get('.cursor-plugin/plugin.json');

  if (portable && claude && cursor) {
    const all = [portable, claude, cursor];
    for (const key of ['name', 'description', 'homepage', 'repository', 'license', 'keywords']) {
      if (new Set(all.map((m) => JSON.stringify(m[key]))).size > 1)
        problems.push(`${PLUGIN_REL}: "${key}" differs between the three plugin manifests`);
    }
    if (new Set(all.map((m) => at(m, 'author', 'name'))).size > 1)
      problems.push(`${PLUGIN_REL}: author.name differs between the three plugin manifests`);
    const shown = [
      claude.displayName,
      cursor.displayName,
      at(portable, 'extensions', 'com.openai', 'interface', 'displayName'),
    ];
    if (new Set(shown).size > 1)
      problems.push(
        `${PLUGIN_REL}: displayName differs (Codex shows extensions.com.openai.interface.displayName)`
      );
  }

  if (portable) {
    if (portable.name !== 'pachca')
      problems.push(`${rel('plugin.json')}: the plugin is named pachca`);
    if (/claude code/i.test(String(portable.description)))
      problems.push(
        `${rel('plugin.json')}: the description names one program, every host shows it`
      );
    if (portable.$schema !== AGENT_PLUGINS_SCHEMA)
      problems.push(`${rel('plugin.json')}: $schema is not ${AGENT_PLUGINS_SCHEMA}`);
    for (const k of Object.keys(portable)) {
      if (!AGENT_PLUGINS_KEYS.has(k))
        problems.push(`${rel('plugin.json')}: "${k}" is not an Agent Plugins 1.0.0 field`);
    }
    for (const k of Object.keys((portable.author as Json | undefined) ?? {})) {
      if (!['name', 'email', 'url'].includes(k))
        problems.push(`${rel('plugin.json')}: author.${k} is not allowed`);
    }
    const ui = at(portable, 'extensions', 'com.openai', 'interface') as Json | undefined;
    for (const k of [
      'displayName',
      'shortDescription',
      'developerName',
      'category',
      'websiteURL',
    ]) {
      if (typeof ui?.[k] !== 'string' || !(ui[k] as string).trim())
        problems.push(`${rel('plugin.json')}: extensions.com.openai.interface.${k} is empty`);
    }
    const prompts = ui?.defaultPrompt;
    if (
      !Array.isArray(prompts) ||
      prompts.length < 1 ||
      prompts.length > 3 ||
      prompts.some((p) => typeof p !== 'string' || !p.trim() || Buffer.byteLength(p, 'utf8') > 128)
    ) {
      problems.push(
        `${rel('plugin.json')}: defaultPrompt takes 1 to 3 prompts of at most 128 bytes`
      );
    }
    if (
      at(portable, 'extensions', 'com.openai', 'onboardingSkill') !==
      `./skills/${ENTRY_SKILL}/SKILL.md`
    )
      problems.push(`${rel('plugin.json')}: onboardingSkill is ./skills/${ENTRY_SKILL}/SKILL.md`);
  }
  const category = checkMarketplaces(portable?.description, problems);
  const uiCategory = at(portable, 'extensions', 'com.openai', 'interface', 'category');
  if (portable && category !== undefined && uiCategory !== category)
    problems.push(
      `${rel('plugin.json')}: interface.category differs from .agents/plugins/marketplace.json`
    );

  const claudeMcp = json.get('.mcp.json');
  if (
    claudeMcp &&
    !isDeepStrictEqual(claudeMcp, { mcpServers: { pachca: { type: 'http', url: MCP_URL } } })
  )
    problems.push(`${rel('.mcp.json')}: only the pachca server, type http, ${MCP_URL}, no headers`);
  const portableMcp = json.get('mcp.json');
  if (
    portableMcp &&
    !isDeepStrictEqual(portableMcp, {
      $schema: AGENT_PLUGINS_MCP_SCHEMA,
      mcpServers: { pachca: { type: 'streamable-http', url: MCP_URL } },
    })
  )
    problems.push(
      `${rel('mcp.json')}: only the pachca server, type streamable-http, ${MCP_URL}, no headers`
    );
  if (claude && 'mcpServers' in claude)
    problems.push(
      `${rel('.claude-plugin/plugin.json')}: no mcpServers here, Claude reads .mcp.json`
    );
  if (cursor) {
    // A plain string: Cursor fills in the variable, not this module.
    const expected = {
      pachca: { url: MCP_URL, headers: { Authorization: 'Bearer ${PACHCA_TOKEN}' } },
    };
    if (!isDeepStrictEqual(cursor.mcpServers, expected))
      problems.push(
        `${rel('.cursor-plugin/plugin.json')}: mcpServers is the pachca server with the PACHCA_TOKEN header`
      );
    const declared = Object.keys((at(cursor, 'variables', 'properties') as Json | undefined) ?? {});
    for (const m of JSON.stringify(cursor.mcpServers ?? {}).matchAll(
      /\$\{([A-Za-z0-9_]+)(?::-[^}]*)?\}/g
    )) {
      if (!declared.includes(m[1]))
        problems.push(
          `${rel('.cursor-plugin/plugin.json')}: \${${m[1]}} is not declared in variables`
        );
    }
    const required = at(cursor, 'variables', 'required');
    if (Array.isArray(required) && required.includes('PACHCA_TOKEN'))
      problems.push(
        `${rel('.cursor-plugin/plugin.json')}: PACHCA_TOKEN stays optional, Cursor reads the environment first`
      );
  }

  const { version, record } = pluginVersion(problems);
  const stamped = VERSIONED_MANIFESTS.map((f) => stampVersion(f, version, problems)).filter(
    (f): f is PublishedFile => f !== null
  );
  return [...stamped, record];
}

// ---------------------------------------------------------------------------
// Deterministic .tar.gz: fixed mode, owner and time, stored (uncompressed)
// deflate blocks, so the bytes and the digest depend on the content alone and
// the generated-files check passes on any machine and zlib build.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function tarHeader(name: string, size: number): Buffer {
  const h = Buffer.alloc(512);
  const put = (value: string, offset: number, length: number) =>
    h.write(value, offset, Math.min(length, Buffer.byteLength(value)), 'utf8');
  put(name, 0, 100);
  put('0000644\0', 100, 8);
  put('0000000\0', 108, 8);
  put('0000000\0', 116, 8);
  put(size.toString(8).padStart(11, '0') + '\0', 124, 12);
  put('00000000000\0', 136, 12);
  h.fill(' ', 148, 156);
  put('0', 156, 1);
  put('ustar\0', 257, 6);
  put('00', 263, 2);
  let sum = 0;
  for (const byte of h) sum += byte;
  put(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
  return h;
}

function tarGz(files: Map<string, Buffer>): Buffer {
  const parts: Buffer[] = [];
  for (const [name, data] of files) {
    if (Buffer.byteLength(name) > 100) throw new Error(`skill archive: path too long ${name}`);
    parts.push(tarHeader(name, data.length), data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  parts.push(Buffer.alloc(1024));
  const tar = Buffer.concat(parts);

  const blocks: Buffer[] = [Buffer.from([0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 0xff])];
  for (let off = 0; off < tar.length; off += 0xffff) {
    const chunk = tar.subarray(off, off + 0xffff);
    const head = Buffer.alloc(5);
    head[0] = off + 0xffff >= tar.length ? 1 : 0;
    head.writeUInt16LE(chunk.length, 1);
    head.writeUInt16LE(~chunk.length & 0xffff, 3);
    blocks.push(head, chunk);
  }
  const trailer = Buffer.alloc(8);
  trailer.writeUInt32LE(crc32(tar), 0);
  trailer.writeUInt32LE(tar.length >>> 0, 4);
  blocks.push(trailer);
  return Buffer.concat(blocks);
}

/**
 * Content version of one skill in the legacy index: Kilo Code and OpenCode
 * download a skill again only when it changes.
 */
function skillVersion(skill: Skill): string {
  const hash = crypto.createHash('sha256');
  for (const [file, data] of skill.files) {
    hash.update(`${file}\0${data.length}\0`);
    hash.update(data);
  }
  return hash.digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------
// Deterministic ZIP for uploads (the Claude app, Yandex AI Studio): the skill
// folder at the top, stored entries, a fixed date and Unix modes, so the bytes
// depend on the content alone, like the .tar.gz above.
// ---------------------------------------------------------------------------

/** 1980-01-01 00:00, the earliest date a ZIP entry can hold. */
const ZIP_DOS_TIME = 0;
const ZIP_DOS_DATE = (1 << 5) | 1;

/** Entries in order; `null` data is a directory (name ends with `/`). */
function zipStored(entries: [string, Buffer | null][]): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const body = data ?? Buffer.alloc(0);
    const crc = data ? crc32(body) : 0;
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // version needed to extract
    head.writeUInt16LE(0, 6); // flags
    head.writeUInt16LE(0, 8); // method: stored
    head.writeUInt16LE(ZIP_DOS_TIME, 10);
    head.writeUInt16LE(ZIP_DOS_DATE, 12);
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(body.length, 18);
    head.writeUInt32LE(body.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    head.writeUInt16LE(0, 28); // extra length
    local.push(head, nameBuf, body);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(0x0314, 4); // made by Unix, 2.0: the mode bits below apply
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0, 8);
    dir.writeUInt16LE(0, 10);
    dir.writeUInt16LE(ZIP_DOS_TIME, 12);
    dir.writeUInt16LE(ZIP_DOS_DATE, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(body.length, 20);
    dir.writeUInt32LE(body.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    // extra, comment, disk number and internal attributes stay 0 (offsets 30–37)
    dir.writeUInt32LE(data ? (0o100644 << 16) >>> 0 : ((0o40755 << 16) | 0x10) >>> 0, 38);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);
    offset += head.length + nameBuf.length + body.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}

/** `<name>/` with the skill inside, each directory entry right before its first file. */
function skillZip(skill: Skill): Buffer {
  const entries: [string, Buffer | null][] = [];
  const dirs = new Set<string>();
  const addDir = (d: string) => {
    if (!dirs.has(d)) {
      dirs.add(d);
      entries.push([`${d}/`, null]);
    }
  };
  addDir(skill.name);
  for (const [file, data] of skill.files) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) addDir(`${skill.name}/${parts.slice(0, i).join('/')}`);
    entries.push([`${skill.name}/${file}`, data]);
  }
  return zipStored(entries);
}

// ---------------------------------------------------------------------------

/**
 * Links into the entry skill's own files, made absolute for `/skill.md`. A sibling
 * skill named in backticks becomes a link to its published SKILL.md: on the site
 * the agent has no plugin next to it, so a bare name leads nowhere. Code blocks
 * stay as they are.
 */
function absolutizeEntryLinks(md: string, skillNames: Set<string>): string {
  return md
    .split(/(^```[\s\S]*?^```)/m)
    .map((part) =>
      part.startsWith('```')
        ? part
        : part
            .replace(
              /\]\((?!https?:|#)([^)\s]+)\)/g,
              (_, target: string) => `](${SITE_URL}/.well-known/skills/${ENTRY_SKILL}/${target})`
            )
            .replace(/(?<!\[)`(pachca-[a-z-]+)`(?!\])/g, (whole, name: string) =>
              skillNames.has(name) && name !== ENTRY_SKILL
                ? `[\`${name}\`](${SITE_URL}/.well-known/skills/${name}/SKILL.md)`
                : whole
            )
    )
    .join('');
}

/**
 * Reads, checks and publishes the skills, checks the plugin around them and
 * returns its manifests with the version written in. Runs after the page `.md`
 * files are written: the links of every skill are checked against them. Throws
 * with the full list of problems, so one build shows them all.
 */
export function publishSkills(): PublishedFile[] {
  const problems: string[] = [];
  const all = readSkills(problems);
  /** Published on the site: knowledge skills only. Commands ship in the plugin. */
  const skills = all.filter((s) => !s.command);
  const names = new Set(skills.map((s) => s.name));
  const manifestTools = loadManifestTools();
  const evalTools = evalToolsJson(manifestTools, problems);
  const ctx: CheckContext = {
    skills: names,
    tools: new Set(manifestTools.map((t) => t.name)),
    commands: loadCliCommands(),
    pluginSkills: new Set(all.map((s) => s.name)),
    problems,
  };

  for (const skill of all) checkSkill(skill, ctx);
  const readme = path.join(PLUGIN_DIR, 'README.md');
  if (fs.existsSync(readme))
    checkMarkdown(fs.readFileSync(readme, 'utf8'), `${PLUGIN_REL}/README.md`, ctx);
  const pluginFiles = checkPlugin(problems);

  const entry = skills.find((s) => s.name === ENTRY_SKILL);
  if (!entry) problems.push(`${SOURCE_REL}/${ENTRY_SKILL}: the entry skill is missing`);
  else {
    const entryMd = entry.files.get('SKILL.md')!.toString('utf8');
    for (const s of skills) {
      if (s.name !== ENTRY_SKILL && !entryMd.includes(`\`${s.name}\``)) {
        problems.push(`${SOURCE_REL}/${ENTRY_SKILL}/SKILL.md: does not route to ${s.name}`);
      }
    }
  }
  for (const s of skills) {
    if (!SKILL_SUMMARIES[s.name])
      problems.push(`${SOURCE_REL}/${s.name}: no line in SKILL_SUMMARIES`);
  }
  for (const name of Object.keys(SKILL_SUMMARIES)) {
    if (!names.has(name)) problems.push(`SKILL_SUMMARIES: no skill ${name}`);
  }

  if (problems.length > 0) {
    throw new Error(`Agent skills failed the checks:\n  - ${problems.join('\n  - ')}`);
  }

  const out: PublishedFile[] = [];
  const pub = (p: string) => `apps/docs/public/${p}`;
  const v2Entries: object[] = [];
  const v1Entries: object[] = [];

  for (const skill of skills) {
    for (const [file, data] of skill.files) {
      out.push({ path: pub(`.well-known/skills/${skill.name}/${file}`), content: data });
    }
    v1Entries.push({
      name: skill.name,
      description: skill.description,
      version: skillVersion(skill),
      files: [...skill.files.keys()],
    });

    if (skill.files.size === 1) {
      const data = skill.files.get('SKILL.md')!;
      out.push({ path: pub(`.well-known/agent-skills/${skill.name}/SKILL.md`), content: data });
      v2Entries.push({
        name: skill.name,
        type: 'skill-md',
        description: skill.description,
        url: `/.well-known/agent-skills/${skill.name}/SKILL.md`,
        digest: sha256(data),
      });
    } else {
      const archive = tarGz(skill.files);
      out.push({ path: pub(`.well-known/agent-skills/${skill.name}.tar.gz`), content: archive });
      v2Entries.push({
        name: skill.name,
        type: 'archive',
        description: skill.description,
        url: `/.well-known/agent-skills/${skill.name}.tar.gz`,
        digest: sha256(archive),
      });
    }
    out.push({ path: pub(`skills/${skill.name}.zip`), content: skillZip(skill) });
  }

  const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
  out.push({
    path: pub('.well-known/agent-skills/index.json'),
    content: json({ $schema: DISCOVERY_SCHEMA, skills: v2Entries }),
  });
  out.push({ path: pub('.well-known/skills/index.json'), content: json({ skills: v1Entries }) });
  out.push({
    path: pub('skill.md'),
    content: absolutizeEntryLinks(entry!.files.get('SKILL.md')!.toString('utf8'), names),
  });
  out.push({ path: 'AGENTS.md', content: generateAgentsMd() });
  out.push(...pluginFiles);
  if (evalTools) out.push(evalTools);

  return out;
}

/**
 * AGENTS.md (agents.md / AAIF standard): instructions for AI coding agents
 * working ON this repository — not for agents consuming the Pachca API
 * (that lives in skill.md / llms.txt / plugins/pachca/). Generated so it stays in
 * sync; keep it concise and factual.
 */
function generateAgentsMd(): string {
  return `# AGENTS.md

Guidance for AI coding agents working in this repository. (Using the Pachca
API instead of contributing here? See https://dev.pachca.com/skill.md,
https://dev.pachca.com/llms.txt, the MCP server https://mcp.pachca.com/mcp,
or the plugin in \`plugins/pachca/\` — not this file.)

## What this repo is

Monorepo (Turborepo + bun) for the Pachca API platform. TypeSpec is the
single source of truth; everything else is generated from it.

| Path | What |
|------|------|
| \`packages/spec\` | TypeSpec (\`typespec.tsp\`) → \`openapi.yaml\`; English overlay → \`openapi.en.yaml\`; MCP tool manifest (\`mcp-manifest.json\`), examples |
| \`packages/cli\` | oclif CLI \`@pachca/cli\`, generated from OpenAPI |
| \`packages/generator\` | Multi-language SDK generator |
| \`packages/openapi-parser\` | Shared OpenAPI parser |
| \`packages/mcp-manifest\` | npm package \`@pachca/mcp-manifest\`: the MCP tool manifest and its JSON Schema, copied from \`packages/spec\` by the build |
| \`apps/docs\` | Next.js 16 docs site (dev.pachca.com): \`content/\` MDX, \`lib/\`, \`scripts/\` generators, \`public/\` generated artifacts |
| \`plugins/pachca\` | The Pachca plugin for Claude Code, the Claude app, Codex, VS Code and GitHub Copilot, and Cursor: hand-written skills (knowledge skills and slash-only commands), MCP configs and one manifest per host |
| \`integrations/n8n\` | n8n community node |

## Build & check

\`\`\`bash
npx turbo build      # compiles TypeSpec + builds all packages + regenerates generated files
npx turbo check      # lint + typecheck + knip + format:check + test — MUST pass before commit (CI runs this)
bun turbo dev        # docs dev server (Next.js 16)
\`\`\`

Standard loop: edit source → \`npx turbo build\` → \`npx turbo check\` →
review generated diffs → commit. Branch from \`origin/main\`; open a PR
(never push to \`main\`).

## Do NOT hand-edit generated files — edit the generator

| Generated | Source of truth |
|-----------|-----------------|
| \`packages/spec/openapi.yaml\` | \`packages/spec/typespec.tsp\` (then \`npx turbo build --filter=@pachca/spec --force\`) |
| \`packages/spec/openapi.en.yaml\` | \`packages/spec/overlay.en.yaml\` + \`scripts/apply-overlay.ts\` (a changed Russian text also needs \`bun run overlay:fingerprints\` in \`packages/spec\`) |
| \`packages/spec/mcp-manifest.json\` | the spec + \`packages/spec/mcp-core.ts\`, \`mcp-tools.ts\`, \`scripts/generate-mcp-manifest.ts\` (then \`bun run generate-mcp\` in \`packages/spec\`) |
| \`packages/mcp-manifest/mcp-manifest.json\`, \`mcp-manifest.schema.json\` | copies of \`packages/spec/mcp-manifest.json\` and \`mcp-manifest.schema.json\` (\`npx turbo build --filter=@pachca/mcp-manifest\`); a changed manifest needs a new version on top of \`packages/mcp-manifest/CHANGELOG.md\` and in its \`package.json\`, and a release entry with product \`mcp\` and that version in \`apps/docs/data/releases.json\` (the package itself is not there) |
| \`apps/docs/public/llms*.txt\`, \`public/**/*.md\`, Postman collection | \`apps/docs/scripts/generate-llms.ts\` |
| \`apps/docs/public/skill.md\`, \`public/.well-known/**\`, \`public/skills/*.zip\`, \`plugins/pachca/evals/mocks/pachca/_tools.json\`, and the \`version\` in \`plugins/pachca/plugin.json\`, \`.claude-plugin/plugin.json\`, \`.cursor-plugin/plugin.json\` (recorded in \`apps/docs/scripts/skills/plugin-version.json\`) | the hand-written plugin in \`plugins/pachca/\`, checked and published by \`apps/docs/scripts/skills/generate.ts\` (links, MCP tool and CLI command names, size, manifests in step; the version is one patch above the one in \`main\` once the plugin files change) |
| \`packages/cli/src/commands/**\` (except \`auth\`/\`config\`), \`packages/cli/CHANGELOG.md\` | \`packages/cli/scripts/generate-cli.ts\`; \`src/data/changelog.json\` |
| n8n node files | \`integrations/n8n/scripts/generate-n8n.ts\` |
| \`AGENTS.md\` (this file) | \`apps/docs/scripts/skills/generate.ts\` (\`generateAgentsMd()\`) |

CI enforces this: \`scripts/check-generated-sync.mjs\` runs \`bun turbo build\`
and fails the PR if any generated path drifts from its source.
\`scripts/check-changelog-sync.mjs\` separately enforces that every code
change to a published package ships with a release entry (and vice versa).

## Repo-specific gotchas

- A new MDX component must be registered in **three** places: \`apps/docs/components/mdx/mdx-components.tsx\`, \`apps/docs/components/api/markdown-content.tsx\`, and a handler in \`apps/docs/lib/mdx-expander.ts\` (else raw tags leak into generated \`.md\`/\`llms-full.txt\`).
- Next.js middleware lives in \`apps/docs/proxy.ts\` (Next 16 renamed \`middleware.ts\` → \`proxy.ts\`; both present fails the build).
- After changing \`typespec.tsp\`, always \`npx turbo build --filter=@pachca/spec --force\` — otherwise \`openapi.yaml\` stays stale.
- Snapshot regeneration for \`packages/generator\` is a bulk snapshot rewrite. Use \`cd packages/generator && npm run regen-snapshots\` (backed by top-level \`scripts/regen-generator-snapshots.ts\`) instead of ad-hoc \`bun -e\` one-offs or the old \`bin/\` / \`tests/\` helpers.
- Restart the docs dev server after changing component registrations or new TS/TSX files (Turbopack HMR misses them).
- Hand-written files must stay out of a turbo task's \`outputs\` globs. On a cache **hit** turbo restores every declared output over the working tree, silently reverting hand edits — the package script alone keeps them, so it looks intermittent. \`generate-n8n\` declares \`nodes/**/*.ts\`, so \`nodes/Pachca/GenericFunctions.ts\` and \`nodes/Pachca/V1/**\` are excluded by negation in \`turbo.json\`; keep new hand-written node files excluded too.
- Never type the plugin \`version\`: once \`plugins/pachca\` (all but \`evals/\`) differs from the plugin in \`main\`, the docs build sets it one patch above the version in \`main\` and writes it into the three plugin manifests and \`apps/docs/scripts/skills/plugin-version.json\`. Rebuilding or a second commit does not raise it further. After changing the plugin, run \`npx turbo build\` and commit those files with the change. If the version did not change after you changed the plugin, rerun with \`--force\`.

## Deep-dive docs (read before the relevant task)

- \`CONTRIBUTING.md\` — full layout, generation pipeline, build/check, workflow.
- \`docs/api-audit.md\` — **canonical** API-audit & backend-sync process (run on "проверь API"): scope, what to check, version/changelog bumps, backend sync checkpoint.
- \`docs/updates-format.md\` — rules for the per-date entry files in \`apps/docs/content/updates/<date>.md\` and the package release entries in \`apps/docs/data/releases.json\` (breaking the parser rules breaks the updates page).
- \`docs/docs-conventions.md\` — MDX 3-place registration, Turbopack/TypeSpec gotchas, headings & design-system rules.
- \`docs/releases.md\` — **canonical** package publishing & versioning: how CLI/n8n/generator/SDK/MCP manifest reach the registries, the \`check-changelog-sync\` build gate and \`check-release\` publish gate, version rules (CalVer/semver, exact next step), and how to cut a release.
`;
}
