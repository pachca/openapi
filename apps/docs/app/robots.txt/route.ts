// Hand-rolled robots.txt route handler (replaces the former metadata
// `app/robots.ts`). Next's `MetadataRoute.Robots` object cannot emit the
// non-standard `Content-Signal:` directive, so we serialize robots.txt
// ourselves. The allow/disallow semantics are unchanged from before.

const BASE_URL = 'https://dev.pachca.com';

type Rule = { userAgent: string; allow?: string[]; disallow?: string[] };

const rules: Rule[] = [
  { userAgent: 'GPTBot', allow: ['/'] },
  { userAgent: 'OAI-SearchBot', allow: ['/'] },
  { userAgent: 'ClaudeBot', allow: ['/'] },
  { userAgent: 'Claude-SearchBot', allow: ['/'] },
  { userAgent: 'PerplexityBot', allow: ['/'] },
  { userAgent: 'Amazonbot', allow: ['/'] },
  // Bulk training scraper, not citation-relevant — kept blocked.
  { userAgent: 'CCBot', disallow: ['/'] },
  // Allowed: enables Gemini / Google AI grounding & citation of these
  // docs; does NOT affect Google Search ranking.
  { userAgent: 'Google-Extended', allow: ['/'] },
  { userAgent: '*', allow: ['/'], disallow: ['/api/search', '/api/og'] },
];

// Cloudflare Content Signals Policy (2026): a machine-readable statement of
// intent. These docs WANT to be crawled, searched, AI-grounded and trained
// on — the inverse of a publisher. Stated preference, not enforced.
const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes';

function serialize(): string {
  const blocks = rules.map((rule) => {
    const lines = [`User-Agent: ${rule.userAgent}`];
    for (const path of rule.allow ?? []) lines.push(`Allow: ${path}`);
    for (const path of rule.disallow ?? []) lines.push(`Disallow: ${path}`);
    // Attach the content signal to the catch-all group so it applies broadly.
    if (rule.userAgent === '*') lines.push(`Content-Signal: ${CONTENT_SIGNAL}`);
    return lines.join('\n');
  });
  blocks.push(`Host: ${BASE_URL}\nSitemap: ${BASE_URL}/sitemap.xml`);
  return blocks.join('\n\n') + '\n';
}

export function GET() {
  return new Response(serialize(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
