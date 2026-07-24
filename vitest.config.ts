import { defineConfig, type Plugin } from 'vitest/config'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const importMetaPolyfill: Plugin = {
  name: 'nuxt-import-meta-polyfill',
  transform(code, id) {
    if (id.includes('node_modules')) return
    return code
      .replace(/import\.meta\.client/g, 'true')
      .replace(/import\.meta\.dev/g, 'false')
  },
}

export default defineConfig({
  plugins: [importMetaPolyfill],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '#imports': resolve(__dirname, 'tests/__mocks__/imports.ts'),
    },
  },
})
