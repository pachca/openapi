import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // сборка и tsc на настоящих приложениях
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
