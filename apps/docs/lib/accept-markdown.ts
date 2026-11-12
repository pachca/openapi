// Content negotiation between a page and its markdown twin by the Accept
// header (RFC 9110 §12.5.1). No imports: proxy.ts reads this file.
//
// Each offered type takes the q-value of the most specific range that
// matches it: `text/markdown` beats `text/*`, which beats `*/*`. Taking the
// maximum over all ranges instead sent `text/markdown, */*` to HTML, because
// `*/*` counted for HTML with the same q=1.

type MediaRange = { type: string; subtype: string; q: number };

const EXACT = 3;

function parseAccept(accept: string): MediaRange[] {
  const ranges: MediaRange[] = [];
  for (const entry of accept.split(',')) {
    const [range, ...params] = entry.split(';').map((s) => s.trim());
    if (!range) continue;
    const [type, subtype] = range.toLowerCase().split('/');
    if (!type || !subtype) continue;
    let q = 1;
    for (const param of params) {
      const [key, value] = param.split('=').map((s) => s.trim());
      if (key?.toLowerCase() !== 'q' || value === undefined) continue;
      const parsed = Number(value);
      q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
    }
    ranges.push({ type, subtype, q });
  }
  return ranges;
}

function specificity(range: MediaRange, offered: string): number {
  const [type, subtype] = offered.split('/');
  if (range.type === type && range.subtype === subtype) return EXACT;
  if (range.type === type && range.subtype === '*') return 2;
  if (range.type === '*' && range.subtype === '*') return 1;
  return 0;
}

function qualityFor(ranges: MediaRange[], offered: string): { q: number; specificity: number } {
  let best = { q: 0, specificity: 0 };
  for (const range of ranges) {
    const s = specificity(range, offered);
    if (s > best.specificity) best = { q: range.q, specificity: s };
  }
  return best;
}

// True when the client prefers `text/markdown` to `text/html`. An empty
// header means HTML, as for a browser. On equal q markdown wins only when the
// client names `text/markdown` itself: browsers never list it, so a client
// that does wants it. A tie through `text/*` or `*/*` stays HTML.
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept || !accept.trim()) return false;
  const ranges = parseAccept(accept);
  const html = qualityFor(ranges, 'text/html');
  const markdown = qualityFor(ranges, 'text/markdown');
  if (markdown.q === 0) return false;
  if (markdown.q > html.q) return true;
  return markdown.q === html.q && markdown.specificity === EXACT;
}
