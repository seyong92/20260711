import { siteContent } from '../data/siteContent'

function normalizeRoutePath(path: string) {
  const stripped = path.trim()
  if (!stripped || stripped === '/') {
    return '/'
  }

  return `/${stripped.replace(/^\/+|\/+$/g, '')}`
}

export const appConfig = {
  homePath: '/',
  gamePath: normalizeRoutePath(siteContent.footer.gamePath),
}

export { normalizeRoutePath }
