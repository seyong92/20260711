import { buildAppPath } from './routes'

const RELOAD_SESSION_KEY = 'wedding-game-reloaded-version'

type VersionPayload = {
  version?: string
}

function withVersionParam(version: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('v', version)
  return url.toString()
}

async function fetchCurrentVersion() {
  const url = new URL(buildAppPath('/version.json'), window.location.origin)
  url.searchParams.set('t', String(Date.now()))

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })

  if (!response.ok) return null
  const payload = (await response.json()) as VersionPayload
  return typeof payload.version === 'string' && payload.version.length > 0
    ? payload.version
    : null
}

async function reloadIfOutdated() {
  const currentVersion = __APP_VERSION__
  const latestVersion = await fetchCurrentVersion()

  if (!latestVersion || latestVersion === currentVersion) return
  if (window.sessionStorage.getItem(RELOAD_SESSION_KEY) === latestVersion) return

  window.sessionStorage.setItem(RELOAD_SESSION_KEY, latestVersion)
  window.location.replace(withVersionParam(latestVersion))
}

export function installVersionRefresh() {
  if (!import.meta.env.PROD) return

  const check = () => {
    void reloadIfOutdated().catch(() => {
      // Version checks are opportunistic; a failed fetch should not block the app.
    })
  }

  window.addEventListener('pageshow', check)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })

  window.setInterval(check, 5 * 60 * 1000)
  check()
}
