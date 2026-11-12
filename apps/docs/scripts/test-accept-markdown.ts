// Accept strings → which representation proxy.ts serves. Run: bun scripts/test-accept-markdown.ts
import assert from 'node:assert/strict';
import { prefersMarkdown } from '../lib/accept-markdown';

const CHROME =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';

const cases: Array<[accept: string | null, markdown: boolean]> = [
  // Markdown named explicitly wins a tie with text/html or */*.
  ['text/markdown, */*', true],
  ['text/markdown, text/html, */*', true],
  ['text/html, text/markdown', true],
  ['text/html;q=0, text/markdown, */*', true],
  ['text/markdown, text/html;q=0.5', true],
  ['text/markdown, text/plain;q=0.9, */*;q=0.8', true],
  ['TEXT/MARKDOWN; charset=utf-8', true],
  ['text/*;q=0.5, text/markdown', true],
  // HTML preferred, or markdown only through a wildcard.
  ['text/html, text/markdown;q=0.5', false],
  ['text/markdown;q=0.9, text/*', false],
  ['text/markdown;q=0', false],
  ['text/markdown;q=0, */*', false],
  ['*/*', false],
  ['text/*', false],
  ['application/json', false],
  [CHROME, false],
  ['', false],
  ['   ', false],
  [null, false],
];

let failed = 0;
for (const [accept, expected] of cases) {
  try {
    assert.equal(prefersMarkdown(accept), expected);
  } catch {
    failed++;
    console.error(`✗ ${JSON.stringify(accept)}: expected ${expected ? 'markdown' : 'HTML'}`);
  }
}

if (failed) {
  console.error(`${failed} of ${cases.length} Accept cases failed`);
  process.exit(1);
}
console.log(`✓ ${cases.length} Accept cases`);
