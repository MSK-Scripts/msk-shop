import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    // Mirror the tsconfig "@/*" path alias so tests can import like the app does.
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Cobertura XML is what GitHub's code-coverage analysis consumes.
      reporter: ['text', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts'],
    },
  },
})
