import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.spec.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/db/schema.js',
        'src/db/seed.js',
        'src/index.js',
      ],
      thresholds: {
        lines: 28,
        functions: 15,
        branches: 15,
        statements: 28,
      },
    },
  },
})
