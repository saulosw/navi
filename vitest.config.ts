import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  test: {
    include: ['apps/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Electron main/preload and the migration runner are deliberately absent:
      // they are process entry points that need smoke/integration coverage instead.
      include: [
        'apps/api/src/application/**/*.ts',
        'apps/api/src/domain/**/*.ts',
        'apps/api/src/adapters/**/*.ts',
        'apps/api/src/infrastructure/config/**/*.ts',
        'apps/api/src/infrastructure/database/postgres-health-probe.ts',
        'apps/api/src/main/build-app.ts',
        'apps/desktop/src/renderer/components/**/*.tsx',
        'apps/desktop/src/renderer/features/**/*.{ts,tsx}',
        'apps/desktop/src/main/auth/**/*.ts',
        'apps/api/src/adapters/cli/**/*.ts',
        'apps/api/src/infrastructure/security/crypto.ts',
        'apps/api/src/infrastructure/database/accounts.ts',
        'packages/contracts/src/validation.ts',
      ],
      // Interface-only modules erase to nothing at runtime, so they would report
      // 0% of 0 statements forever and only add noise to the table.
      exclude: [
        '**/*.css.ts',
        'apps/api/src/application/ports/**',
        'apps/api/src/domain/users/{user,credentials}.ts',
      ],
      // skipFull belongs to the text reporter, not the provider: without it the
      // per-file table is hidden whenever everything is fully covered.
      reporter: [
        ['text', { skipFull: false }],
        ['lcov', {}],
      ],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
