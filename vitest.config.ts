import { defineConfig } from 'vitest/config'

// Unit tests run in plain Node — the only suite today is indicators.test.ts
// (pure maths, no DOM, no Electron). Kept separate from the electron-vite
// build configs so it has no bearing on the app bundle.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
