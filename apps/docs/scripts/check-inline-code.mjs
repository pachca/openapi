#!/usr/bin/env node
/**
 * Build gate: inline code in the guides stays short.
 *
 * Inline code does not wrap on a wide screen (`.prose code` in app/globals.css keeps an
 * identifier in one piece), so a long command written inline runs out of the text column
 * and over the table of contents. A command to copy belongs in a code block anyway.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const DOCS = resolve(import.meta.dirname, '..');
const CONTENT = join(DOCS, 'content');
const MAX = 80;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else if (file.endsWith('.mdx')) yield file;
  }
}

const errors = [];
for (const file of walk(CONTENT)) {
  const lines = readFileSync(file, 'utf-8').split('\n');
  let fence = null;
  lines.forEach((line, index) => {
    const opening = line.trim().match(/^(`{3,}|~{3,})/);
    if (opening) {
      if (!fence) fence = opening[1];
      else if (line.trim().startsWith(fence)) fence = null;
      return;
    }
    if (fence) return;
    for (const [, code] of line.matchAll(/(?<!`)`([^`\n]+)`(?!`)/g)) {
      if (code.length > MAX) {
        errors.push(
          `${relative(DOCS, file)}:${index + 1}: строчный код в ${code.length} знаков ` +
            `(больше ${MAX}) не переносится и вылезает из колонки, вынесите его в блок кода: ` +
            `${code.slice(0, 60)}…`
        );
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`✗ длинный строчный код, мест: ${errors.length}\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ строчный код в гайдах не длиннее ${MAX} знаков`);
