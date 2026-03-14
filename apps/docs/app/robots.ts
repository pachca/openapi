import type { MetadataRoute } from 'next';

const BASE_URL = 'https://dev.pachca.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
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
