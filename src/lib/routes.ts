function normalizePath(path: string) {
  if (!path || path === '/') {
    return '/'
  }

  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function normalizeBaseUrl(baseUrl: string) {
  if (!baseUrl || baseUrl === '/') {
    return '/'
  }

  return `/${baseUrl.replace(/^\/+|\/+$/g, '')}/`
}

export function buildAppPath(path: string) {
  const target = normalizePath(path)
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)

  if (baseUrl === '/') {
    return target
  }

  if (target === '/') {
    return baseUrl
  }

  return `${baseUrl}${target.slice(1)}`
}

export function stripBasePath(pathname: string) {
  const normalizedPathname = pathname || '/'
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)

  if (baseUrl === '/') {
    return normalizePath(normalizedPathname)
  }

  if (normalizedPathname === baseUrl.slice(0, -1)) {
    return '/'
  }

  if (normalizedPathname.startsWith(baseUrl)) {
    const trimmed = normalizedPathname.slice(baseUrl.length - 1)
    return normalizePath(trimmed)
  }

  return normalizePath(normalizedPathname)
}

export function isRouteMatch(pathname: string, targetPath: string) {
  return stripBasePath(pathname) === normalizePath(targetPath)
}
