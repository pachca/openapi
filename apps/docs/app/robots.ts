import type { MetadataRoute } from 'next';

const BASE_URL = 'https://dev.pachca.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      // Bulk training scraper, not citation-relevant — kept blocked.
      { userAgent: 'CCBot', disallow: '/' },
      // Allowed: enables Gemini / Google AI grounding & citation of these
      // docs; does NOT affect Google Search ranking.
      { userAgent: 'Google-Extended', allow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/search', '/api/og'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
