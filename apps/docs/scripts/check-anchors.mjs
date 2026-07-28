#!/usr/bin/env node
/**
 * Build gate: every in-repo `#anchor` link must point at a heading that exists.
 *
 * Anchors are generated from Cyrillic headings by `lib/utils/transliterate.ts`
 * (`toSlug`). Hand-written links kept drifting to a different transliteration
 * scheme — `й→j` instead of `y`, `х→kh` instead of `h`, `щ→shh` instead of
 * `sch` — which produces a link that silently does nothing when clicked. There
 * is no runtime error and no build warning, so 13 of them accumulated.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DOCS = resolve(import.meta.dirname, '..');
const CONTENT = join(DOCS, 'content');

// Mirror of lib/utils/transliterate.ts — kept in sync by the test below.
const TRANSLIT = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

function toSlug(text) {
  return text
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.mdx') || entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/** content path → the site route it is served at. */
function routeOf(file) {
  const rel = file.slice(CONTENT.length + 1).replace(/\.(mdx|md)$/, '');
  if (rel.startsWith('updates/')) return `/${rel}`;
  return `/${rel}`;
}

const files = walk(CONTENT);

// route → set of heading anchors on that page
const anchors = new Map();
for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  const set = new Set();
  for (const m of body.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    // Strip inline markdown/JSX so the slug matches what the renderer produces.
    const clean = m[1]
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_]/g, '')
      .trim();
    set.add(toSlug(clean));
  }
  anchors.set(routeOf(file), set);
}

const errors = [];
for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  for (const m of text.matchAll(/\]\((\/[^)\s#]*)?#([a-z0-9-]+)\)/g)) {
    const target = m[1] || routeOf(file);
    const anchor = m[2];
    // Only check pages we render from content/ — external and API routes vary.
    if (!anchors.has(target)) continue;
    const have = anchors.get(target);
    if (have.has(anchor)) continue;
    const line = text.slice(0, m.index).split('\n').length;
    const near = [...have].filter(
      (a) => a.length > 3 && (a.includes(anchor.slice(0, 6)) || anchor.includes(a.slice(0, 6)))
    );
    errors.push(
      `${file.slice(DOCS.length + 1)}:${line} → ${target}#${anchor} — нет такого заголовка` +
        (near.length
          ? `\n      ближайшие: ${near
              .slice(0, 3)
              .map((a) => '#' + a)
              .join(', ')}`
          : '')
    );
  }
}

// `[Текст](METHOD /path)` shorthand must name an endpoint that exists —
// otherwise the renderer emits a dead badge and the generated markdown a bare
// literal. One such link survived for a year pointing at a path the API never
// had.
const specPath = resolve(DOCS, '../../packages/spec/openapi.yaml');
if (existsSync(specPath)) {
  const spec = readFileSync(specPath, 'utf-8');
  const known = new Set();
  let currentPath = null;
  for (const line of spec.split('\n')) {
    const p = line.match(/^ {2}(\/\S*):\s*$/);
    if (p) currentPath = p[1];
    const m = line.match(/^ {4}(get|post|put|patch|delete):\s*$/);
    if (m && currentPath) known.add(`${m[1].toUpperCase()} ${currentPath}`);
  }
  for (const file of files) {
    const text = readFileSync(file, 'utf-8');
    for (const m of text.matchAll(/\]\((GET|POST|PUT|PATCH|DELETE)\s+(\/[^)\s]+)\)/g)) {
      if (m[2].startsWith('/guides/')) continue;
      if (known.has(`${m[1]} ${m[2]}`)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      errors.push(
        `${file.slice(DOCS.length + 1)}:${line} → ${m[1]} ${m[2]} — такого эндпоинта нет в спеке`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} битых ссылок:\n`);
  for (const e of errors) console.error(`  • ${e}\n`);
  console.error(
    'Якоря строятся из заголовков через toSlug (lib/utils/transliterate.ts).\n' +
      'Кликабельность не проверяется в рантайме — битая ссылка просто ничего не делает.\n'
  );
  process.exit(1);
}

console.log(`✓ все внутренние якоря разрешаются (${anchors.size} страниц)`);
