import type { NextConfig } from 'next';

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
    ];
  },
  async rewrites() {
    return [
      // Rewrite /.md to /api/md/index for home page
      {
        source: '/.md',
        destination: '/api/md/index',
      },
      // Rewrite /path.md to /api/md/path for all pages
      {
        source: '/:path*.md',
        destination: '/api/md/:path*',
      },
    ];
  },
};

export default nextConfig;
