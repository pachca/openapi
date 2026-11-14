// Готовые промпты для ИИ-агента: блок <AgentPrompt id="…" /> на странице гайда и его
// Markdown-версия. Текст каждого промпта лежит отдельным файлом content/prompts/<id>.md:
// страница ссылается на него по идентификатору, а проверка scripts/check-agent-prompts.ts
// читает те же файлы.

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PROMPTS_DIR = path.join(process.cwd(), 'content', 'prompts');

/** Заголовок блока, если файл промпта не задаёт свой */
const DEFAULT_TITLE = 'Сделать с агентом';

const SITE = 'https://dev.pachca.com';

/**
 * Общая часть первого абзаца: откуда взять страницы и когда остановиться. Она одна на все
 * промпты, поэтому лежит здесь, а не в каждом файле: так её меняют в одном месте, а файл
 * промпта держит только задачу и шаги. Curl идёт первым, потому что инструмент для веба
 * у агентов отдаёт пересказ страницы и теряет детали.
 */
function fetchSentence(pages: string[], mcp: boolean): string {
  const urls = pages.map((page) => `${SITE}/${page}.md`).join(' ');
  const one = pages.length === 1;
  const fetch = one
    ? 'Скачай страницу документации и делай по ней'
    : 'Скачай страницы документации и делай по ним';
  const failed = one ? 'страница не открылась' : 'страницы не открылись';
  const orNoPachca = mcp ? ' или у тебя нет инструментов Пачки' : '';
  return (
    `${fetch}: \`curl -sL ${urls}\`. Инструмент для веба отдаёт пересказ, бери его, ` +
    `только если curl не сработал. Если ${failed} и так${orNoPachca}, остановись и скажи.`
  );
}

export interface AgentPromptData {
  id: string;
  /** Заголовок блока */
  title: string;
  /** Что сделает агент: одно предложение без точки */
  does: string;
  /** Нужна ли агенту подключённая Пачка: тогда промпт ведёт на страницу подключения */
  mcp: boolean;
  /** Своя подпись под промптом вместо общей: куда его вставить */
  hint?: string;
  /**
   * Страницы, по которым агент делает задачу, вида `guides/bots/first-bot`: первая — та, где
   * стоит блок. По ним собирается общая часть первого абзаца. Без поля текст берётся из файла
   * как есть (так устроен промпт подключения: он совпадает с экраном в приложении).
   */
  pages: string[];
  /** Текст промпта, который копирует читатель: первый абзац файла с общей частью и остальной текст */
  text: string;
}

function readPrompt(id: string): AgentPromptData {
  const file = path.join(PROMPTS_DIR, `${id}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`<AgentPrompt id="${id}">: нет файла content/prompts/${id}.md`);
  }
  const { data, content } = matter(fs.readFileSync(file, 'utf-8'));
  if (typeof data.does !== 'string' || !data.does.trim()) {
    throw new Error(`content/prompts/${id}.md: во фронтматтере нужна строка does`);
  }
  const pages = Array.isArray(data.pages) ? data.pages.map(String) : [];
  const mcp = data.mcp !== false;
  // CRLF from a Windows checkout would count twice toward the limit and reach the clipboard.
  const body = content.replace(/\r\n?/g, '\n').trim();
  let text = body;
  if (pages.length > 0) {
    const [task, ...rest] = body.split('\n\n');
    text = [`${task} ${fetchSentence(pages, mcp)}`, ...rest].join('\n\n');
  }
  return {
    id,
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : DEFAULT_TITLE,
    does: data.does.trim(),
    mcp,
    hint: typeof data.hint === 'string' && data.hint.trim() ? data.hint.trim() : undefined,
    pages,
    text,
  };
}

/** Промпт по идентификатору. Нет файла или строки `does` — ошибка сборки, а не пустой блок. */
export function getAgentPrompt(id: string): AgentPromptData {
  return readPrompt(id);
}

/** Все промпты из content/prompts по алфавиту идентификаторов */
export function getAllAgentPrompts(): AgentPromptData[] {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  return fs
    .readdirSync(PROMPTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''))
    .sort()
    .map(readPrompt);
}

/**
 * Подпись под промптом: куда его вставить. Одна на страницу и на Markdown-версию.
 * Общая подпись ведёт на подключение Пачки. Промпт с `mcp: false` задаёт свою в поле `hint`.
 */
export function agentPromptHint(prompt: Pick<AgentPromptData, 'hint'>): {
  before: string;
  link?: { text: string; href: string };
} {
  if (prompt.hint) return { before: prompt.hint };
  return {
    before: 'Вставьте промпт в чат с ИИ-агентом, к которому ',
    link: { text: 'подключена Пачка', href: '/guides/mcp/connect' },
  };
}

/**
 * Markdown-версия блока: заголовок с тем, что сделает агент, и промпт блоком кода.
 * Промпт велит агенту скачать `.md` своей же страницы, и там агент встречает этот же текст:
 * последняя фраза перед блоком говорит ему, что это копия, а не новое задание.
 * Ограда длиннее любой серии обратных кавычек в тексте, чтобы блок не закрылся раньше.
 */
export function agentPromptToMarkdown(prompt: AgentPromptData): string {
  const longestRun = Math.max(0, ...(prompt.text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const hint = agentPromptHint(prompt);
  const where = hint.link ? `${hint.before}[${hint.link.text}](${hint.link.href})` : hint.before;
  const forAgent =
    'Агенту, который уже выполняет этот промпт: ниже его копия, начинать заново не нужно.';
  return `**${prompt.title}.** ${prompt.does}. ${where}. ${forAgent}\n\n${fence}text\n${prompt.text}\n${fence}`;
}
