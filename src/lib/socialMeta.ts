import type { SiteMetaContent } from '../types/site'
import { buildAppPath } from './routes'

interface ApplySiteMetaOptions {
  title?: string
  description?: string
  path?: string
}

function toAbsoluteUrl(value: string) {
  return new URL(value, window.location.origin).href
}

function upsertMeta(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attributeName}="${attributeValue}"]`,
  )

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }

  tag.href = href
  return tag
}

export function applySiteMeta(meta: SiteMetaContent, options: ApplySiteMetaOptions = {}) {
  const title = options.title ?? meta.title
  const description = options.description ?? meta.description
  const canonicalPath = buildAppPath(options.path ?? '/')
  const canonicalUrl = toAbsoluteUrl(canonicalPath)
  const imageUrl = toAbsoluteUrl(meta.image.src)

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'theme-color', '#f8f5ef')

  upsertMeta('property', 'og:locale', 'ko_KR')
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', meta.title)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonicalUrl)
  upsertMeta('property', 'og:image', imageUrl)
  upsertMeta('property', 'og:image:secure_url', imageUrl)
  upsertMeta('property', 'og:image:type', meta.image.type)
  upsertMeta('property', 'og:image:width', String(meta.image.width))
  upsertMeta('property', 'og:image:height', String(meta.image.height))
  upsertMeta('property', 'og:image:alt', meta.image.alt)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', imageUrl)
  upsertMeta('name', 'twitter:image:alt', meta.image.alt)

  upsertLink('canonical', canonicalUrl)

  const faviconTag = upsertLink('icon', meta.faviconSrc)
  faviconTag.type = meta.faviconType ?? ''
}
