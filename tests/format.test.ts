import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, initials } from '../src/format'

describe('format', () => {
  it('renders clock times the way a video card expects', () => {
    expect(formatDuration(15)).toBe('0:15')
    expect(formatDuration(75)).toBe('1:15')
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('formats catalog dates in UTC', () => {
    expect(formatDate('2026-10-30T18:00:00.000Z')).toBe('30 Oct 2026')
  })

  it('builds a short channel mark and skips small words', () => {
    expect(initials('Skáld of the Pines')).toBe('SP')
  })
})
