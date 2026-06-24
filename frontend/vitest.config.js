import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.jsx', 'src/**/*.test.js', 'src/**/*.spec.jsx', 'src/**/*.spec.js'],
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{jsx,js}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.*',
        'src/**/*.spec.*',
      ],
    },
  },
})
