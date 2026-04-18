import path from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(basePath: string) {
  if (basePath === '/') {
    return '/'
  }

  return `/${basePath.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig(({ command }) => {
  const inferredBasePath = normalizeBasePath(path.basename(process.cwd()))
  const base =
    command === 'serve'
      ? '/'
      : normalizeBasePath(process.env.PAGES_BASE_PATH ?? inferredBasePath)

  return {
    base,
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
  }
})
