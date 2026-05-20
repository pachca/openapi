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
        source: '/:path(llms\\.txt|llms-full\\.txt|llms-en\\.txt)',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=3600' },
          // Agent artifact, not a search landing page — avoid duplicate-content
          // ranking against the real HTML docs.
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/:path(skill\\.md|:rest*\\.md)',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=3600' },
          // .md twins duplicate the HTML pages — keep them out of the index.
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/.well-known/:path(skills|agent-skills)/:rest*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=3600' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/:path(openapi\\.yaml|workflows\\.arazzo\\.yaml)',
        headers: [
          { key: 'Content-Type', value: 'application/yaml' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=3600' },
        ],
      },
      {
        source: '/:path(pachca\\.postman_collection\\.json|scenarios\\.json)',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=3600' },
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
