import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // n8n-workflow ships source maps that point to sources missing from the
    // package, and Vite warns about each file it loads one by one. Its ESM build
    // imports without file extensions, so it cannot stay external: bundle it once.
    deps: { optimizer: { ssr: { enabled: true, include: ['n8n-workflow'] } } },
  },
});
