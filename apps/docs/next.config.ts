import type { NextConfig } from 'next';
import redirectsList from './redirects';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Keep flexsearch as external to avoid Turbopack worker_threads bundling issues
  serverExternalPackages: ['flexsearch'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/:path(llms\\.txt|llms-full\\.txt)',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=86400' },
        ],
      },
      {
        source: '/:path(skill\\.md|:rest*\\.md)',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=86400' },
        ],
      },
      {
        source: '/.well-known/skills/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=86400' },
        ],
      },
      {
        source: '/openapi.yaml',
        headers: [
          { key: 'Content-Type', value: 'application/yaml' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=86400' },
        ],
      },
      {
        source: '/pachca.postman_collection.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, s-maxage=86400' },
        ],
      },
    ];
  },
  async redirects() {
    return redirectsList.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: true,
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
