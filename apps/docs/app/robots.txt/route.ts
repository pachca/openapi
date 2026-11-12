// Hand-rolled robots.txt route handler (replaces the former metadata
// `app/robots.ts`). Next's `MetadataRoute.Robots` object cannot emit the
// non-standard `Content-Signal:` directive, so we serialize robots.txt
// ourselves. The allow/disallow semantics are unchanged from before.

const BASE_URL = 'https://dev.pachca.com';

type Rule = { userAgent: string; allow?: string[]; disallow?: string[] };

// RFC 9309 §2.2.1: a crawler obeys only the most specific group that names
// it, so a named bot never reads the `*` group. Every allowing group carries
// the same Disallow and Content-Signal lines.
const ALLOW_DOCS = { allow: ['/'], disallow: ['/internal/search'] };

const rules: Rule[] = [
  { userAgent: 'GPTBot', ...ALLOW_DOCS },
  { userAgent: 'OAI-SearchBot', ...ALLOW_DOCS },
  { userAgent: 'ClaudeBot', ...ALLOW_DOCS },
  { userAgent: 'Claude-SearchBot', ...ALLOW_DOCS },
  { userAgent: 'PerplexityBot', ...ALLOW_DOCS },
  { userAgent: 'Amazonbot', ...ALLOW_DOCS },
  // Bulk training scraper, not citation-relevant — kept blocked.
  { userAgent: 'CCBot', disallow: ['/'] },
  // Allowed: enables Gemini / Google AI grounding & citation of these
  // docs; does NOT affect Google Search ranking.
  { userAgent: 'Google-Extended', ...ALLOW_DOCS },
  // `/internal/og` must stay crawlable: it is the og:image / twitter:image for
  // every page, and Twitterbot, Slackbot, LinkedInBot and facebookexternalhit
  // all honour robots.txt — disallowing it stripped the preview from every
  // shared dev.pachca.com link. Only the search endpoint is worth hiding.
  { userAgent: '*', ...ALLOW_DOCS },
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
    // Every group that lets the bot in states the same intent.
    if (rule.allow?.length) lines.push(`Content-Signal: ${CONTENT_SIGNAL}`);
    return lines.join('\n');
  });
  // No `Host:` line: Yandex dropped the directive in 2018 and RFC 9309 has none.
  blocks.push(`Sitemap: ${BASE_URL}/sitemap.xml`);
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
