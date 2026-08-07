import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    // The native credential store is real even under vitest, and `createRequire`
    // slips past module mocking. Off by default so no test can write to the
    // developer's actual Keychain; the store's own tests install a stub.
    env: { PACHCA_SECRET_STORE: 'file' },
  },
});
