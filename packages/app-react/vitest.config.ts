import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.tsx'],
    environment: 'happy-dom',
    environmentOptions: { happyDOM: { url: 'https://app.example/' } },
  },
});
