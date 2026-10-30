const SKIPPED = new Set(['of', 'the', 'and', 'a', 'an'])

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const padded = String(secs).padStart(2, '0')
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${padded}`
  return `${minutes}:${padded}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function initials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !SKIPPED.has(part.toLowerCase()) && /\p{L}/u.test(part))
  const letters = parts.slice(0, 2).map((part) => Array.from(part)[0] ?? '')
  const value = letters.join('').toLocaleUpperCase('en')
  return value || '•'
}
