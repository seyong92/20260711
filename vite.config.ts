import path from 'node:path'
import { execSync } from 'node:child_process'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(basePath: string) {
  if (basePath === '/') {
    return '/'
  }

  return `/${basePath.replace(/^\/+|\/+$/g, '')}/`
}

function getClientVersion() {
  if (process.env.VITE_GAME_CLIENT_VERSION) {
    return process.env.VITE_GAME_CLIENT_VERSION
  }

  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA
  }

  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return String(Date.now())
  }
}

export default defineConfig(({ command }) => {
  const inferredBasePath = normalizeBasePath(path.basename(process.cwd()))
  const base =
    command === 'serve'
      ? '/'
      : normalizeBasePath(process.env.PAGES_BASE_PATH ?? inferredBasePath)
  const clientVersion = getClientVersion()

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(clientVersion),
    },
    plugins: [
      react(),
      {
        name: 'emit-client-version',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: `${JSON.stringify({ version: clientVersion }, null, 2)}\n`,
          })
        },
      },
    ],
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
