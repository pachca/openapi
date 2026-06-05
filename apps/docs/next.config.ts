import type { NextConfig } from 'next';
import redirectsList from './redirects';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Keep flexsearch as external to avoid Turbopack worker_threads bundling issues
  serverExternalPackages: ['flexsearch'],
  turbopack: {
    root: '../../',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // /llms.txt is the agent entry point — it MUST be indexable so chat
        // agents with hardened web tools (e.g. browser ChatGPT, whose
        // `web_fetch` only accepts URLs returned by `web_search`/`web_fetch`
        // or pasted by the user) can find it via `site:dev.pachca.com llms.txt`.
        // It has unique content (CLI quick start, essentials, full index of
        // methods) and does not duplicate any single HTML page.
        source: '/:path(llms\\.txt)',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // llms-full.txt + llms-en.txt are full mirrors of HTML content —
        // keep noindex to avoid duplicate-content ranking.
        source: '/:path(llms-full\\.txt|llms-en\\.txt)',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        // Any `.md` at any depth (root `skill.md`/`index.md` and nested page
        // twins like `/api/authorization.md`). The previous `:rest*\.md`
        // pattern only matched root-level files, so nested twins shipped
        // without CORS / x-content-source.
        source: '/(.*)\\.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // Mark the markdown representation so agents can distinguish it from
          // an HTML-to-markdown conversion (mirrors Neon's x-content-source).
          { key: 'X-Content-Source', value: 'markdown' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
          // .md twins duplicate the HTML pages — keep them out of the index.
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/.well-known/:path(skills|agent-skills)/:rest*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        // A2A Agent Card (Agent2Agent discovery).
        source: '/.well-known/agent-card.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/:path(openapi\\.yaml|workflows\\.arazzo\\.yaml)',
        headers: [
          { key: 'Content-Type', value: 'application/yaml' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path(pachca\\.postman_collection\\.json|scenarios\\.json)',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  async redirects() {
    return redirectsList.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent ?? true,
    }));
  },
  async rewrites() {
    return [
      {
        source: '/.md',
        destination: '/index.md',
      },
    ];
  },
};

export default nextConfig;
