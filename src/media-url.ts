/** Join the one media base with a catalog-relative path. */
export function resolveMediaUrl(relativePath: string, base: string): string {
  const clean = relativePath.replace(/^\/+/, '')
  if (!clean || clean.split('/').includes('..')) {
    throw new Error(`Unsafe media path: ${relativePath}`)
  }
  const root = base.replace(/\/+$/, '')
  return `${root}/${clean}`
}

/**
 * Empty `setting` means "the media directory published next to the site".
 * A non-empty setting is used as-is (R2, another bucket, a CDN).
 */
export function resolveMediaBase(setting: string, siteBase: string): string {
  const trimmed = setting.trim()
  if (trimmed) return trimmed.replace(/\/+$/, '')
  const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`
  return `${base}media`
}
