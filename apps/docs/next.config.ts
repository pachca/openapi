import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // Keep flexsearch as external to avoid Turbopack worker_threads bundling issues
  serverExternalPackages: ['flexsearch'],
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
