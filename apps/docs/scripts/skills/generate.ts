import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import * as yaml from 'js-yaml';

/**
 * Agent skills are hand-written: `plugins/pachca/skills/<name>/SKILL.md` plus
 * `references/`, inside the Pachca plugin for Claude Code and Codex. This module
 * checks them and the plugin's commands, and publishes the skills on the docs
 * site; it writes nothing into the plugin.
 *
 * Published:
 * - `/.well-known/agent-skills/index.json` — discovery index v0.2.0; a skill with
 *   references goes as a `.tar.gz` archive next to it, a single file as `SKILL.md`;
 * - `/.well-known/skills/index.json` and `/.well-known/skills/<name>/**` — the
 *   earlier index format (a `files` list) that `npx skills add` still reads, and
 *   the files themselves for agents reading the site;
 * - `/skill.md` — the entry skill, with links into its references made absolute;
 * - `/.well-known/agent-card.json`, root `skill.json` and `AGENTS.md`.
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
const COMMANDS_DIR = path.join(REPO_ROOT, PLUGIN_REL, 'commands');
const ENTRY_SKILL = 'pachca';
const DISCOVERY_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

/** Limits from the Agent Skills spec, tightened: a skill stays short and links out. */
const MAX_DESCRIPTION = 1024;
const MAX_LINES = 300;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FRONTMATTER_KEYS = new Set(['name', 'description']);
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
    'Вход: подключение через MCP, CLI или API, выбор токена, почему нет права или инструмента',
  'pachca-messaging':
    'Как писать: оформление, упоминания, куда отвечать, черновики, отложенные, файлы, кнопки, реакции',
  'pachca-search':
    'Поиск и пересказ: сообщения, чаты, сотрудники, тред целиком, дайджесты, задачи по итогам',
  'pachca-admin':
    'Администрирование: сотрудники, теги, участники чатов, доступ к API, журнал аудита, экспорт, DLP',
  'pachca-bots':
    'Боты и интеграции: вебхуки, события, токены и права, кнопки, формы, разворачивание ссылок',
  'pachca-ai-agent':
    'AI-агент в Пачке: зовут по нику, контекст треда, реакция agent-thinking, ответ в тред, черновик',
  'pachca-oauth':
    'Приложение от имени сотрудника: OAuth с PKCE, обмен кода, хранение токенов, отзыв',
  'pachca-api':
    'API из кода и CI: токены, пагинация, лимиты и 429, ошибки, файлы, SDK, CLI в скриптах',
};

interface Skill {
  name: string;
  description: string;
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
    for (const key of Object.keys(meta)) {
      if (!FRONTMATTER_KEYS.has(key))
        problems.push(`${SOURCE_REL}/${e.name}: unexpected frontmatter key "${key}"`);
    }
    if (meta.name !== e.name)
      problems.push(`${SOURCE_REL}/${e.name}: name "${meta.name}" differs from the folder`);
    if (!NAME_RE.test(e.name) || e.name.length > 64)
      problems.push(`${SOURCE_REL}/${e.name}: invalid skill name`);
    const description = typeof meta.description === 'string' ? meta.description.trim() : '';
    if (!description) problems.push(`${SOURCE_REL}/${e.name}: empty description`);
    if (description.length > MAX_DESCRIPTION) {
      problems.push(
        `${SOURCE_REL}/${e.name}: description ${description.length} chars (max ${MAX_DESCRIPTION})`
      );
    }
    skills.push({ name: e.name, description, files });
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
  pluginCommands: Set<string>;
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
    if (!ctx.pluginCommands.has(m[1]))
      ctx.problems.push(`${label}: no plugin command /pachca:${m[1]}`);
  }
}

function checkSkill(skill: Skill, ctx: CheckContext) {
  const where = (f: string) => `${SOURCE_REL}/${skill.name}/${f}`;
  const skillMd = skill.files.get('SKILL.md')!.toString('utf8');

  for (const [file, buf] of skill.files) {
    if (!file.endsWith('.md')) continue;
    const md = buf.toString('utf8');
    checkMarkdown(md, where(file), ctx);

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
    if (file !== 'SKILL.md' && !skillMd.includes(`](${file}`)) {
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
}

/** Plugin commands: a description, and every skill they lean on exists. */
function checkCommand(name: string, md: string, ctx: CheckContext) {
  const label = `${PLUGIN_REL}/commands/${name}.md`;
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  let meta: Record<string, unknown> = {};
  try {
    meta = m ? ((yaml.load(m[1]) as Record<string, unknown>) ?? {}) : {};
  } catch (e) {
    ctx.problems.push(
      `${label}: frontmatter is not valid YAML (${(e as Error).message.split('\n')[0]})`
    );
  }
  if (typeof meta.description !== 'string' || !meta.description.trim()) {
    ctx.problems.push(`${label}: no description in the frontmatter`);
  }
  checkMarkdown(md, label, ctx);
  for (const s of md.matchAll(/`(pachca-[a-z-]+)` skill/g)) {
    if (!ctx.skills.has(s[1])) ctx.problems.push(`${label}: no skill ${s[1]}`);
  }
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

// ---------------------------------------------------------------------------

/** Links into the entry skill's own files, made absolute for `/skill.md`. */
function absolutizeEntryLinks(md: string): string {
  return md.replace(
    /\]\((?!https?:|#)([^)\s]+)\)/g,
    (_, target: string) => `](${SITE_URL}/.well-known/skills/${ENTRY_SKILL}/${target})`
  );
}

/**
 * Reads, checks and publishes the skills. Runs after the page `.md` files are
 * written: the links of every skill are checked against them. Throws with the
 * full list of problems, so one build shows them all.
 */
export function publishSkills(): PublishedFile[] {
  const problems: string[] = [];
  const skills = readSkills(problems);
  const names = new Set(skills.map((s) => s.name));
  const manifestTools = loadManifestTools();
  const evalTools = evalToolsJson(manifestTools, problems);
  const commandFiles = fs
    .readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
  const ctx: CheckContext = {
    skills: names,
    tools: new Set(manifestTools.map((t) => t.name)),
    commands: loadCliCommands(),
    pluginCommands: new Set(commandFiles.map((f) => f.replace(/\.md$/, ''))),
    problems,
  };

  for (const skill of skills) checkSkill(skill, ctx);
  for (const f of commandFiles) {
    checkCommand(f.replace(/\.md$/, ''), fs.readFileSync(path.join(COMMANDS_DIR, f), 'utf8'), ctx);
  }

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
  }

  const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
  out.push({
    path: pub('.well-known/agent-skills/index.json'),
    content: json({ $schema: DISCOVERY_SCHEMA, skills: v2Entries }),
  });
  out.push({ path: pub('.well-known/skills/index.json'), content: json({ skills: v1Entries }) });
  out.push({ path: pub('.well-known/agent-card.json'), content: json(agentCard(skills)) });
  out.push({
    path: pub('skill.md'),
    content: absolutizeEntryLinks(entry!.files.get('SKILL.md')!.toString('utf8')),
  });
  out.push({ path: 'skill.json', content: json(skillJson()) });
  out.push({ path: 'AGENTS.md', content: generateAgentsMd() });
  if (evalTools) out.push(evalTools);

  return out;
}

/**
 * A2A (Agent2Agent) Agent Card, schema v0.2.0, served at
 * /.well-known/agent-card.json: the same skills in the A2A shape, so A2A-aware
 * orchestrators can discover the docs as an agent.
 */
function agentCard(skills: Skill[]) {
  return {
    schemaVersion: '0.2.0',
    name: 'Pachca API Documentation',
    description:
      'Документация и скиллы для AI-агентов мессенджера Пачка: подключение через MCP, CLI и API, сообщения, поиск, администрирование, боты, AI-агенты, OAuth.',
    url: SITE_URL,
    version: '2.0.0',
    documentationUrl: `${SITE_URL}/llms.txt`,
    capabilities: { streaming: false },
    skills: skills.map((s) => ({
      id: s.name,
      name: SKILL_SUMMARIES[s.name].split(':')[0],
      description: s.description,
      tags: ['pachca', ...s.name.split('-').slice(1)],
      url: `${SITE_URL}/.well-known/skills/${s.name}/SKILL.md`,
    })),
  };
}

/**
 * Root skill.json for catalogs that want one flat manifest of the repository
 * (OpenAgentSkill). Version tracks the TypeSpec spec package.
 */
function skillJson() {
  let version = '1.0.0';
  try {
    const specPkg = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, 'packages/spec/package.json'), 'utf8')
    );
    if (specPkg.version) version = specPkg.version;
  } catch {
    // fall back to the default version
  }
  return {
    name: 'pachca',
    version,
    description:
      'Agent skills for the Pachca corporate messenger: connecting over MCP, CLI or API, writing, search, administration, bots, AI agents in Pachca, OAuth and API scripts.',
    category: 'communication',
    platforms: ['claude-code', 'cursor', 'codex', 'gemini-cli'],
    author: { name: 'Pachca', github: 'pachca' },
    homepage: SITE_URL,
    repository: 'https://github.com/pachca/openapi',
    license: 'MIT',
  };
}

/**
 * AGENTS.md (agents.md / AAIF standard): instructions for AI coding agents
 * working ON this repository — not for agents consuming the Pachca API
 * (that lives in skill.md / llms.txt / skills/). Generated so it stays in
 * sync; keep it concise and factual.
 */
function generateAgentsMd(): string {
  return `# AGENTS.md

Guidance for AI coding agents working in this repository. (Using the Pachca
API instead of contributing here? See \`skill.md\`, \`/llms.txt\`, or the
plugin in \`plugins/pachca/\` — not this file.)

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
| \`packages/mcp-manifest/mcp-manifest.json\`, \`mcp-manifest.schema.json\` | copies of \`packages/spec/mcp-manifest.json\` and \`mcp-manifest.schema.json\` (\`npx turbo build --filter=@pachca/mcp-manifest\`); a changed manifest needs a new version on top of \`packages/mcp-manifest/CHANGELOG.md\` and in its \`package.json\` (the package is not in \`releases.json\`) |
| \`apps/docs/public/llms*.txt\`, \`public/**/*.md\`, Postman collection | \`apps/docs/scripts/generate-llms.ts\` |
| \`apps/docs/public/skill.md\`, \`public/.well-known/**\`, root \`skill.json\` | the hand-written skills in \`plugins/pachca/skills/<name>/\`, published and checked by \`apps/docs/scripts/skills/generate.ts\` (links, MCP tool and CLI command names, size) |
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

## Deep-dive docs (read before the relevant task)

- \`CONTRIBUTING.md\` — full layout, generation pipeline, build/check, workflow.
- \`docs/api-audit.md\` — **canonical** API-audit & backend-sync process (run on "проверь API"): scope, what to check, version/changelog bumps, backend sync checkpoint.
- \`docs/updates-format.md\` — rules for the per-date entry files in \`apps/docs/content/updates/<date>.md\` and the package release entries in \`apps/docs/data/releases.json\` (breaking the parser rules breaks the updates page).
- \`docs/docs-conventions.md\` — MDX 3-place registration, Turbopack/TypeSpec gotchas, headings & design-system rules.
- \`docs/releases.md\` — **canonical** package publishing & versioning: how CLI/n8n/generator/SDK/MCP manifest reach the registries, the \`check-changelog-sync\` build gate and \`check-release\` publish gate, version rules (CalVer/semver, exact next step), and how to cut a release.
`;
}
