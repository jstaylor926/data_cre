import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
// @ts-expect-error - package does not currently expose compatible typings for this import form
import tsconfigPaths from 'vitest-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  },
});
