/** Public id from a title like "Dawn Mist — Hávamál 77". */
export function videoIdFromTitle(title: string): string {
  const name = title.split(/\s+[—–-]\s+/)[0] ?? title
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Cannot make an id from "${title}"`)
  }
  return slug
}
