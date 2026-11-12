// Search by page sections: extraction from MDX, ranking rules, and the real
// index on the real content. Run: bun scripts/test-search.ts
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import {
  buildSectionIndex,
  extractSections,
  hyphenPhrase,
  isStrongMatch,
  makeSnippet,
  MAX_CURRENT_PAGE_SECTIONS,
  MAX_SAME_HEADING,
  mdxToPlainText,
  rankSections,
  snippetAround,
  type RankedSection,
  type RankOptions,
  type SectionIndex,
  type SectionMatch,
  type SectionPage,
} from '../lib/search/sections';
import {
  limitResults,
  mergeSections,
  parseCurrentPath,
  search,
  sortResults,
  titleMatcher,
  toSearchHit,
  type SearchResult,
} from '../lib/search/indexer';
import { removeStopWords } from '../lib/search/synonyms';
import {
  decodeHash,
  focusWithoutScroll,
  pushHash,
  rememberedScrollPosition,
} from '../lib/utils/scroll-offset';
import { toSlug } from '../lib/utils/transliterate';

let failed = 0;
let passed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
  } catch (error) {
    failed++;
    console.error(`✗ ${name}\n  ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Extraction -------------------------------------------------------------

const SAMPLE = `# Заголовок страницы

Вступление до первого раздела.

<Steps>
  <Step title="Добавьте сервер">
    Текст шага со [ссылкой](/guides/x#y) и \`кодом\`.

    \`\`\`bash
    # не заголовок
    npx skills add
    \`\`\`
  </Step>
  <Step title="Войдите в Пачку">
    Второй шаг.
  </Step>
</Steps>

## Программы

Вступление раздела **Программы**.

### VS Code и GitHub Copilot

Текст про VS Code.

<ImageCard src="/a.webp" alt="скрытый alt" caption="Подпись картинки" maxWidth={500} />

| Поле | Описание |
|------|----------|
| \`url\` | Адрес |

### Cursor

Текст про Cursor.

## Обычный текст (plain_text)

<Steps>
  <Step title="Шаг внутри раздела">
    Текст шага.
  </Step>
</Steps>

Текст после шагов снова относится к разделу.

## Программы

Повтор заголовка: на странице id уже занят.
`;

await test('extracts h2, h3 and steps in page order, h1 skipped', () => {
  const sections = extractSections(SAMPLE);
  assert.deepEqual(
    sections.map((s) => [s.level, s.slug, s.heading]),
    [
      [3, 'dobavte-server', 'Добавьте сервер'],
      [3, 'voydite-v-pachku', 'Войдите в Пачку'],
      [2, 'programmy', 'Программы'],
      [3, 'vs-code-i-github-copilot', 'VS Code и GitHub Copilot'],
      [3, 'cursor', 'Cursor'],
      [2, 'obychnyy-tekst-plaintext', 'Обычный текст (plain_text)'],
      [3, 'shag-vnutri-razdela', 'Шаг внутри раздела'],
    ]
  );
});

await test('anchors are toSlug of the heading, as markdown-content.tsx and steps.tsx render them', () => {
  for (const s of extractSections(SAMPLE)) assert.equal(s.slug, toSlug(s.heading));
});

await test('a repeated heading keeps the first, like getElementById', () => {
  const programs = extractSections(SAMPLE).filter((s) => s.slug === 'programmy');
  assert.equal(programs.length, 1);
  assert.match(programs[0].text, /Вступление раздела Программы/);
  assert.doesNotMatch(programs[0].text, /Повтор заголовка/);
});

await test('section text: own text only, markdown and JSX stripped, code blocks skipped', () => {
  const byslug = new Map(extractSections(SAMPLE).map((s) => [s.slug, s]));
  const step = byslug.get('dobavte-server')!;
  assert.equal(step.text, 'Текст шага со ссылкой и кодом.');
  // Parent heading does not repeat its subsections.
  assert.equal(byslug.get('programmy')!.text, 'Вступление раздела Программы.');
  const vscode = byslug.get('vs-code-i-github-copilot')!.text;
  assert.match(vscode, /Подпись картинки/);
  assert.doesNotMatch(vscode, /скрытый alt|maxWidth|500|<|\|/);
  assert.match(vscode, /url Адрес/);
  // Text after </Steps> goes back to the heading the steps are in.
  assert.equal(
    byslug.get('obychnyy-tekst-plaintext')!.text,
    'Текст после шагов снова относится к разделу.'
  );
  assert.equal(byslug.get('shag-vnutri-razdela')!.text, 'Текст шага.');
});

await test('snippet: up to ~160 characters, cut at a word', () => {
  const long = 'слово '.repeat(60).trim();
  const snippet = makeSnippet(long);
  assert.ok(snippet.length <= 161, `length ${snippet.length}`);
  assert.ok(snippet.endsWith('слово…'), snippet.slice(-10));
  assert.equal(makeSnippet('коротко'), 'коротко');
});

await test('real page: anchors that dev.pachca.com renders on /guides/mcp/connect', () => {
  const file = join(import.meta.dirname, '..', 'content', 'guides', 'mcp', 'connect.mdx');
  const { content } = matter(readFileSync(file, 'utf8'));
  const slugs = new Set(extractSections(content).map((s) => s.slug));
  for (const id of [
    'dobavte-server',
    'kto-mozhet-podklyuchit',
    'vs-code-i-github-copilot',
    'cursor',
    'token-v-zagolovke',
    'peremennaya-okruzheniya',
  ]) {
    assert.ok(slugs.has(id), `no #${id}`);
  }
});

await test('escaped pipes in inline code and table text read as pipes', () => {
  assert.equal(
    mdxToPlainText('| Поле | Тип |\n|---|---|\n| `a \\| b` | x \\| y |'),
    'Поле Тип a | b x | y'
  );
});

await test('snippet around a match: ~60 characters before, ~100 after, ellipses', () => {
  const text = `${'начало '.repeat(30)}маркер ${'конец '.repeat(40)}`.trim();
  const at = text.indexOf('маркер');
  const snippet = snippetAround(text, at);
  assert.ok(snippet.startsWith('…') && snippet.endsWith('…'), snippet);
  assert.ok(snippet.includes('маркер'), snippet);
  const before = snippet.indexOf('маркер') - 1;
  assert.ok(before >= 50 && before <= 60, `before ${before}`);
  assert.ok(snippet.length <= 165, `length ${snippet.length}`);
  // A match near the start: the start of the text, no leading ellipsis.
  assert.ok(!snippetAround(text, 10).startsWith('…'));
});

// --- Ranking rules (synthetic index) ----------------------------------------

function section(heading: string, text: string) {
  return { slug: toSlug(heading), heading, level: 3 as const, text, snippet: makeSnippet(text) };
}

const CONNECT = '/guides/mcp/connect';
const PAGES: SectionPage[] = [
  {
    url: CONNECT,
    title: 'MCP, Подключение',
    sections: [
      section('Claude Code', 'Если плагин стоит в Cursor или VS Code, команду пропустите.'),
      section(
        'VS Code и GitHub Copilot',
        'Сначала проверьте список серверов, VS Code подключает их.'
      ),
      section('Cursor', 'Персональный токен в заголовке.'),
      section('Переменная окружения', 'Значение, которое система передаёт программам.'),
      section('Особые случаи', 'Подключение в CI с токеном.'),
      section('Токен бота', 'Токен для общего сервиса.'),
    ],
  },
  {
    url: '/guides/webhook/handler',
    title: 'Исходящие вебхуки, Безопасность и обработчик',
    sections: [
      section('Проверьте подпись', 'Сравните заголовок Pachca-Signature с подписью тела.'),
      section('Ответ', 'Верните 200.'),
    ],
  },
  {
    url: '/guides/cli/scripting',
    title: 'CLI, Флаги и скрипты',
    sections: [section('Переменные окружения', 'PACHCA_TOKEN и другие.')],
  },
  ...['go', 'python', 'kotlin'].map((language) => ({
    url: `/guides/sdk/${language}`,
    title: `SDK, ${language}`,
    sections: [section('OAuthError', 'Ошибка авторизации OAuth.')],
  })),
  {
    url: '/guides/forms/handling',
    title: 'Формы, Обработка форм',
    sections: [
      section('Получение результатов', 'Событие с callback_id и значениями полей.'),
      section('Ошибки', 'Ответ с errors и callback_id формы.'),
      section('Закрытие', 'Тоже упоминает callback_id.'),
    ],
  },
  {
    url: '/guides/misc',
    title: 'Разное',
    sections: [
      section('AI-агент с CLI', 'Команды curl и cat в терминале.'),
      section('SDK для C#', 'Клиент на C# и .NET.'),
      section('Проверка подписи', 'Сверьте подпись запроса.'),
      section('Идентификаторы', 'Поле groupchat_id устарело.'),
      section('Поля события', 'В событии есть chat_id и message_id.'),
      section(
        'Длинный раздел',
        `${'Вводный текст без нужного слова. '.repeat(8)}Здесь упомянут вебхук один раз. ${'Хвост раздела. '.repeat(10)}`.trim()
      ),
      section('Cline', 'Расширение редактора.'),
      section('Вывод', 'Ответ приходит в формате JSON.'),
      section('Отправка', 'Бот не отвечает формой.'),
    ],
  },
];
const INDEX = buildSectionIndex(PAGES);

function rank(
  query: string,
  pageScores: Record<string, number> = {},
  {
    code = /_/.test(query),
    index = INDEX,
    ...options
  }: RankOptions & { code?: boolean; index?: SectionIndex } = {}
) {
  const lowerQuery = query.toLowerCase();
  return rankSections(
    index,
    {
      isCodeQuery: code,
      lowerQuery,
      cleanedQuery: code ? lowerQuery : removeStopWords(lowerQuery),
    },
    new Map(Object.entries(pageScores)),
    options
  );
}

const urlsOf = (ranked: ReturnType<typeof rank>) => ranked.map((r) => r.entry.url);

await test('heading with the whole query takes the score of its page, to go right in front of it', () => {
  const [top] = rank('vs code', { [CONNECT]: 29 });
  assert.equal(top.entry.url, `${CONNECT}#vs-code-i-github-copilot`);
  assert.equal(top.match, 'heading');
  assert.equal(top.score, 29);
  assert.ok(top.anchored);
});

await test('a page with a heading match shows only heading matches', () => {
  // "Claude Code" has "code" in the heading and "VS Code" in its text.
  const urls = urlsOf(rank('vs code', { [CONNECT]: 29 }));
  assert.deepEqual(urls, [`${CONNECT}#vs-code-i-github-copilot`]);
});

await test('stems: "переменная" finds "Переменные окружения"', () => {
  const urls = urlsOf(rank('переменная окружения', { [CONNECT]: 26 }));
  assert.ok(urls.includes('/guides/cli/scripting#peremennye-okruzheniya'), urls.join(', '));
  assert.equal(urls[0], `${CONNECT}#peremennaya-okruzheniya`);
});

await test('stems: a consonant is the root, "подписка" is not "подписи"', () => {
  assert.deepEqual(urlsOf(rank('подписка')), []);
  assert.deepEqual(urlsOf(rank('подписки')), []);
});

await test('every query word must be in the section', () => {
  assert.deepEqual(rank('cursor вебхук'), []);
});

await test('only the text matches: below its page', () => {
  const ranked = rank('callback_id', { '/guides/forms/handling': 11 });
  assert.ok(ranked.length > 0);
  for (const r of ranked) {
    assert.equal(r.match, 'body');
    assert.ok(r.score < 11, `score ${r.score}`);
  }
});

await test('at most two sections of a page', () => {
  const ranked = rank('callback_id', { '/guides/forms/handling': 11 });
  assert.equal(ranked.filter((r) => r.entry.pageUrl === '/guides/forms/handling').length, 2);
});

await test('page title and heading together: the score of its page, right in front of it', () => {
  const [top] = rank('подпись вебхука', { '/guides/webhook/handler': 31 });
  assert.equal(top.entry.url, '/guides/webhook/handler#proverte-podpis');
  assert.equal(top.match, 'breadcrumb');
  assert.equal(top.score, 31);
  assert.ok(top.anchored);
});

await test('a word inside a longer word is not a phrase match', () => {
  // "OAuthError" has the word by its start: a heading match without the phrase
  // bonus. No page matched: 3 + 7.
  const ranked = rank('oauth');
  assert.ok(ranked.length > 0);
  for (const r of ranked) {
    assert.equal(r.match, 'heading');
    assert.equal(r.score, 10);
    assert.ok(!r.anchored);
  }
});

await test('a heading whose page did not match: capped below title matches', () => {
  // Exact one-word heading: 14 + 3 + 7, capped at 12 for one word.
  assert.equal(rank('cursor').find((r) => r.entry.url === `${CONNECT}#cursor`)?.score, 12);
  // Exact two-word heading: 14 + 20 + 7, capped at 17.
  const [bot] = rank('токен бота');
  assert.equal(bot.entry.url, `${CONNECT}#token-bota`);
  assert.equal(bot.score, 17);
  // The indexer lowers the cap below its lowest title match.
  assert.equal(rank('токен бота', {}, { orphanMax: 9 })[0].score, 9);
});

await test('stop words do not count for the multi-word bonus: "как токен" is "токен"', () => {
  assert.deepEqual(rank('как токен'), rank('токен'));
  assert.deepEqual(rank('как токен', { [CONNECT]: 20 }), rank('токен', { [CONNECT]: 20 }));
  assert.deepEqual(rank('где переменная', { [CONNECT]: 9 }), rank('переменная', { [CONNECT]: 9 }));
});

await test('identifiers match at an identifier start, not inside a word', () => {
  const urls = urlsOf(rank('chat_id'));
  assert.ok(urls.includes('/guides/misc#polya-sobytiya'), urls.join(', '));
  assert.ok(!urls.includes('/guides/misc#identifikatory'), urls.join(', '));
  // A plain Latin word (code-like for the page search) goes by word start.
  const chat = urlsOf(rank('chat', {}, { code: true }));
  assert.ok(chat.includes('/guides/misc#polya-sobytiya'), chat.join(', '));
  assert.ok(!chat.includes('/guides/misc#identifikatory'), chat.join(', '));
});

await test('"c#": no section whose only hit is a word starting with c', () => {
  const ranked = rank('c#');
  assert.deepEqual(urlsOf(ranked), [`/guides/misc#${toSlug('SDK для C#')}`]);
  for (const r of ranked) {
    assert.ok(`${r.entry.headingLower} ${r.entry.textLower}`.includes('c#'), r.entry.url);
  }
  assert.deepEqual(rank('c++'), []);
});

await test('the same heading on sibling pages at most twice, best page first', () => {
  const ranked = rank('oautherror', {
    '/guides/sdk/kotlin': 9,
    '/guides/sdk/go': 8,
    '/guides/sdk/python': 7,
  });
  assert.equal(MAX_SAME_HEADING, 2);
  assert.deepEqual(urlsOf(ranked), ['/guides/sdk/kotlin#oautherror', '/guides/sdk/go#oautherror']);
});

await test('a body hit: the snippet is around the match', () => {
  const [hit] = rank('вебхук', { '/guides/misc': 10 }).filter(
    (r) => r.entry.url === '/guides/misc#dlinnyy-razdel'
  );
  assert.equal(hit.match, 'body');
  assert.ok(hit.snippet.startsWith('…'), hit.snippet);
  assert.ok(hit.snippet.includes('вебхук'), hit.snippet);
  assert.ok(!hit.entry.description.includes('вебхук'));
});

await test('current page: its sections first, strongest match first, up to five', () => {
  const ranked = rank('токен', { [CONNECT]: 10 }, { currentPath: CONNECT });
  const current = ranked.filter((r) => r.current);
  assert.deepEqual(
    current.map((r) => [r.entry.url, r.match]),
    [
      [`${CONNECT}#token-bota`, 'heading'],
      [`${CONNECT}#cursor`, 'body'],
      [`${CONNECT}#osobye-sluchai`, 'body'],
    ]
  );
  // Body hits of the current page stay, though the page has a heading match.
  assert.deepEqual(ranked.slice(0, current.length), current);
  assert.equal(MAX_CURRENT_PAGE_SECTIONS, 5);
  // Elsewhere a page with a heading match shows only that one.
  assert.deepEqual(urlsOf(rank('токен', { [CONNECT]: 10 })), [`${CONNECT}#token-bota`]);
});

await test('current page path: a site path only', () => {
  assert.equal(parseCurrentPath('/guides/mcp/connect'), '/guides/mcp/connect');
  assert.equal(parseCurrentPath('/guides/mcp/connect/'), '/guides/mcp/connect');
  assert.equal(parseCurrentPath('/'), '/');
  for (const bad of [
    null,
    '',
    'guides/mcp',
    '//evil.example/x',
    'https://evil.example/x',
    '/x?y=1',
    '/x#y',
    '/javascript:alert(1)',
    `/${'a'.repeat(200)}`,
  ]) {
    assert.equal(parseCurrentPath(bad), undefined, String(bad));
  }
});

await test('brand words do not count: "подключить vs code к пачке" is "подключить vs code"', () => {
  // "подключить" is not in the title "MCP, Подключение" (a verb takes a short
  // ending, "подключение" is another word): it is in the section text.
  const [top] = rank('подключить vs code к пачке', { [CONNECT]: 35 });
  assert.equal(top.entry.url, `${CONNECT}#vs-code-i-github-copilot`);
  assert.equal(top.match, 'near');
  assert.equal(top.score, 35);
  assert.ok(top.anchored);
  const plain = rank('vs code', { [CONNECT]: 29 });
  for (const brand of ['пачка', 'пачку', 'пачке', 'пачки', 'pachca']) {
    assert.deepEqual(rank(`vs code ${brand}`, { [CONNECT]: 29 }), plain, brand);
  }
});

await test('near: the heading has every word but one, its text has that one', () => {
  const [top] = rank('cursor токен', { [CONNECT]: 30 });
  assert.equal(top.entry.url, `${CONNECT}#cursor`);
  assert.equal(top.match, 'near');
  assert.equal(top.score, 30);
  assert.ok(top.anchored);
  assert.deepEqual(
    rank('cursor токен пачки', { [CONNECT]: 30 }),
    rank('cursor токен', { [CONNECT]: 30 })
  );
  // No page matched: the breadcrumb formula, 3 per heading word + 7.
  assert.equal(rank('cursor токен')[0].score, 10);
});

await test('near: not next to a heading with the whole query, not by a short word or a section name', () => {
  // "Claude Code" mentions VS Code in its text: "VS Code и GitHub Copilot" is the match.
  assert.ok(rank('vs code', { [CONNECT]: 29 }).every((r) => r.match !== 'near'));
  // "не" is in half the texts.
  const short = rank('отправка не').find(
    (r) => r.entry.url === `/guides/misc#${toSlug('Отправка')}`
  );
  assert.equal(short?.match, 'partial');
  // "cursor" is a section of the page: "Claude Code", whose text mentions it, is not a near match.
  const named = rank('claude cursor', { [CONNECT]: 30 }).find(
    (r) => r.entry.url === `${CONNECT}#claude-code`
  );
  assert.equal(named?.match, 'partial');
});

const TIE_PAGES: SectionPage[] = [
  {
    url: '/t/tokens',
    title: 'Боты, Токен бота',
    sections: [
      section('Где взять бота', 'Токен выдаёт администратор.'),
      section('Новый токен бота', 'Выпустите токен.'),
    ],
  },
  {
    url: '/t/misc',
    title: 'Разное',
    sections: [section('Канал и тег', 'Бот и ключ.'), section('Чат и тег', 'Бот и ключ.')],
  },
];
const TIE_INDEX = buildSectionIndex(TIE_PAGES);

await test('partial: min(page − 1, 12, 3 per heading word + 5), more heading words first', () => {
  const tokens = (score: number) =>
    rank('токен бота', { '/t/tokens': score }, { index: TIE_INDEX }).map((r) => [
      r.entry.url,
      r.match,
      r.score,
    ]);
  const [both, one] = [toSlug('Новый токен бота'), toSlug('Где взять бота')];
  assert.deepEqual(tokens(30), [
    [`/t/tokens#${both}`, 'partial', 11],
    [`/t/tokens#${one}`, 'partial', 8],
  ]);
  // A low page: both at page − 1, the heading with both words first.
  assert.deepEqual(tokens(5), [
    [`/t/tokens#${both}`, 'partial', 4],
    [`/t/tokens#${one}`, 'partial', 4],
  ]);
});

await test('partial: on a tie the heading with more of the query literally first, on the reader’s page too', () => {
  // "Канал" is "чат" by synonym: both headings have two of the words, "Чат и тег" literally.
  const expected = [`/t/misc#${toSlug('Чат и тег')}`, `/t/misc#${toSlug('Канал и тег')}`];
  for (const options of [{}, { currentPath: '/t/misc' }]) {
    const ranked = rank('чат тег бот ключ', { '/t/misc': 20 }, { index: TIE_INDEX, ...options });
    assert.deepEqual(
      ranked.map((r) => [r.match, r.score]),
      [
        ['partial', 11],
        ['partial', 11],
      ]
    );
    assert.deepEqual(urlsOf(ranked), expected, JSON.stringify(options));
  }
});

await test('orphan weak sections: capped by orphanWeakMax', () => {
  const ranked = rank('callback_id', {}, { orphanWeakMax: 2 });
  assert.ok(ranked.length > 0);
  for (const r of ranked) assert.ok(r.score <= 2, `${r.entry.url}: ${r.score}`);
});

await test('a query of signs only finds no sections', () => {
  for (const query of ['.', '{}', '_', '—', '...', '#', '()']) {
    assert.deepEqual(rank(query, {}, { code: true }), [], query);
    assert.deepEqual(rank(query, {}, { code: false }), [], query);
  }
});

await test('a short Latin word matches a whole word: "cli" is not in "Cline"', () => {
  const urls = urlsOf(rank('cli'));
  assert.ok(urls.includes('/guides/misc#ai-agent-s-cli'), urls.join(', '));
  assert.ok(!urls.includes('/guides/misc#cline'), urls.join(', '));
});

await test('a Russian stem in a section text takes an ending: "форма" is in "формой", not in "формате"', () => {
  const urls = urlsOf(rank('форма'));
  assert.ok(urls.includes(`/guides/misc#${toSlug('Отправка')}`), urls.join(', '));
  assert.ok(!urls.includes(`/guides/misc#${toSlug('Вывод')}`), urls.join(', '));
});

await test('synonym: "vscode" and "vs-code" are "vs code"', () => {
  for (const query of ['vscode', 'vs-code']) {
    const ranked = rank(query, { [CONNECT]: 29 });
    assert.deepEqual(urlsOf(ranked), [`${CONNECT}#vs-code-i-github-copilot`], query);
    assert.equal(ranked[0].match, 'heading', query);
  }
});

const WORD_PAGES: SectionPage[] = [
  {
    url: '/w/blocks',
    title: 'Формы, Блоки представления',
    sections: [
      section('Форматированный текст (markdown)', 'Жирный и курсив.'),
      section('Текстовое поле (input)', 'Поле формы для текста.'),
    ],
  },
  {
    url: '/w/watch',
    title: 'AI-агенты, Агент следит за тредом',
    sections: [section('Правила для агента', 'Агент отвечает в треде.')],
  },
  {
    url: '/w/permissions',
    title: 'Доступ',
    sections: [section('Наборы прав для агента', 'Агенту хватит чтения.')],
  },
];
const WORD_INDEX = buildSectionIndex(WORD_PAGES);

await test('a Russian word in a heading takes an ending too: "форма" is not in "Форматированный"', () => {
  const ranked = rank(
    'форма',
    { '/w/blocks': 22 },
    { index: WORD_INDEX, currentPath: '/w/blocks' }
  );
  assert.deepEqual(
    ranked.map((r) => [r.entry.url, r.match]),
    [[`/w/blocks#${toSlug('Текстовое поле (input)')}`, 'body']]
  );
});

await test('a Russian word in a heading and a title takes an ending: "права" is not "Правила"', () => {
  // "агента" is in the heading and in the title of the page: "права" is not in
  // "Правила", so that section has no match at all.
  const ranked = rank('права агента', {}, { index: WORD_INDEX });
  assert.deepEqual(
    ranked.map((r) => [r.entry.url, r.match]),
    [[`/w/permissions#${toSlug('Наборы прав для агента')}`, 'heading']]
  );
  // Nor in a page title: "Правила" › "Агент" is no match for "права агента".
  const titled = buildSectionIndex([
    { url: '/w/rules', title: 'Правила', sections: [section('Агент', 'Текст.')] },
  ]);
  assert.deepEqual(rank('права агента', {}, { index: titled }), []);
});

const N8N = '/w/n8n/trigger';
const N8N_INDEX = buildSectionIndex([
  {
    url: N8N,
    title: 'n8n, Триггер',
    sections: [
      section('Вернитесь в n8n и активируйте', 'Нажмите Activate.'),
      section('Режим n8n', 'Триггер ждёт события.'),
    ],
  },
]);

await test('reader’s page: a title word does not make a heading with one query word a strong match', () => {
  const step = `${N8N}#${toSlug('Вернитесь в n8n и активируйте')}`;
  const matchOf = (query: string, url: string) =>
    rank(query, { [N8N]: 28 }, { index: N8N_INDEX, currentPath: N8N }).find(
      (r) => r.entry.url === url
    )?.match;
  // "триггер" is only in the title: the heading has one word, a `partial`.
  assert.equal(matchOf('n8n триггер', step), 'partial');
  // "триггер" in the title and "activate" in the text: not `near` either.
  assert.equal(matchOf('n8n триггер activate', step), 'partial');
  // The section text still counts: "Режим n8n" with "Триггер" in its text.
  const [top] = rank('n8n триггер', { [N8N]: 28 }, { index: N8N_INDEX, currentPath: N8N });
  assert.deepEqual([top.entry.url, top.match], [`${N8N}#${toSlug('Режим n8n')}`, 'near']);
});

const HYPHEN_INDEX = buildSectionIndex([
  {
    url: '/h/connect',
    title: 'MCP, Подключение',
    sections: [
      section('Claude Code', 'Команда в терминале.'),
      section('VS Code и GitHub Copilot', 'Список серверов.'),
      section('Gemini CLI', 'Переменная PACHCA_TOKEN.'),
      section('Qwen Code', 'Это не Gemini, и CLI у него свой.'),
    ],
  },
  { url: '/h/cli', title: 'CLI, Обзор', sections: [section('Gemini', 'Агент в терминале.')] },
  {
    url: '/h/invite',
    title: 'Пространство',
    sections: [section('Ссылки-приглашения', 'Срок действия.')],
  },
]);

await test('a hyphenated query is a phrase: "vs-code" is "vs code", not "vs" and "code"', () => {
  for (const currentPath of [undefined, '/h/connect']) {
    const ranked = rank('vs-code', {}, { index: HYPHEN_INDEX, currentPath });
    assert.deepEqual(
      ranked.map((r) => [r.entry.url, r.match]),
      [['/h/connect#vs-code-i-github-copilot', 'heading']],
      String(currentPath)
    );
  }
  // Not "Gemini" on the CLI page, not "Gemini" and "CLI" apart in a text.
  assert.deepEqual(urlsOf(rank('gemini-cli', {}, { index: HYPHEN_INDEX })), [
    '/h/connect#gemini-cli',
  ]);
  // Each word of the phrase takes its ending.
  assert.deepEqual(urlsOf(rank('ссылка-приглашение', {}, { index: HYPHEN_INDEX })), [
    `/h/invite#${toSlug('Ссылки-приглашения')}`,
  ]);
});

await test('hyphenPhrase: the parts in a row from a word start, for the page results', () => {
  const gemini = hyphenPhrase('gemini-cli')!;
  assert.ok(gemini.test('настройка gemini cli и qwen code'));
  assert.ok(gemini.test('флаг gemini-cli'));
  // Not apart, and "cli" is a whole word, not "client".
  assert.ok(!gemini.test('gemini и cli'));
  assert.ok(!gemini.test('gemini client'));
  const readOnly = hyphenPhrase('read-only')!;
  assert.ok(readOnly.test('доступ read only'));
  assert.ok(!readOnly.test('thread only'));
  // Each Russian part takes its ending.
  assert.ok(hyphenPhrase('ссылка-приглашение')!.test('перевыпуск ссылки-приглашения'));
  assert.equal(hyphenPhrase('gemini'), undefined);
});

// --- Merging sections into the results (synthetic) --------------------------

function result(
  url: string,
  score: number,
  title = url,
  type: 'guide' | 'api' = 'api'
): SearchResult {
  return { id: url, title, description: '', url, type, keywords: [], score };
}

function rankedSection(
  url: string,
  match: SectionMatch,
  score: number,
  extra: Partial<RankedSection> = {}
): RankedSection {
  const entry = INDEX.entries.find((e) => e.url === url);
  assert.ok(entry, url);
  return { entry, match, score, anchored: false, current: true, snippet: '', ...extra };
}

await test('reader’s page: strong sections first, at most two weak ones above the others', () => {
  const strong = rankedSection(`${CONNECT}#token-bota`, 'heading', 10, { anchored: true });
  const weak = ['cursor', 'osobye-sluchai', 'claude-code'].map((slug) =>
    rankedSection(`${CONNECT}#${slug}`, 'body', 4)
  );
  const options = { currentPath: CONNECT, hasQueryInTitle: () => false };
  const urls = (scores: number[]) =>
    mergeSections(
      scores.map((score, i) => result(`/p${i}`, score)),
      [strong, ...weak],
      options
    ).map((r) => r.url);
  // Scored at least as the fourth other result: two of them on top, the
  // third by its score.
  assert.deepEqual(urls([30, 30, 30, 3, 2]), [
    `${CONNECT}#token-bota`,
    `${CONNECT}#cursor`,
    `${CONNECT}#osobye-sluchai`,
    '/p0',
    '/p1',
    '/p2',
    `${CONNECT}#claude-code`,
    '/p3',
    '/p4',
  ]);
  // Below the fourth: by score.
  assert.deepEqual(urls([30, 30, 30, 5, 2]), [
    `${CONNECT}#token-bota`,
    '/p0',
    '/p1',
    '/p2',
    '/p3',
    `${CONNECT}#cursor`,
    `${CONNECT}#osobye-sluchai`,
    `${CONNECT}#claude-code`,
    '/p4',
  ]);
});

await test('reader’s page: a strong section of another page on top keeps its page next to it', () => {
  const handler = '/guides/webhook/handler';
  const merged = mergeSections(
    [
      result(handler, 30, 'Обработчик', 'guide'),
      result('/p1', 2),
      result('/p2', 1),
      result('/p3', 1),
    ],
    [
      rankedSection(`${handler}#proverte-podpis`, 'heading', 30, {
        anchored: true,
        current: false,
      }),
      rankedSection(`${CONNECT}#cursor`, 'body', 4),
    ],
    { currentPath: CONNECT, hasQueryInTitle: () => false }
  ).map((r) => r.url);
  assert.deepEqual(merged, [
    `${handler}#proverte-podpis`,
    handler,
    `${CONNECT}#cursor`,
    '/p1',
    '/p2',
    '/p3',
  ]);
});

await test('route limit: one section in front of its page, none whose page is cut', () => {
  const anchoredTo = (url: string, score: number) => ({
    ...result(url, score, 'Раздел', 'guide'),
    pageTitle: 'Страница',
    anchored: true,
  });
  const filler = Array.from({ length: 17 }, (_, i) => result(`/x${i}`, 20));
  const limited = limitResults(
    [
      anchoredTo('/p#a', 30),
      anchoredTo('/p#b', 30),
      result('/p', 30, 'P', 'guide'),
      ...filler,
      anchoredTo('/q#c', 10),
      result('/q', 10, 'Q', 'guide'),
      result('/r', 5),
    ],
    20
  ).map((r) => r.url);
  assert.deepEqual(limited, ['/p#a', '/p', ...filler.map((r) => r.url), '/q']);
});

await test('page order: on a tie the result with the query in its title goes first', () => {
  const sorted = sortResults(
    [
      result('/api/chats/get', 22, 'Информация о чате'),
      result('/api/messages/get', 22, 'Информация о сообщении'),
      result('/guides/forms/handling', 22, 'Форма заявки'),
      result('/guides/markdown', 24, 'Разметка'),
    ],
    titleMatcher('форма', 'форма')
  );
  assert.deepEqual(
    sorted.map((r) => r.url),
    ['/guides/markdown', '/guides/forms/handling', '/api/chats/get', '/api/messages/get']
  );
});

// --- Jumps within the page ----------------------------------------------------

await test('decodeHash: the id decoded, a malformed escape kept as is', () => {
  assert.equal(decodeHash('#%D1%82%D0%BE%D0%BA%D0%B5%D0%BD'), 'токен');
  assert.equal(decodeHash('#100%'), '100%');
  assert.equal(decodeHash('cursor'), 'cursor');
  assert.equal(decodeHash(''), '');
});

await test('pushHash: Back to the URL it left returns to the remembered position', () => {
  const location = { pathname: '/guides/mcp/connect', search: '', hash: '' };
  const pushed: string[] = [];
  const fake = {
    location,
    scrollY: 640,
    history: {
      pushState: (_state: unknown, _title: string, url: string) => {
        pushed.push(url);
        location.hash = url.startsWith('#') ? url : '';
      },
    },
  };
  const global = globalThis as { window?: unknown };
  global.window = fake;
  try {
    pushHash('cursor');
    assert.deepEqual(pushed, ['#cursor']);
    location.hash = '';
    assert.equal(rememberedScrollPosition(), 640);
    // An empty id: back to the page without a hash.
    location.hash = '#cursor';
    pushHash('');
    assert.equal(pushed[1], '/guides/mcp/connect');
  } finally {
    delete global.window;
  }
});

await test('focusWithoutScroll: a heading gets tabindex="-1" and focus without a scroll', () => {
  const attributes = new Map<string, string>();
  const focused: unknown[] = [];
  const heading = {
    tabIndex: -1,
    hasAttribute: (name: string) => attributes.has(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    focus: (options: unknown) => focused.push(options),
  };
  focusWithoutScroll(heading as unknown as HTMLElement);
  assert.equal(attributes.get('tabindex'), '-1');
  assert.deepEqual(focused, [{ preventScroll: true }]);
  // A button is focusable as it is.
  const button = {
    tabIndex: 0,
    hasAttribute: () => false,
    setAttribute: () => assert.fail('tabindex on a button'),
    focus: () => {},
  };
  focusWithoutScroll(button as unknown as HTMLElement);
});

// --- Guide headings ---------------------------------------------------------

const CONTENT = join(import.meta.dirname, '..', 'content');

/** MDX files with sections in the index: the home page, guides, API guides. */
function contentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return contentFiles(path);
    return /\.mdx?$/.test(entry.name) ? [path] : [];
  });
}

/** Inline markup the renderer would pass to `toSlug(String(children))` as elements. */
const INLINE_MARKUP = /`|\[[^\]]*\]\([^)]*\)|\*|~~|(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/u;

await test('guide headings and step titles have no inline markup: their id is their plain text', () => {
  const files = [
    join(CONTENT, 'home.mdx'),
    ...contentFiles(join(CONTENT, 'guides')),
    ...contentFiles(join(CONTENT, 'api')),
  ];
  assert.ok(files.length > 50, `${files.length} files`);
  const offenders: string[] = [];
  for (const file of files) {
    const { content } = matter(readFileSync(file, 'utf8'));
    let fence: string | null = null;
    for (const line of content.split('\n')) {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
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
      const heading = line.match(/^ {0,3}#{2,3}\s+(.+?)(?:\s+#+)?\s*$/)?.[1];
      const step = line.match(/<Step\s+title=(?:"([^"]*)"|'([^']*)')/);
      const title = heading ?? step?.[1] ?? step?.[2];
      if (title && INLINE_MARKUP.test(title)) {
        offenders.push(`${file.slice(CONTENT.length + 1)}: ${title}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
  // The check itself: these would be caught.
  for (const bad of ['Поле `chat_id`', 'См. [раздел](#x)', '**Важно**', '_курсив_', '~~старое~~']) {
    assert.ok(INLINE_MARKUP.test(bad), bad);
  }
  assert.ok(!INLINE_MARKUP.test('Обычный текст (plain_text)'));
});

// --- The real index ---------------------------------------------------------

const topUrls = async (query: string, n = 5, currentPath?: string) =>
  (await search(query, { currentPath })).results.slice(0, n).map((r) => r.url);

const pageOf = (url: string) => url.split('#')[0];

await test('real index: "vs code" opens the VS Code section of the connection page', async () => {
  const urls = await topUrls('vs code', 3);
  assert.ok(urls.includes('/guides/mcp/connect#vs-code-i-github-copilot'), urls.join(', '));
  assert.ok(urls[0].endsWith('#vs-code-i-github-copilot'), urls[0]);
});

await test('real index: the owner’s phrasing opens the section first', async () => {
  for (const [query, url] of [
    ['как подключить vs code', '/guides/mcp/connect#vs-code-i-github-copilot'],
    ['подключить vs code', '/guides/mcp/connect#vs-code-i-github-copilot'],
    ['mcp в vs code', '/guides/mcp/connect#vs-code-i-github-copilot'],
    ['как подключить cursor', '/guides/mcp/connect#cursor'],
  ]) {
    assert.equal((await topUrls(query, 1))[0], url, query);
  }
});

await test('real index: headings that are the query come first', async () => {
  for (const [query, url] of [
    ['кто может подключить', '/guides/mcp/connect#kto-mozhet-podklyuchit'],
    ['переменная окружения', '/guides/mcp/connect#peremennaya-okruzheniya'],
    ['codex с токеном', '/guides/mcp/connect#codex-s-tokenom'],
  ]) {
    assert.equal((await topUrls(query, 1))[0], url, query);
  }
});

await test('real index: generic one-word headings stay below the canonical pages', async () => {
  for (const query of ['401', '403', '429', 'oauth', 'webhook', 'thread', 'api']) {
    const [top] = (await search(query)).results;
    assert.ok(!top.pageTitle, `${query}: ${top.url}`);
  }
  assert.equal((await topUrls('401', 1))[0], '/api/errors');
});

await test('real index: brand words and one word from the section text keep the section in front of its page', async () => {
  assert.equal(
    (await topUrls('подключить vs code к пачке', 1))[0],
    '/guides/mcp/connect#vs-code-i-github-copilot'
  );
  assert.equal((await topUrls('cursor сервер пачки', 1))[0], '/guides/mcp/connect#cursor');
  for (const query of ['vs code через токен', 'vs code токеном']) {
    const { results } = await search(query);
    const at = results.findIndex((r) => r.url === '/guides/mcp/connect#vs-code-i-github-copilot');
    assert.ok(at >= 0, `${query}: no VS Code section`);
    assert.equal(results[at + 1]?.url, '/guides/mcp/connect', `${query}: the page does not follow`);
    assert.equal(results[at].score, results[at + 1].score, query);
  }
  // "claude desktop": not "Devin Desktop", whose text mentions Claude.
  const { results } = await search('claude desktop');
  const devin = results.findIndex((r) => r.url === '/guides/mcp/connect#devin-desktop');
  const connect = results.findIndex((r) => r.url === '/guides/mcp/connect');
  assert.ok(devin === -1 || devin > connect, `Devin Desktop at ${devin}, the page at ${connect}`);
});

await test('real index: "vscode" opens the VS Code sections', async () => {
  assert.deepEqual(
    new Set(await topUrls('vscode', 2)),
    new Set([
      '/guides/mcp/connect#vs-code-i-github-copilot',
      '/guides/ai-agents/plugin#vs-code-i-github-copilot',
    ])
  );
});

await test('real index: a text match of "cli" is the word, of "переменная" its stem with an ending', async () => {
  // Sections matched in their text (the heading lacks the word): the snippet
  // is around the match, so it shows the word itself.
  const cases: [string, RegExp, RegExp][] = [
    ['cli', /cli/i, /(?<![\p{L}\p{N}_])cli(?:s|es|ed)?(?![\p{L}\p{N}_])/iu],
    ['переменная', /переменн/i, /(?<![\p{L}\p{N}_])переменн[а-яё]{1,3}(?![\p{L}\p{N}_])/iu],
  ];
  for (const [query, inHeading, word] of cases) {
    const inText = (await search(query)).results.filter(
      (r) => r.pageTitle && !inHeading.test(r.title)
    );
    assert.ok(inText.length > 0, query);
    for (const r of inText) assert.match(r.description, word, `${query}: ${r.url}`);
  }
  // No "Cline" section for "cli".
  assert.ok(!(await search('cli')).results.some((r) => r.url.endsWith('#cline')));
});

await test('real index: a query of signs only finds no sections and does not fail', async () => {
  for (const query of ['.', '{}', '_', '—', '...', '#']) {
    const { results } = await search(query);
    assert.ok(!results.some((r) => r.pageTitle), query);
  }
});

await test('real index: a weak section of a page that did not match stays below the first ten', async () => {
  for (const query of ['перезапуск', 'браузер', 'терминал']) {
    const { results } = await search(query);
    const pages = results.filter((r) => !r.pageTitle);
    const floor = Math.min(...pages.slice(0, 10).map((r) => r.score ?? 0));
    const orphans = results.filter(
      (r) => r.pageTitle && !pages.some((p) => p.url === pageOf(r.url))
    );
    assert.ok(orphans.length > 0, query);
    for (const r of orphans)
      assert.ok((r.score ?? 0) < floor, `${query}: ${r.url} ${r.score} ≥ ${floor}`);
  }
});

await test('real index: the route keeps one section per page in front of it', async () => {
  const limited = limitResults((await search('cursor сервер пачки')).results, 20);
  assert.ok(limited.length <= 20);
  const perPage = new Map<string, number>();
  limited.forEach((r, i) => {
    if (!r.anchored) return;
    perPage.set(pageOf(r.url), (perPage.get(pageOf(r.url)) ?? 0) + 1);
    assert.equal(limited[i + 1]?.url, pageOf(r.url), `${r.url}: its page does not follow`);
  });
  assert.ok(perPage.size > 0);
  for (const [page, count] of perPage) assert.equal(count, 1, page);
});

/** The indexer's test: the whole query in the title, from a word start. */
function hasQueryInTitle(result: SearchResult, query: string): boolean {
  const lower = query.toLowerCase().trim();
  return titleMatcher(lower, removeStopWords(lower))(result.title);
}

await test('real index: a title match counts from a word start ("форма" is not in "Информация")', async () => {
  // Pages tie at 22: "Информация о чате" does not go above "Формы, Блоки представления".
  const pages = (await search('форма')).results.filter((r) => !r.pageTitle);
  assert.deepEqual(
    pages.slice(0, 2).map((r) => r.url),
    ['/guides/markdown', '/guides/forms/blocks']
  );
});

const SAMPLE_QUERIES = [
  'vs code',
  'как подключить vs code',
  'cursor',
  'переменная окружения',
  'токен бота',
  'codex с токеном',
  '401',
  '429',
  'oauth',
  'webhook',
  'api',
  'токен',
  'вебхук',
  'подпись вебхука',
  'ссылка-приглашение',
  'callback_id',
];

await test('real index: a section of a page among the results sits right in front of it', async () => {
  for (const query of SAMPLE_QUERIES) {
    const { results } = await search(query);
    results.forEach((r, i) => {
      if (!r.pageTitle) return;
      const page = results.findIndex((p) => !p.pageTitle && p.url === pageOf(r.url));
      if (page === -1 || results[page].score !== r.score) return;
      assert.ok(page > i, `${query}: ${r.url} below its page`);
      for (const between of results.slice(i + 1, page)) {
        assert.equal(
          pageOf(between.url),
          pageOf(r.url),
          `${query}: ${between.url} splits ${r.url}`
        );
      }
    });
  }
});

await test('real index: no section above a page or method with the query in its title', async () => {
  for (const query of SAMPLE_QUERIES) {
    const { results } = await search(query);
    results.forEach((r, i) => {
      if (!r.pageTitle) return;
      for (const other of results.slice(i + 1)) {
        if (other.pageTitle || !hasQueryInTitle(other, query)) continue;
        // Only its own page, scored higher, can carry a section above it.
        const ownPage = results.find((p) => !p.pageTitle && p.url === pageOf(r.url));
        assert.ok(
          (r.score ?? 0) > (other.score ?? 0) &&
            ownPage &&
            (ownPage.score ?? 0) > (other.score ?? 0),
          `${query}: ${r.url} (${r.score}) above ${other.url} (${other.score})`
        );
      }
    });
  }
});

await test('real index: at most two sections of a page, eight in all, a heading twice', async () => {
  for (const query of [
    ...SAMPLE_QUERIES,
    'пагинация',
    'выпустите токен',
    'oautherror',
    'через api',
  ]) {
    const { results } = await search(query);
    const sections = results.filter((r) => r.pageTitle);
    assert.ok(sections.length <= 8, `${query}: ${sections.length} sections`);
    const perPage = new Map<string, number>();
    const perHeading = new Map<string, number>();
    for (const r of sections) {
      assert.ok(r.url.includes('#'), `${query}: ${r.url}`);
      perPage.set(pageOf(r.url), (perPage.get(pageOf(r.url)) ?? 0) + 1);
      const heading = r.title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_]+/gu, ' ')
        .trim();
      perHeading.set(heading, (perHeading.get(heading) ?? 0) + 1);
    }
    for (const [page, count] of perPage) assert.ok(count <= 2, `${query}: ${page} × ${count}`);
    for (const [heading, count] of perHeading) {
      assert.ok(count <= 2, `${query}: "${heading}" × ${count}`);
    }
  }
});

await test('real index: "c#" sections have "c#" in the heading or around the snippet', async () => {
  const { results } = await search('c#');
  for (const r of results.filter((r) => r.pageTitle)) {
    assert.ok(`${r.title} ${r.description}`.toLowerCase().includes('c#'), r.url);
  }
});

await test('real index: methods still lead action queries', async () => {
  assert.equal((await topUrls('отправить сообщение', 1))[0], '/api/messages/create');
  const { results } = await search('chat_id');
  assert.equal(results[0].type, 'api');
  assert.ok(!results[0].url.includes('#'));
});

await test('real index: field matches keep their place', async () => {
  const { results } = await search('callback_id');
  assert.ok(results[0].matchedByField, JSON.stringify(results[0].url));
  assert.equal(results[0].matchedValue?.value, 'callback_id');
});

await test('real index: the client gets no keywords or field lists', async () => {
  const { results } = await search('chat_id');
  const hit = toSearchHit(results[0]) as Record<string, unknown>;
  for (const key of ['keywords', 'schemaFields', 'codeValues', 'onCurrentPage', 'anchored']) {
    assert.ok(!(key in hit), key);
  }
  assert.ok(String(hit.description).length <= 301);
});

// --- The page the reader is on ----------------------------------------------

const isCurrent = (r: SearchResult) => pageOf(r.url) === CONNECT && r.url.includes('#');

await test('current page: its sections first, at most five, the page itself dropped', async () => {
  for (const query of ['токен', 'codex', 'переменная', 'перезапуск', 'vs code', 'подключение']) {
    const { results } = await search(query, { currentPath: CONNECT });
    const current = results.filter(isCurrent);
    assert.ok(current.length > 0, query);
    assert.ok(current.length <= MAX_CURRENT_PAGE_SECTIONS, `${query}: ${current.length}`);
    assert.ok(results[0].onCurrentPage && isCurrent(results[0]), `${query}: ${results[0].url}`);
    assert.ok(!results.some((r) => r.url === CONNECT), `${query}: the page itself is listed`);
    for (const r of current) assert.ok(r.onCurrentPage, r.url);
  }
});

await test('current page: heading matches go first, then title matches of the top three', async () => {
  const urls = await topUrls('codex', 4, CONNECT);
  assert.deepEqual(urls.slice(0, 3), [
    `${CONNECT}#codex`,
    `${CONNECT}#codex-s-tokenom`,
    '/guides/ai-agents/plugin#codex',
  ]);
  const vsCode = await topUrls('vs code', 2, CONNECT);
  assert.deepEqual(vsCode, [
    `${CONNECT}#vs-code-i-github-copilot`,
    '/guides/ai-agents/plugin#vs-code-i-github-copilot',
  ]);
  // The page title has the query ("MCP, Подключение"): on the reader's page
  // its headings with the query still count as heading matches.
  const connection = await topUrls('подключение', 3, CONNECT);
  assert.ok(
    connection.every((url) => url.startsWith(`${CONNECT}#`)),
    connection.join(', ')
  );
  assert.ok(connection.includes(`${CONNECT}#sposoby-podklyucheniya`), connection.join(', '));
  // A heading match of another page by stem ("Переменные окружения") too.
  const variable = await topUrls('переменная', 2, CONNECT);
  assert.deepEqual(variable, [
    `${CONNECT}#peremennaya-okruzheniya`,
    '/guides/cli/scripting#peremennye-okruzheniya',
  ]);
});

await test('current page: a text mention stays below the token methods of the top three', async () => {
  const { results } = await search('токен', { currentPath: CONNECT });
  const titleMatches = results
    .filter((r) => !r.onCurrentPage)
    .slice(0, 3)
    .filter((r) => hasQueryInTitle(r, 'токен'));
  assert.ok(titleMatches.length > 0);
  const lastTitleMatch = Math.max(...titleMatches.map((r) => results.indexOf(r)));
  const strong = results.findIndex((r) => r.url === `${CONNECT}#token-bota`);
  assert.ok(strong >= 0 && strong < results.indexOf(titleMatches[0]), 'heading match first');
  for (const r of results.slice(0, lastTitleMatch)) {
    if (r.onCurrentPage) assert.ok(/токен/i.test(r.title), `${r.url} above the title matches`);
  }
});

await test('current page: a query of the brand alone keeps it ("Войдите в Пачку")', async () => {
  assert.equal((await topUrls('пачка', 1, CONNECT))[0], `${CONNECT}#voydite-v-pachku`);
});

await test('current page: text hits get a snippet around the match', async () => {
  const { results } = await search('перезапуск', { currentPath: CONNECT });
  const current = results.filter((r) => r.onCurrentPage);
  assert.ok(current.length > 0);
  for (const r of current)
    assert.ok(/перезапуск/i.test(r.description), `${r.url}: ${r.description}`);
});

await test('current page: "форма" on the blocks page does not lead with a "Формат…" section', async () => {
  for (const currentPath of [undefined, '/guides/forms/blocks']) {
    const { results } = await search('форма', { currentPath });
    const format = results.findIndex((r) => r.pageTitle && /^формат/i.test(r.title));
    assert.ok(format === -1 || format >= 5, `${currentPath}: ${results[format]?.url} at ${format}`);
    assert.ok(!results[0].pageTitle, `${currentPath}: ${results[0].url}`);
  }
});

await test('real index: "права агента" has no "Правила" section', async () => {
  const { results } = await search('права агента');
  const rules = results.filter((r) => r.pageTitle && /^правила/i.test(r.title));
  assert.deepEqual(
    rules.map((r) => r.url),
    []
  );
  assert.ok(results.some((r) => r.title === 'Наборы прав под типовые задачи'));
});

await test('current page: a word of its title does not lead with an arbitrary step', async () => {
  const trigger = '/guides/n8n/trigger';
  const { results } = await search('n8n триггер', { currentPath: trigger });
  assert.ok(!results[0].onCurrentPage, results[0].url);
  // The page's own sections: none a strong match. The step with "n8n" in its
  // heading and "Триггер" only in the title is a `partial` one.
  const { content } = matter(readFileSync(join(CONTENT, 'guides', 'n8n', 'trigger.mdx'), 'utf8'));
  const index = buildSectionIndex([
    { url: trigger, title: 'n8n, Триггер', sections: extractSections(content) },
  ]);
  const ranked = rank('n8n триггер', { [trigger]: 28 }, { index, currentPath: trigger });
  assert.deepEqual(
    ranked.filter((r) => isStrongMatch(r.match)).map((r) => r.entry.url),
    []
  );
  assert.equal(
    ranked.find((r) => r.entry.url === `${trigger}#vernites-v-n8n-i-aktiviruyte`)?.match,
    'partial'
  );
});

await test('real index: "vs-code" and "gemini-cli" are phrases', async () => {
  for (const currentPath of [undefined, CONNECT]) {
    const { results } = await search('vs-code', { currentPath });
    assert.equal(results[0].title, 'VS Code и GitHub Copilot', String(currentPath));
  }
  assert.equal((await topUrls('vs-code', 1, CONNECT))[0], `${CONNECT}#vs-code-i-github-copilot`);
  // On the connection page: "Claude Code" and the other "… Code" headings are
  // no match of their own, only mentions of VS Code in their text.
  const { content } = matter(readFileSync(join(CONTENT, 'guides', 'mcp', 'connect.mdx'), 'utf8'));
  const index = buildSectionIndex([
    { url: CONNECT, title: 'MCP, Подключение', sections: extractSections(content) },
  ]);
  const ranked = rank('vs-code', { [CONNECT]: 5 }, { index, currentPath: CONNECT });
  assert.deepEqual(
    ranked.filter((r) => r.match !== 'body').map((r) => [r.entry.url, r.match]),
    [[`${CONNECT}#vs-code-i-github-copilot`, 'heading']]
  );
  const gemini = rank('gemini-cli', { [CONNECT]: 6 }, { index });
  assert.deepEqual(
    gemini.map((r) => [r.entry.url, r.match]),
    [[`${CONNECT}#gemini-cli`, 'heading']]
  );
});

await test('real index: a hyphenated query scores pages as the phrase does ("gemini-cli" is "gemini cli")', async () => {
  for (const [query, slug] of [
    ['gemini-cli', 'gemini-cli'],
    ['qwen-code', 'qwen-code-i-gigacode-cli'],
    ['kilo-code', 'kilo-code'],
    ['claude-code', 'claude-code'],
  ]) {
    // As the dialog gets them: one section in front of its page.
    const urls = limitResults((await search(query)).results, 20).map((r) => r.url);
    assert.deepEqual(urls.slice(0, 2), [`${CONNECT}#${slug}`, CONNECT], query);
  }
  const pageScore = async (query: string) =>
    (await search(query)).results.find((r) => r.url === CONNECT)?.score;
  assert.equal(await pageScore('gemini-cli'), await pageScore('gemini cli'));
  // Hyphenated identifiers and words keep their place.
  assert.equal((await topUrls('ссылка-приглашение', 1))[0], '/api/company/get-invite-link');
  assert.equal((await topUrls('ссылки-приглашения', 1))[0], '/api/company/reissue-invite-link');
  assert.equal((await search('idempotency-key')).results[0].matchedValue?.value, 'Idempotency-Key');
});

await test('real index: a field with one word of a name ("code" of "vs code") lifts no method above the guides', async () => {
  for (const query of ['как подключить vs code', 'подключить vs code', 'mcp в vs code']) {
    const { results } = await search(query);
    assert.deepEqual(
      results.slice(0, 2).map((r) => r.url),
      [`${CONNECT}#vs-code-i-github-copilot`, CONNECT],
      query
    );
    assert.equal(pageOf(results[2].url), '/guides/ai-agents/plugin', `${query}: ${results[2].url}`);
    // Guides only down to the MCP or AI-agents overview: no method matched by its field `code`.
    const overview = results.findIndex((r) =>
      ['/guides/mcp/overview', '/guides/ai-agents/overview'].includes(r.url)
    );
    assert.ok(overview > 2, `${query}: overview at ${overview}`);
    for (const [i, r] of results.slice(0, overview).entries()) {
      assert.notEqual(r.type, 'api', `${query}: ${r.url} at ${i}`);
    }
  }
});

await test('real index: a field keeps its match with the query’s Latin word, or in a query without Russian', async () => {
  const [reaction] = (await search('поле code в реакции')).results;
  assert.equal(reaction.url, '/api/reactions/add');
  assert.equal(reaction.matchedValue?.value, 'code');
  // In Latin letters only: the field name is all of English a method has.
  const [list] = (await search('cursor pagination')).results;
  assert.equal(list.url, '/api/messages/list');
  assert.equal(list.matchedValue?.value, 'cursor');
  const [code] = (await search('code')).results;
  assert.equal(code.type, 'api');
  assert.match(code.matchedValue?.value ?? '', /code/);
  for (const [query, url] of [
    ['добавить реакцию', '/api/reactions/add'],
    ['redirect uri для бота', '/api/bots/update'],
  ]) {
    assert.equal((await topUrls(query, 1))[0], url, query);
  }
});

await test('current page without matching sections keeps its own result', async () => {
  const { results } = await search('новое сообщение', { currentPath: '/api/messages/create' });
  assert.ok(results.some((r) => r.url === '/api/messages/create'));
  // No current path, or a path of no page: the same results as without one.
  const plain = (await search('vs code')).results.map((r) => r.url);
  assert.deepEqual(
    (await search('vs code', { currentPath: '/nowhere' })).results.map((r) => r.url),
    plain
  );
});

if (failed) {
  console.error(`${failed} of ${passed + failed} search tests failed`);
  process.exit(1);
}
console.log(`✓ ${passed} search tests`);
