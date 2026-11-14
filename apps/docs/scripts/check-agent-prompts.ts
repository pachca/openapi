/**
 * Build gate for the agent prompts shown by <AgentPrompt id="…" />.
 *
 * A prompt is copied by a reader and run by an AI agent far from this repo, so a
 * stale link or a renamed section in it fails silently: the agent opens nothing
 * and invents the steps. The check ties every prompt in `content/prompts/` to the
 * page that shows it and to the pages, sections, steps and MCP tools it names, makes
 * sure the Markdown version of the page carries the prompt word for word.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { agentPromptToMarkdown, getAllAgentPrompts } from '../lib/agent-prompts';

const DOCS = process.cwd();
const CONTENT = path.join(DOCS, 'content');
const PUBLIC = path.join(DOCS, 'public');
const PROMPTS = path.join(CONTENT, 'prompts');
const SITE = 'https://dev.pachca.com';

/** Hosts a prompt may name. Anything else is a typo or another vendor's address. */
const ALLOWED_HOSTS = new Set(['dev.pachca.com', 'mcp.pachca.com', 'app.pachca.com', 'localhost']);
const FRONTMATTER_KEYS = new Set(['title', 'does', 'mcp', 'hint', 'pages']);
const MIN_CHARS = 300;
const MAX_CHARS = 1350;
const CAPTION_MAX_CHARS = 120;

const errors: string[] = [];
const fail = (where: string, message: string) => errors.push(`${where}: ${message}`);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return full === PROMPTS ? [] : walk(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

/** `content/guides/bots/first-bot.mdx` → `guides/bots/first-bot` */
const routeOf = (file: string) => path.relative(CONTENT, file).replace(/\.mdx$/, '');

/** Headings and step titles of a page: what a prompt may call «раздел» or «шаг». */
function sectionTitles(file: string): Set<string> {
  // A `# comment` line inside a code block is not a heading.
  const body = fs.readFileSync(file, 'utf-8').replace(/^\s*```[\s\S]*?^\s*```/gm, '');
  const titles = new Set<string>();
  for (const m of body.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) titles.add(m[1]);
  for (const m of body.matchAll(/<(?:Step|Tab|Accordion)\s+title="([^"]+)"/g)) titles.add(m[1]);
  return titles;
}

// 1. Pages: where each prompt is shown, and that the tag is written the one supported way.
const homes = new Map<string, string[]>();
for (const file of walk(CONTENT)) {
  const body = fs.readFileSync(file, 'utf-8');
  const tags = body.match(/<AgentPrompt\b/g) ?? [];
  const written = [...body.matchAll(/^<AgentPrompt\s+id="([^"]+)"\s*\/>$/gm)];
  const rel = path.relative(DOCS, file);
  if (written.length !== tags.length) {
    fail(rel, 'пишите тег отдельной строкой и только так: <AgentPrompt id="…" />');
  }
  for (const [, id] of written) homes.set(id, [...(homes.get(id) ?? []), file]);
}

// 2. Prompts.
const manifest = JSON.parse(
  fs.readFileSync(path.join(DOCS, '../../packages/spec/mcp-manifest.json'), 'utf-8')
) as { tools: { name: string; bot_token_only?: boolean }[] };
const toolsByName = new Map(manifest.tools.map((tool) => [tool.name, tool]));

const prompts = getAllAgentPrompts();
const known = new Set(prompts.map((prompt) => prompt.id));

for (const id of homes.keys()) {
  if (!known.has(id)) fail(`<AgentPrompt id="${id}">`, `нет файла content/prompts/${id}.md`);
}

for (const prompt of prompts) {
  const where = `content/prompts/${prompt.id}.md`;
  const { data } = matter(fs.readFileSync(path.join(PROMPTS, `${prompt.id}.md`), 'utf-8'));

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(prompt.id)) {
    fail(where, 'имя файла: строчные латинские буквы, цифры и дефис');
  }
  for (const key of Object.keys(data)) {
    if (!FRONTMATTER_KEYS.has(key)) fail(where, `неизвестное поле «${key}» во фронтматтере`);
  }
  if ('mcp' in data && typeof data.mcp !== 'boolean') fail(where, 'поле mcp: true или false');
  if ('hint' in data && (typeof data.hint !== 'string' || !data.hint.trim())) {
    fail(where, 'поле hint: строка с подписью под промптом');
  }
  // The default caption sends the reader to an agent with Pachca connected. A prompt that
  // does not need it must say where to paste itself, or the caption would mislead.
  if (!prompt.mcp && !prompt.hint) {
    fail(where, 'у промпта с mcp: false нужна своя подпись в поле hint: куда вставить промпт');
  }
  for (const [field, value] of [
    ['does', prompt.does],
    ['title', prompt.title],
    ['hint', prompt.hint ?? ''],
  ] as const) {
    if (/[.!?:;]$/.test(value)) fail(where, `поле ${field} пишется без знака в конце`);
  }
  for (const [field, value] of [
    ['does', prompt.does],
    ['hint', prompt.hint ?? ''],
  ] as const) {
    if (value.length > CAPTION_MAX_CHARS) {
      fail(where, `поле ${field} длиннее ${CAPTION_MAX_CHARS} знаков: ${value.length}`);
    }
  }

  const { text } = prompt;
  if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
    fail(where, `длина промпта ${text.length} знаков, нужно от ${MIN_CHARS} до ${MAX_CHARS}`);
  }
  // The prompt is plain text in a user message: Markdown markup would arrive as literal signs,
  // a component tag or a code fence would break the Markdown version of the page.
  const forbidden: [RegExp, string][] = [
    [/```/, 'тройные обратные кавычки'],
    [/\*\*/, 'выделение звёздочками'],
    [/\]\(/, 'ссылка в разметке Markdown: адрес пишется как есть'],
    [/<[A-Za-z/]/, 'тег'],
    [/&[a-z]+;/, 'HTML-сущность'],
    [/\t/, 'табуляция'],
    [/[  ]$/m, 'пробел в конце строки'],
    [/ /, 'неразрывный пробел'],
    [/; /, 'точка с запятой между частями предложения'],
    [/, —/, 'запятая с тире'],
  ];
  for (const [pattern, name] of forbidden) {
    if (pattern.test(text)) fail(where, `в промпте не должно быть: ${name}`);
  }

  for (const [tool] of text.matchAll(/\bpachca_[a-z0-9_]+\b/g)) {
    const manifestTool = toolsByName.get(tool);
    if (!manifestTool) fail(where, `инструмента ${tool} нет в mcp-manifest.json`);
    // The reader's agent works with an employee token: a bot-only tool is not in its list.
    else if (manifestTool.bot_token_only) {
      fail(where, `инструмент ${tool} доступен только с токеном бота: у агента читателя его нет`);
    }
  }

  // Every address the prompt names must lead somewhere.
  const linked: string[] = [];
  for (const [raw] of text.matchAll(/https?:\/\/[^\s`«»)]+/g)) {
    let url: URL;
    try {
      url = new URL(raw.replace(/[.,:;]+$/, ''));
    } catch {
      fail(where, `адрес ${raw} не разбирается как URL`);
      continue;
    }
    if (!ALLOWED_HOSTS.has(url.hostname)) {
      fail(where, `адрес ${url.href}: хост не из списка разрешённых в проверке`);
      continue;
    }
    if (url.hostname !== 'dev.pachca.com') continue;
    if (url.hash) fail(where, `адрес ${url.href}: якорь агенту не нужен, назовите раздел словами`);
    const route = url.pathname.replace(/^\/|\/$/g, '');
    const page = path.join(CONTENT, `${route.replace(/\.md$/, '')}.mdx`);
    if (fs.existsSync(page)) linked.push(page);
    else if (!fs.statSync(path.join(PUBLIC, route), { throwIfNoEntry: false })?.isFile()) {
      fail(where, `адрес ${url.href}: такой страницы нет`);
    }
  }

  const pages = homes.get(prompt.id) ?? [];
  if (pages.length === 0) {
    fail(
      where,
      'промпт не показан ни на одной странице: добавьте <AgentPrompt id="…" /> или удалите файл'
    );
    continue;
  }
  if (pages.length > 1) {
    fail(where, `у промпта один дом, а он показан на ${pages.map(routeOf).join(', ')}`);
  }
  const home = pages[0];
  const homeUrl = `${SITE}/${routeOf(home)}.md`;

  if (!text.includes(homeUrl)) {
    fail(where, `нет адреса своей страницы ${homeUrl}: по ней агент выполняет задачу`);
  }
  if (!text.includes(`curl -sL ${homeUrl}`)) {
    fail(where, `нет команды «curl -sL ${homeUrl}»: ею агент скачивает страницу целиком`);
  }
  // The opening with curl is assembled from `pages` in lib/agent-prompts.ts: the first page is
  // the one that shows the block, and the file itself does not repeat the common sentence.
  if ('pages' in data) {
    const listed = Array.isArray(data.pages) ? data.pages : [];
    if (listed.length === 0 || !listed.every((page) => typeof page === 'string')) {
      fail(where, 'поле pages: список страниц вида guides/bots/first-bot');
    } else if (listed[0] !== routeOf(home)) {
      fail(where, `поле pages: первой идёт страница с блоком, ${routeOf(home)}`);
    }
    const { content } = matter(fs.readFileSync(path.join(PROMPTS, `${prompt.id}.md`), 'utf-8'));
    if (content.includes('Инструмент для веба отдаёт пересказ')) {
      fail(
        where,
        'общую фразу про curl и инструмент для веба собирает шаблон: уберите её из файла'
      );
    }
  }

  // «из раздела «…»», «по шагам «…», «…» и «…»»: every section and step the prompt names
  // must exist on its page or on a page it links to.
  const titles = new Set([home, ...linked].flatMap((file) => [...sectionTitles(file)]));
  const sectionRef = /(?:раздел|шаг)\S*(?:\s+[^\s«]+){0,2}?\s+((?:«[^»]+»(?:,\s+|\s+и\s+)?)+)/gi;
  for (const [, named] of text.matchAll(sectionRef)) {
    for (const [, title] of named.matchAll(/«([^»]+)»/g)) {
      if (!titles.has(title)) fail(where, `раздела или шага «${title}» нет на страницах промпта`);
    }
  }

  // The Markdown version an agent reads must carry the prompt word for word.
  const generated = path.join(PUBLIC, `${routeOf(home)}.md`);
  if (!fs.existsSync(generated)) {
    fail(where, `нет ${path.relative(DOCS, generated)}: соберите документацию (npx turbo build)`);
  } else if (!fs.readFileSync(generated, 'utf-8').includes(agentPromptToMarkdown(prompt))) {
    fail(where, `в ${path.relative(DOCS, generated)} промпт отличается от исходного: пересоберите`);
  }
}

if (errors.length > 0) {
  console.error(`✗ промпты для агента, ошибок: ${errors.length}\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ промпты для агента: ${prompts.length}, каждый на своей странице, ссылки целы`);
