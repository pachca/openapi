import { toSlug } from '../utils/transliterate';
import { getWordVariants, isBrandWord, stemRussian } from './synonyms';

/**
 * Sections of a guide page for the search index: every `##`/`###` heading and
 * every `<Step title="…">`, each with the plain text that follows it.
 *
 * The anchor is the id the page renders, so a search result lands on the
 * heading: `markdown-content.tsx` gives h2/h3 `toSlug(String(children))`, and
 * `steps.tsx` gives a step `toSlug(title)`. A page with the same heading twice
 * keeps only the first, as `getElementById` does.
 */
export interface PageSection {
  /** Anchor on the page, without `#` */
  slug: string;
  /** Heading as the reader sees it */
  heading: string;
  /** 2 for `##`, 3 for `###` and `<Step>` (both render as h3) */
  level: 2 | 3;
  /**
   * Plain text of the section itself, up to the next heading of any level:
   * a parent heading does not repeat the text of its subsections, so a hit in
   * that text points at the subsection.
   */
  text: string;
  /** Short plain-text preview for the result list */
  snippet: string;
}

const SNIPPET_LENGTH = 160;

/** Attributes whose values are visible text (step and card titles, captions, prompts). */
const TEXT_ATTRIBUTES = new Set(['title', 'subtitle', 'description', 'caption', 'ask', 'label']);
/** A JSX attribute value: a string, an expression (two levels of nested braces) or a bare word. */
const JSX_VALUE = String.raw`"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|[^\s"'{}>]+`;
const JSX_TAG = new RegExp(
  String.raw`<\/?[A-Za-z][\w.]*((?:\s+[\w:.-]+(?:\s*=\s*(?:${JSX_VALUE}))?)*)\s*\/?>`,
  'g'
);
const JSX_ATTRIBUTE = new RegExp(String.raw`([\w:.-]+)\s*=\s*(${JSX_VALUE})`, 'g');

/**
 * Remove markdown formatting from text for cleaner search results
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_)
      // Note: Only remove underscores used for markdown, not within words like access_token
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove headings (# text)
      .replace(/^#+\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove strikethrough (~~text~~)
      .replace(/~~([^~]+)~~/g, '$1')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Heading text as the renderer receives it: inline markup removed. */
function cleanHeading(raw: string): string {
  return raw
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim();
}

/** MDX section source → plain text: no tags, expressions, tables or link targets. */
export function mdxToPlainText(source: string): string {
  const code: string[] = [];
  let text = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Inline code keeps its text (`<токен>`, `{{ client }}`): set aside until
    // the end. `\|` is a pipe escaped for a table cell: the reader sees `|`.
    .replace(
      /`([^`\n]+)`/g,
      (_match, value: string) => `\u0000${code.push(value.replace(/\\\|/g, '|')) - 1}\u0000`
    )
    // An escaped pipe in table text is a pipe too, not a cell border.
    .replace(/\\\|/g, '\u0001');
  // JSX tags go, the values of their text attributes stay.
  text = text.replace(JSX_TAG, (_tag, attributes: string) => {
    const values: string[] = [];
    for (const [, name, value] of attributes.matchAll(JSX_ATTRIBUTE)) {
      if (TEXT_ATTRIBUTES.has(name) && /^["']/.test(value)) values.push(value.slice(1, -1));
    }
    return ` ${values.join(' ')} `;
  });
  // MDX expressions in the text ({…}, {{…}}): innermost first.
  for (let i = 0; i < 3; i++) text = text.replace(/\{[^{}]*\}/g, ' ');
  text = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/\u0001/g, '|')
    .replace(/\u0000(\d+)\u0000/g, (_match, n: string) => code[Number(n)]);
  return stripMarkdown(text);
}

/** First ~160 characters, cut at a word boundary. */
export function makeSnippet(text: string, length = SNIPPET_LENGTH): string {
  if (text.length <= length) return text;
  const cut = text.slice(0, length + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, length)).replace(
    /[\s,.;:—–-]+$/,
    ''
  );
  return `${base}…`;
}

const SNIPPET_BEFORE = 60;
const SNIPPET_AFTER = 100;
const EDGE_PUNCTUATION = /^[\s,.;:—–-]+|[\s,.;:—–-]+$/g;

/**
 * Snippet around a match at `at`: about 60 characters before it and 100
 * after, cut at words, with an ellipsis where the text goes on.
 */
export function snippetAround(text: string, at: number): string {
  if (at <= SNIPPET_BEFORE) return makeSnippet(text, at + SNIPPET_AFTER);
  let start = at - SNIPPET_BEFORE;
  const space = text.indexOf(' ', start);
  if (space !== -1 && space < at) start = space + 1;
  let end = Math.min(text.length, at + SNIPPET_AFTER);
  if (end < text.length) {
    const lastSpace = text.lastIndexOf(' ', end);
    if (lastSpace > at) end = lastSpace;
  }
  const body = text.slice(start, end).replace(EDGE_PUNCTUATION, '');
  return `…${body}${end < text.length ? '…' : ''}`;
}

const HEADING_RE = /^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/;
const STEP_RE = /<Step\s+title=(?:"([^"]*)"|'([^']*)')/;
const STEP_END_RE = /<\/Step>/;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;

interface OpenSection {
  slug: string;
  heading: string;
  level: 2 | 3;
  lines: string[];
  isStep: boolean;
}

/**
 * Extract h2/h3 headings and step titles with their own text from MDX source
 * (frontmatter already removed).
 */
export function extractSections(mdx: string): PageSection[] {
  const sections: OpenSection[] = [];
  const seen = new Set<string>();
  let current: OpenSection | null = null;
  /** Heading section a step interrupts: text after `</Step>` goes back to it. */
  let beforeStep: OpenSection | null = null;
  let fence: string | null = null;

  const open = (heading: string, level: 2 | 3, isStep: boolean): OpenSection | null => {
    const slug = toSlug(heading);
    if (!slug || seen.has(slug)) return null;
    seen.add(slug);
    const section: OpenSection = { slug, heading, level, lines: [], isStep };
    sections.push(section);
    return section;
  };

  for (const line of mdx.split('\n')) {
    // Code blocks: skipped, and a `#` inside one is not a heading.
    const fenceMatch = line.match(FENCE_RE);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }

    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      if (depth <= 3) {
        beforeStep = null;
        // `#` is the page title (rendered by the page header): it ends a section
        // but does not start one.
        current = depth === 1 ? null : open(cleanHeading(headingMatch[2]), depth as 2 | 3, false);
        continue;
      }
    }

    const stepMatch = line.match(STEP_RE);
    if (stepMatch) {
      if (current && !current.isStep) beforeStep = current;
      current = open(stepMatch[1] ?? stepMatch[2], 3, true);
      // `<Step title="…">text</Step>` or `<Step title="…" />` on one line.
      const tagEnd = line.indexOf('>', (stepMatch.index ?? 0) + stepMatch[0].length);
      const rest = tagEnd >= 0 ? line.slice(tagEnd + 1) : '';
      const endAt = rest.search(STEP_END_RE);
      if (endAt >= 0 || line[tagEnd - 1] === '/') {
        if (endAt > 0) current?.lines.push(rest.slice(0, endAt));
        current = beforeStep;
      } else if (rest.trim()) {
        current?.lines.push(rest);
      }
      continue;
    }

    if (STEP_END_RE.test(line)) {
      if (current?.isStep || current === null) current = beforeStep;
      continue;
    }

    current?.lines.push(line);
  }

  return sections.map(({ slug, heading, level, lines }) => {
    const text = mdxToPlainText(lines.join('\n'));
    return { slug, heading, level, text, snippet: makeSnippet(text) };
  });
}

// ---------------------------------------------------------------------------
// Section index and ranking
// ---------------------------------------------------------------------------

/** A section in the search index. Only id/url/titles/snippet reach the client. */
export interface SectionEntry {
  /** = url */
  id: string;
  /** Page URL + `#` + anchor */
  url: string;
  pageUrl: string;
  pageTitle: string;
  /** Heading text */
  title: string;
  /** Snippet from the start of the section */
  description: string;
  headingLower: string;
  /** Heading words, padded: `' word word '` */
  headingWords: string;
  /** Section text as is, for a snippet around a match (server side only) */
  text: string;
  /** Section text, lowercased (server side only) */
  textLower: string;
  /** Section text words, padded like headingWords */
  textWords: string;
}

/** Sorted vocabulary with postings: word-prefix lookups by binary search. */
interface TermIndex {
  words: string[];
  postings: Map<string, number[]>;
}

/** Words of a short text (a page title) for literal term checks. */
interface TitleWords {
  /** Padded: `' word word '` */
  words: string;
  /** The title, lowercased: for whole-token and identifier terms */
  lower: string;
  /** Stems of the words, 5+ letters */
  stems: string[];
}

export interface SectionIndex {
  entries: SectionEntry[];
  heading: TermIndex;
  text: TermIndex;
  /** Stem of a heading word (5+ letters) → sections */
  headingStems: Map<string, number[]>;
  /** Page URL → words of its title */
  pageTitles: Map<string, TitleWords>;
}

export interface SectionPage {
  url: string;
  /** Title the page has in search results */
  title: string;
  sections: PageSection[];
}

/** Stems shorter than this are not compared, they match too many words. */
const MIN_COMPARED_STEM = 5;

function splitWords(lower: string): string[] {
  return lower.split(/[^\p{L}\p{N}_]+/u).filter(Boolean);
}

function stemsOf(words: string[]): string[] {
  return words
    .map((word) => stemRussian(word))
    .filter((stem): stem is string => stem !== undefined && stem.length >= MIN_COMPARED_STEM);
}

function addPosting(postings: Map<string, number[]>, word: string, section: number) {
  const list = postings.get(word);
  if (!list) postings.set(word, [section]);
  else if (list[list.length - 1] !== section) list.push(section);
}

function toTermIndex(postings: Map<string, number[]>): TermIndex {
  return { words: [...postings.keys()].sort(), postings };
}

/**
 * Sections that have a word starting with `prefix`; with `accept`, only the
 * words whose rest after the prefix it accepts.
 */
function collectPrefix(
  index: TermIndex,
  prefix: string,
  out: Set<number>,
  accept?: (rest: string) => boolean
) {
  const { words } = index;
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (words[mid] < prefix) lo = mid + 1;
    else hi = mid;
  }
  for (let i = lo; i < words.length && words[i].startsWith(prefix); i++) {
    if (accept && !accept(words[i].slice(prefix.length))) continue;
    for (const section of index.postings.get(words[i])!) out.add(section);
  }
}

export function buildSectionIndex(pages: SectionPage[]): SectionIndex {
  const entries: SectionEntry[] = [];
  const heading = new Map<string, number[]>();
  const text = new Map<string, number[]>();
  const headingStems = new Map<string, number[]>();
  const pageTitles = new Map<string, TitleWords>();

  for (const page of pages) {
    const titleLower = page.title.toLowerCase();
    const titleTerms = splitWords(titleLower);
    pageTitles.set(page.url, {
      words: ` ${titleTerms.join(' ')} `,
      lower: titleLower,
      stems: stemsOf(titleTerms),
    });

    for (const section of page.sections) {
      const n = entries.length;
      const url = `${page.url}#${section.slug}`;
      const headingLower = section.heading.toLowerCase();
      const textLower = section.text.toLowerCase();
      const headingTerms = splitWords(headingLower);
      const textTerms = splitWords(textLower);
      for (const word of headingTerms) addPosting(heading, word, n);
      for (const stem of stemsOf(headingTerms)) addPosting(headingStems, stem, n);
      for (const word of textTerms) addPosting(text, word, n);
      entries.push({
        id: url,
        url,
        pageUrl: page.url,
        pageTitle: page.title,
        title: section.heading,
        description: section.snippet,
        headingLower,
        headingWords: ` ${headingTerms.join(' ')} `,
        text: section.text,
        textLower,
        textWords: ` ${textTerms.join(' ')} `,
      });
    }
  }

  return {
    entries,
    heading: toTermIndex(heading),
    text: toTermIndex(text),
    headingStems,
    pageTitles,
  };
}

/**
 * How a section matches:
 * - `heading`: its heading has the whole query, the page title does not;
 * - `breadcrumb`: the heading and the page title have the query only
 *   together ("Исходящие вебхуки › Проверьте подпись");
 * - `near`: the heading, with the page title, has every word of the query
 *   but one, and the section's own text has that one ("vs code через токен"
 *   on "VS Code и GitHub Copilot", "cursor сервер" on "Cursor"). Only while
 *   no section is a `heading` or `breadcrumb` match: for "vs code" the
 *   "Claude Code" section, whose text mentions VS Code, is no match of its
 *   own next to "VS Code и GitHub Copilot". The word from the text has three
 *   letters or more and is not the heading of another section of the page
 *   ("claude desktop" is not "Devin Desktop", whose text mentions Claude).
 *   On the reader's page only the heading counts for both, not the title;
 * - `partial`: the heading has some of the query, or only synonyms, or the
 *   page title already has the whole query;
 * - `body`: only the section text has it.
 */
export type SectionMatch = 'heading' | 'breadcrumb' | 'near' | 'partial' | 'body';

/** Strongest match first: the order of the reader's page sections. */
const MATCH_ORDER: Record<SectionMatch, number> = {
  heading: 0,
  breadcrumb: 1,
  near: 2,
  partial: 3,
  body: 4,
};

/** A match that names the section: it goes right in front of its page. */
export function isStrongMatch(match: SectionMatch): boolean {
  return match === 'heading' || match === 'breadcrumb' || match === 'near';
}

export interface SectionQuery {
  /**
   * The query looks like code (`chat_id`, `entityType`, `oauth`). With `_` or
   * `.` (or other signs) it is matched at an identifier start; a plain Latin
   * word goes by word start like any word.
   */
  isCodeQuery: boolean;
  /** Query, lowercased and trimmed */
  lowerQuery: string;
  /** Query without stop words (`removeStopWords`) */
  cleanedQuery: string;
}

export interface RankOptions {
  /** Path of the page the reader is on: up to five of its sections, any match */
  currentPath?: string;
  /**
   * Highest score of a `heading`, `breadcrumb` or `near` section whose page
   * is not among the results; the indexer puts it below every result with
   * the query in its title.
   */
  orphanMax?: number;
  /**
   * Highest score of a `partial` or `body` section whose page is not among
   * the results; the indexer puts it below the lowest of the first ten
   * results, so such a section never goes above a page that matched.
   */
  orphanWeakMax?: number;
}

export interface RankedSection {
  entry: SectionEntry;
  match: SectionMatch;
  score: number;
  /** A strong match of a page among the results: it goes right in front of that page */
  anchored: boolean;
  /** A section of the page the reader is on */
  current: boolean;
  /** Preview for the result list: around the first match for a `body` hit */
  snippet: string;
}

/** At most this many sections of one page in the results */
export const MAX_SECTIONS_PER_PAGE = 2;

/** At most this many sections of the page the reader is on */
export const MAX_CURRENT_PAGE_SECTIONS = 5;

/** The same heading on sibling pages (six SDKs, bot guides): at most this many times */
export const MAX_SAME_HEADING = 2;

/** Highest score of a `partial` section: below the title matches of other results. */
const PARTIAL_MAX = 12;

/**
 * Highest score of a `heading`, `breadcrumb` or `near` section whose page did
 * not match the query: below a result with the query in its title (18 and
 * more). A one-word query gets `PARTIAL_MAX`: one word of a heading is a weak
 * sign ("Через API" for "api", "Ошибки доступа" for "ошибки") next to pages
 * that matched.
 */
export const ORPHAN_MAX = 17;

/** A letter or a digit: a query without one (".", "{}", "—") has nothing to look for. */
const HAS_WORD = /[\p{L}\p{N}]/u;

/** Text reduced to its words, for comparing a heading with the query. */
function normalizeWords(text: string): string {
  return splitWords(text.toLowerCase()).join(' ');
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const VOWEL_END = /[аеёиоуыэюя]$/;

/**
 * A heading or title stem agrees with the query stem: the same, or one letter
 * shorter when that letter is a vowel the stemmer left of an ending
 * ("переменна" of "переменная" and "переменн" of "переменные"). A consonant
 * is the root: "подписк" (подписка) and "подпис" (подписи) are other words.
 */
function stemAgrees(queryStem: string, stem: string): boolean {
  return (
    queryStem === stem ||
    (queryStem.length === stem.length + 1 &&
      queryStem.startsWith(stem) &&
      VOWEL_END.test(queryStem))
  );
}

/**
 * Short Latin words ("cli", "api", "vs") match a whole word or the word with
 * an English ending, not every word they start: "cli" is in "CLI" and
 * "clis", not in "Cline"; "set" is not in "setup".
 */
const SHORT_LATIN = /^[a-z]{1,3}$/;
const ENGLISH_ENDINGS = new Set(['', 's', 'es', 'ed']);

/**
 * Endings a Russian word or stem takes, up to three letters: the stemmer's
 * own and the other case endings of nouns and adjectives. "форм" is in
 * "формы" and "формой", not in "формате" (формат).
 */
const NOUN_ENDINGS = [
  '',
  ...['а', 'я', 'о', 'е', 'ё', 'и', 'ы', 'у', 'ю', 'ь', 'й'],
  ...['ой', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ие', 'ые', 'ую', 'юю', 'ою', 'ею'],
  ...['ом', 'ем', 'ам', 'ям', 'ах', 'ях', 'ов', 'ев', 'ми', 'их', 'ых', 'им', 'ым'],
  ...['ью', 'ья', 'ье', 'ьи', 'ия', 'ии', 'ию', 'ами', 'ями', 'ого', 'его', 'ому', 'ему'],
];

/**
 * The verb and short participle endings, only for a verb in the query
 * (`VERB_FORM`): "подключ" of "подключить" is in "подключите", not in
 * "подключение"; "прав" of "права" is not in "правила".
 */
const VERB_ENDINGS = [
  ...['ть', 'ти', 'ать', 'ять', 'ить', 'еть', 'уть', 'ыть', 'ет', 'ит', 'ут', 'ют', 'ят'],
  ...['ешь', 'ишь', 'ете', 'ите', 'ает', 'яет', 'ают', 'яют', 'ьте', 'йте'],
  ...['ал', 'ял', 'ил', 'ел', 'ла', 'ли', 'ло', 'ала', 'яла', 'ила', 'ела', 'али', 'яли'],
  ...['или', 'ели', 'ен', 'ена', 'ено', 'ены'],
];

/** An infinitive: the query word is a verb, its stem takes `VERB_ENDINGS` too. */
const VERB_FORM = /(?:ть|ться|чь)$/;

const CYRILLIC_WORD = /^[а-яё]+$/;

/** A last letter that is an ending or part of one, see `WordForm`. */
const LAST_VOWEL = /[аеёиоуыэюяйь]$/;

/** A word of up to this many letters keeps its last one: "не" is not "н". */
const MIN_WITHOUT_LAST = 3;

/** The rest of a word after a short Latin word start, see `SHORT_LATIN`. */
const acceptEnglishEnding = (rest: string) => ENGLISH_ENDINGS.has(rest);

/** Sections with a word that starts with `start` (a short Latin one: see `SHORT_LATIN`). */
function collectWordStart(index: TermIndex, start: string, out: Set<number>) {
  collectPrefix(index, start, out, SHORT_LATIN.test(start) ? acceptEnglishEnding : undefined);
}

const NOT_WORD_BEFORE = String.raw`(?<![\p{L}\p{N}_])`;
const WORD_END = String.raw`(?![\p{L}\p{N}_])`;

/** Endings as an optional group, longest first. */
function endingSource(endings: Iterable<string>): string {
  const alternatives = [...endings].filter(Boolean).sort((a, b) => b.length - a.length);
  return `(?:${alternatives.map(escapeRegExp).join('|')})?`;
}

/**
 * How one query word is found in a heading, a title or a text: a word that
 * starts with one of `starts`, and with `rest` only if it accepts the rest
 * of the word after it.
 *
 * - a Russian word: its stem (or the word, without a stem) and an ending
 *   (`NOUN_ENDINGS`, a verb `VERB_ENDINGS` too), the stem shorter by a vowel
 *   too (`agreeingStems`), and the word without its last vowel, `ь` or `й`
 *   ("подключени" of "подключение", whose stem is "подключен", in
 *   "подключениями"). "форма" is in "Формы", not in "Форматированный";
 *   "права" in "Наборы прав", not in "Правила";
 * - a short Latin word: the word or the word with an English ending;
 * - any other word (`webhook`, `n8n`): every word it starts.
 */
interface WordForm {
  starts: string[];
  rest?: (rest: string) => boolean;
  /** Matches a padded word list (`' word word '`) */
  inWords: RegExp;
  /** Regular expression source for the word in raw text, see `firstMatch` */
  inText: string;
}

/** One word of a form: in a padded word list and in raw text. */
function wordSources(word: string): {
  starts: string[];
  rest?: (rest: string) => boolean;
  inWords: string;
  inText: string;
} {
  if (CYRILLIC_WORD.test(word)) {
    const stem = stemRussian(word);
    const starts = new Set(stem ? agreeingStems(stem) : [word]);
    if (word.length > MIN_WITHOUT_LAST && LAST_VOWEL.test(word)) starts.add(word.slice(0, -1));
    const endings = new Set(
      VERB_FORM.test(word) ? [...NOUN_ENDINGS, ...VERB_ENDINGS] : NOUN_ENDINGS
    );
    const start = `(?:${[...starts].map(escapeRegExp).join('|')})${endingSource(endings)}`;
    return {
      starts: [...starts],
      rest: (rest) => endings.has(rest),
      inWords: start,
      inText: `${start}${WORD_END}`,
    };
  }
  const start = escapeRegExp(word);
  if (SHORT_LATIN.test(word)) {
    return {
      starts: [word],
      rest: acceptEnglishEnding,
      inWords: `${start}${endingSource(ENGLISH_ENDINGS)}`,
      inText: `${start}${endingSource(ENGLISH_ENDINGS)}${WORD_END}`,
    };
  }
  return { starts: [word], inWords: `${start}[^ ]*`, inText: start };
}

function wordForm(word: string): WordForm {
  const { inWords, ...form } = wordSources(word);
  return { ...form, inWords: new RegExp(` ${inWords} `) };
}

/**
 * Words in a row ("vs code" for "vscode" and "vs-code", "ссылки-приглашения"
 * for "ссылка-приглашение"), each of them found as `WordForm` says.
 */
interface Phrase {
  /** The first word: the sections to check */
  first: WordForm;
  /** Matches a padded word list */
  inWords: RegExp;
  /** Regular expression source for the phrase in raw text */
  inText: string;
}

function phraseOf(text: string): Phrase {
  const words = text.split(' ');
  const sources = words.map(wordSources);
  return {
    first: wordForm(words[0]),
    inWords: new RegExp(` ${sources.map((s) => s.inWords).join(' ')} `),
    inText: sources.map((s) => s.inText).join(String.raw`[^\p{L}\p{N}_]+`),
  };
}

/**
 * The parts of a hyphenated word in a row, from a word start, as the section
 * search finds them in a text: "gemini-cli" in "Gemini CLI", "ссылка-приглашение"
 * in "ссылки-приглашения", "read-only" in "read-only" and "read only", not in
 * "thread … only". For the page results of the same query, on lowercased text.
 */
export function hyphenPhrase(word: string): RegExp | undefined {
  const parts = splitWords(word.toLowerCase());
  if (parts.length < 2) return undefined;
  return new RegExp(`${NOT_WORD_BEFORE}${phraseOf(parts.join(' ')).inText}`, 'u');
}

/** Sections that have the word, see `WordForm`. */
function collectForm(index: TermIndex, form: WordForm, out: Set<number>) {
  for (const start of form.starts) collectPrefix(index, start, out, form.rest);
}

interface QueryTerm {
  term: string;
  /** The term itself as one word, see `WordForm` */
  forms: WordForm[];
  /** The term written as several words: "vs code" for "vscode" and "vs-code" */
  phrases: Phrase[];
  /** Word starts of its synonyms */
  synonyms: string[];
  /** Synonyms of several words */
  synonymPhrases: Phrase[];
  /** Russian stem, compared with the stems of heading and title words */
  stem?: string;
  /**
   * Instead of word starts: an identifier ("chat_id" at an identifier start)
   * or a term with no word of two letters ("c#", "c++") as a whole token. The
   * term itself is group 1.
   */
  pattern?: RegExp;
}

/**
 * Variants worth a lookup: words, and phrases for variants of several words.
 * One letter ("c" of "c#") starts half the words.
 */
function fragmentsOf(variants: string[]): { words: string[]; phrases: string[] } {
  const words = new Set<string>();
  const phrases = new Set<string>();
  for (const variant of variants) {
    const parts = splitWords(variant.toLowerCase());
    if (parts.length > 1) phrases.add(parts.join(' '));
    else if (parts.length === 1 && parts[0].length >= 2) words.add(parts[0]);
  }
  return { words: [...words], phrases: [...phrases] };
}

/** Letters and digits only: "vs code" and "vs-code" are "vscode". */
const squash = (text: string) => text.replace(/[^\p{L}\p{N}]+/gu, '');

function toQueryTerm(term: string, identifier: boolean): QueryTerm {
  const none = { forms: [], phrases: [], synonyms: [], synonymPhrases: [] };
  if (identifier) {
    // "chat_id" in "chat_id" and "message.chat_id", not inside "groupchat_id".
    return {
      term,
      ...none,
      pattern: new RegExp(`(?:^|[^a-z0-9])(${escapeRegExp(term)})`),
    };
  }
  const stem = stemRussian(term);
  const own = fragmentsOf(stem ? [term, stem] : [term]);
  const variants = fragmentsOf(getWordVariants(term));
  // A synonym that is the term split into words ("vs code" for "vscode") is
  // the term itself, as is a term of several words ("vs-code").
  const phrases = variants.phrases.filter((p) => squash(p) === squash(term));
  const synonyms = variants.words.filter((v) => !own.words.includes(v));
  const synonymPhrases = variants.phrases.filter((p) => !phrases.includes(p));
  // The term as one word: the stem is part of its form, not a word start.
  const word = splitWords(term);
  const forms = word.length === 1 && word[0].length >= 2 ? [wordForm(word[0])] : [];
  if (forms.length === 0 && phrases.length === 0) {
    return {
      term,
      ...none,
      synonyms,
      pattern: new RegExp(
        String.raw`(?:^|[^\p{L}\p{N}_])(${escapeRegExp(term)})(?![\p{L}\p{N}_])`,
        'u'
      ),
    };
  }
  return {
    term,
    forms,
    phrases: phrases.map(phraseOf),
    synonyms,
    synonymPhrases: synonymPhrases.map(phraseOf),
    stem,
  };
}

/** Heading stems that agree with the query stem, see `stemAgrees`. */
function agreeingStems(stem: string): string[] {
  const shorter = stem.slice(0, -1);
  return VOWEL_END.test(stem) && shorter.length >= MIN_COMPARED_STEM ? [stem, shorter] : [stem];
}

/** Sections whose heading or text has the words of `phrase` in a row. */
function collectPhrase(
  index: SectionIndex,
  phrase: Phrase,
  heading: Set<number>,
  text: Set<number>
) {
  const inHeading = new Set<number>();
  const inText = new Set<number>();
  collectForm(index.heading, phrase.first, inHeading);
  collectForm(index.text, phrase.first, inText);
  for (const n of inHeading) if (phrase.inWords.test(index.entries[n].headingWords)) heading.add(n);
  for (const n of inText) if (phrase.inWords.test(index.entries[n].textWords)) text.add(n);
}

/**
 * The term is in a title literally: a word of it as the heading lookup finds
 * one (`WordForm`), the phrase, or a word whose stem agrees.
 */
function titleHasTerm(title: TitleWords, term: QueryTerm): boolean {
  if (term.pattern) return term.pattern.test(title.lower);
  return (
    [...term.forms, ...term.phrases].some((form) => form.inWords.test(title.words)) ||
    (term.stem !== undefined && title.stems.some((s) => stemAgrees(term.stem!, s)))
  );
}

/** A synonym's word start in raw text, as `collectWordStart` matches it. */
function wordStartSource(start: string): string {
  const source = escapeRegExp(start);
  return SHORT_LATIN.test(start) ? `${source}${endingSource(ENGLISH_ENDINGS)}${WORD_END}` : source;
}

/** Position of the first match of any term in the text, or -1. */
function firstMatch(text: string, terms: QueryTerm[]): number {
  const starts = new Set<string>();
  for (const term of terms) {
    if (term.pattern) continue;
    for (const form of [...term.forms, ...term.phrases, ...term.synonymPhrases]) {
      starts.add(form.inText);
    }
    for (const word of term.synonyms) starts.add(wordStartSource(word));
  }
  let first = -1;
  if (starts.size > 0) {
    const match = new RegExp(`${NOT_WORD_BEFORE}(?:${[...starts].join('|')})`, 'iu').exec(text);
    if (match) first = match.index;
  }
  for (const term of terms) {
    if (!term.pattern) continue;
    const match = new RegExp(term.pattern.source, `${term.pattern.flags}i`).exec(text);
    if (!match) continue;
    const at = match.index + match[0].length - match[1].length;
    if (first === -1 || at < first) first = at;
  }
  return first;
}

/**
 * Query words for the section ranking: no brand words. Every page is about
 * Пачка, so "к пачке" in "подключить vs code к пачке" says nothing about the
 * section; a query of the name alone keeps it ("Войдите в Пачку").
 */
function withoutBrandWords(words: string[]): string[] {
  const own = words.filter((word) => !isBrandWord(word.replace(/[^\p{L}\p{N}]+/gu, '')));
  return own.length > 0 ? own : words;
}

/**
 * Sections for a query, scored on the same scale as the page results
 * (`pageScores`: page URL → its score for this query):
 *
 * - every cleaned query word (stop and brand words removed, see
 *   `withoutBrandWords`) must be in the section (heading or text, by word
 *   start, stem or synonym) or in the page title, and at least one in the
 *   section itself. An identifier (`chat_id`) is matched at an identifier
 *   start, a term without a word of two letters (`c#`) as a whole token, a
 *   hyphenated one (`vs-code`) as a phrase; in a heading, a title and a text
 *   alike a short Latin word as a whole word (`SHORT_LATIN`), a Russian one
 *   as its stem with an ending (`WordForm`);
 * - `heading`, `breadcrumb` and `near` (see `SectionMatch`): the score of
 *   their page, and the indexer puts them right in front of it (`anchored`).
 *   A page that did not match the query at all leaves its section the
 *   heading formula: exact heading +14 or the query as whole words +10, two
 *   or more cleaned query words +20 or one +3, and +7 (`breadcrumb` and
 *   `near`: 3 per heading word + 7), capped by `orphanMax` and `ORPHAN_MAX`,
 *   by `PARTIAL_MAX` for a one-word query;
 * - `partial`: `min(page − 1, 12, 3 × heading words + 5)`, heading words
 *   counted with synonyms: below its page and below title matches;
 * - `body`: `min(page − 2, 8)` with two or more cleaned query words as a
 *   phrase in the text, `min(page − 2, 4)` otherwise;
 * - a `partial` or `body` section of a page that is not among the results:
 *   its own score (`min(12, 3 × heading words + 5)`, or 8 or 4), capped by
 *   `orphanWeakMax`;
 * - on a tie, the section whose heading has more of the query literally
 *   first, then in page order;
 * - per page at most two sections, best first; a page with a strong match
 *   shows only those; the same heading on several pages at most twice;
 * - the page the reader is on (`currentPath`): up to five sections of any
 *   match, strongest match first, then by score, then as above. The page
 *   itself is not listed next to them, so its `partial` and `body` sections
 *   keep their own score, not held below the page. They come first in the
 *   returned list.
 */
export function rankSections(
  index: SectionIndex,
  { isCodeQuery, lowerQuery, cleanedQuery }: SectionQuery,
  pageScores: Map<string, number>,
  { currentPath, orphanMax = ORPHAN_MAX, orphanWeakMax = Infinity }: RankOptions = {}
): RankedSection[] {
  if (!HAS_WORD.test(lowerQuery)) return [];
  // Identifiers ("chat_id", "message.id") by identifier start; a plain Latin
  // word ("oauth", "cursor", "entityType") by word start like any word.
  const identifier = isCodeQuery && !/^[a-z0-9]+$/.test(lowerQuery);
  const query = identifier ? lowerQuery : cleanedQuery || lowerQuery;
  // A hyphen inside a word keeps it one term, its parts a phrase ("vs-code"
  // is "vs code", "gemini-cli" is "gemini cli"); a dash between words splits.
  const words = identifier
    ? [lowerQuery]
    : withoutBrandWords([
        ...new Set(
          query
            .split(/[\s–—]+/)
            .map((w) => w.replace(/^-+|-+$/g, ''))
            .filter((w) => w.length > 1 && HAS_WORD.test(w))
        ),
      ]);
  if (words.length === 0) return [];
  const terms = words.map((word) => toQueryTerm(word, identifier));

  // Per term: sections with it in the heading literally / by synonym, in the
  // text literally / by synonym.
  const inHeading: Set<number>[] = [];
  const bySynonym: Set<number>[] = [];
  const inText: Set<number>[] = [];
  const bySynonymInText: Set<number>[] = [];
  for (const term of terms) {
    const heading = new Set<number>();
    const synonym = new Set<number>();
    const text = new Set<number>();
    const synonymText = new Set<number>();
    const { pattern } = term;
    if (pattern) {
      index.entries.forEach((entry, n) => {
        if (pattern.test(entry.headingLower)) heading.add(n);
        else if (pattern.test(entry.textLower)) text.add(n);
      });
    } else {
      // The heading and the text by the same rule (`WordForm`): "форма" is
      // not in "Форматированный текст", "права" not in "Правила".
      for (const form of term.forms) {
        collectForm(index.heading, form, heading);
        collectForm(index.text, form, text);
      }
      if (term.stem) {
        for (const stem of agreeingStems(term.stem)) {
          for (const n of index.headingStems.get(stem) ?? []) heading.add(n);
        }
      }
      for (const phrase of term.phrases) collectPhrase(index, phrase, heading, text);
      for (const word of term.synonyms) {
        collectWordStart(index.heading, word, synonym);
        collectWordStart(index.text, word, synonymText);
      }
      for (const phrase of term.synonymPhrases) {
        collectPhrase(index, phrase, synonym, synonymText);
      }
    }
    inHeading.push(heading);
    bySynonym.push(synonym);
    inText.push(text);
    bySynonymInText.push(synonymText);
  }

  // Which terms the page title has literally, per page.
  const titleTerms = new Map<string, boolean[]>();
  const termsInTitle = (entry: SectionEntry): boolean[] => {
    let inTitle = titleTerms.get(entry.pageUrl);
    if (!inTitle) {
      const title = index.pageTitles.get(entry.pageUrl);
      inTitle = terms.map((term) => title !== undefined && titleHasTerm(title, term));
      titleTerms.set(entry.pageUrl, inTitle);
    }
    return inTitle;
  };

  // Candidates: sections with a query word of their own, and every word in
  // the section or in the page title ("подпись вебхука" in "Исходящие вебхуки
  // › Проверьте подпись").
  const sets = [inHeading, bySynonym, inText, bySynonymInText];
  const own = new Set<number>();
  for (const perTerm of sets) for (const set of perTerm) for (const n of set) own.add(n);
  const candidates = [...own].filter((n) => {
    const inTitle = termsInTitle(index.entries[n]);
    return terms.every((_, i) => inTitle[i] || sets.some((perTerm) => perTerm[i].has(n)));
  });
  if (candidates.length === 0) return [];

  // The multi-word bonus counts the cleaned terms: "как токен" is "токен".
  const normalizedQuery = normalizeWords(words.join(' '));
  const multiWord = terms.length >= 2;
  const orphanCap = Math.min(orphanMax, multiWord ? ORPHAN_MAX : PARTIAL_MAX);

  interface Facts {
    n: number;
    entry: SectionEntry;
    /** Per term: the heading has it literally */
    literal: boolean[];
    literalHits: number;
    /** Terms in the heading, literally or by synonym */
    anyHits: number;
    /** Per term: the page title has it, for `breadcrumb` and `near` */
    inTitle: boolean[];
    titleHasQuery: boolean;
    pageScore: number | undefined;
    current: boolean;
  }
  const facts: Facts[] = candidates.map((n) => {
    const entry = index.entries[n];
    const literal = terms.map((_, i) => inHeading[i].has(n));
    const inTitle = termsInTitle(entry);
    const current = currentPath !== undefined && entry.pageUrl === currentPath;
    return {
      n,
      entry,
      literal,
      literalHits: literal.filter(Boolean).length,
      anyHits: terms.filter((_, i) => literal[i] || bySynonym[i].has(n)).length,
      // On the reader's page the title is the same for every section: a word
      // of it does not make a heading with one query word a `breadcrumb` or
      // `near` match ("n8n триггер" on "n8n, Триггер" is not "Вернитесь в n8n
      // и активируйте"), only the heading counts.
      inTitle: current ? terms.map(() => false) : inTitle,
      // The page title has the whole query: elsewhere its headings are only
      // `partial`, the page itself is the match. On the reader's page the
      // title no longer tells its sections apart ("подключение" on "MCP,
      // Подключение": "Способы подключения" is a heading match).
      titleHasQuery: !current && inTitle.every(Boolean),
      pageScore: pageScores.get(entry.pageUrl),
      current,
    };
  });

  /** The heading and the page title have every term */
  const isBreadcrumb = (f: Facts) =>
    !f.titleHasQuery && f.literalHits > 0 && f.literal.every((has, i) => has || f.inTitle[i]);
  /**
   * The heading and the page title have every term but one, the section text
   * has that one. Not a word of two letters ("не", "vs"): it is in half the
   * texts. Not a word that is the whole heading of another section of the
   * page: "claude desktop" is about "Claude", not about "Devin Desktop",
   * whose text mentions Claude.
   */
  const isNear = (f: Facts) => {
    if (f.titleHasQuery || f.literalHits === 0) return false;
    const missing = terms.flatMap((_, i) => (f.literal[i] || f.inTitle[i] ? [] : [i]));
    if (missing.length !== 1) return false;
    const [m] = missing;
    if (terms[m].term.length < 3 || !inText[m].has(f.n)) return false;
    for (const n of inHeading[m]) {
      const other = index.entries[n];
      if (other.pageUrl === f.entry.pageUrl && !other.headingWords.trim().includes(' ')) {
        return false;
      }
    }
    return true;
  };
  const nearAllowed = multiWord && !facts.some(isBreadcrumb);

  interface Scored {
    entry: SectionEntry;
    match: SectionMatch;
    score: number;
    anchored: boolean;
    current: boolean;
    literalHits: number;
    n: number;
  }
  const scored: Scored[] = [];
  for (const f of facts) {
    const { entry, pageScore, current, literalHits, anyHits } = f;
    let match: SectionMatch;
    let score: number;
    if (literalHits === terms.length && !f.titleHasQuery) {
      match = 'heading';
      const heading = entry.headingWords.trim();
      const phrase =
        heading === normalizedQuery
          ? 14
          : entry.headingWords.includes(` ${normalizedQuery} `)
            ? 10
            : 0;
      score = pageScore ?? Math.min(phrase + (multiWord ? 20 : 3) + 5 + 2, orphanCap);
    } else if (isBreadcrumb(f) || (nearAllowed && isNear(f))) {
      match = isBreadcrumb(f) ? 'breadcrumb' : 'near';
      score = pageScore ?? Math.min(3 * literalHits + 7, orphanCap);
    } else {
      let own: number;
      if (anyHits > 0) {
        match = 'partial';
        own = Math.min(PARTIAL_MAX, 3 * anyHits + 5);
      } else {
        match = 'body';
        own = multiWord && entry.textWords.includes(` ${normalizedQuery} `) ? 8 : 4;
      }
      const belowPage = match === 'partial' ? 1 : 2;
      score = current
        ? own
        : pageScore !== undefined
          ? Math.min(pageScore - belowPage, own)
          : Math.min(own, orphanWeakMax);
    }
    scored.push({
      entry,
      match,
      score,
      anchored: isStrongMatch(match) && pageScore !== undefined,
      current,
      literalHits,
      n: f.n,
    });
  }

  // Best first; on a tie, more of the query in the heading, then page order.
  scored.sort((a, b) => b.score - a.score || b.literalHits - a.literalHits || a.n - b.n);

  const onPage = scored
    .filter((s) => s.current)
    .sort(
      (a, b) =>
        MATCH_ORDER[a.match] - MATCH_ORDER[b.match] ||
        b.score - a.score ||
        b.literalHits - a.literalHits ||
        a.n - b.n
    )
    .slice(0, MAX_CURRENT_PAGE_SECTIONS);

  const others = scored.filter((s) => !s.current);
  const pagesWithStrongMatch = new Set(
    others.filter((s) => isStrongMatch(s.match)).map((s) => s.entry.pageUrl)
  );
  const perPage = new Map<string, number>();
  const perHeading = new Map<string, number>();
  const picked: Scored[] = [];
  for (const s of others) {
    const { pageUrl, headingWords } = s.entry;
    if (!isStrongMatch(s.match) && pagesWithStrongMatch.has(pageUrl)) continue;
    const count = perPage.get(pageUrl) ?? 0;
    const same = perHeading.get(headingWords) ?? 0;
    if (count >= MAX_SECTIONS_PER_PAGE || same >= MAX_SAME_HEADING) continue;
    perPage.set(pageUrl, count + 1);
    perHeading.set(headingWords, same + 1);
    picked.push(s);
  }

  return [...onPage, ...picked].map(({ entry, match, score, anchored, current }) => {
    const at = match === 'body' ? firstMatch(entry.text, terms) : -1;
    return {
      entry,
      match,
      score,
      anchored,
      current,
      snippet: at >= 0 ? snippetAround(entry.text, at) : entry.description,
    };
  });
}
