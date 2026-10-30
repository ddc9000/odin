import { describe, expect, it } from 'vitest'
import { MEDIA_BASE_URL } from '../src/config'
import { resolveMediaBase, resolveMediaUrl } from '../src/media-url'

describe('media base', () => {
  it('keeps the single switch empty so the site serves its own media folder', () => {
    expect(MEDIA_BASE_URL).toBe('')
  })

  it('uses the site media directory when the setting is empty', () => {
    expect(resolveMediaBase('', '/odin/')).toBe('/odin/media')
    expect(resolveMediaBase('   ', '/odin')).toBe('/odin/media')
  })

  it('uses an absolute origin unchanged, without a trailing slash', () => {
    expect(resolveMediaBase('https://pub-xxxx.r2.dev/', '/odin/')).toBe('https://pub-xxxx.r2.dev')
  })

  it('joins catalog paths onto the base', () => {
    expect(resolveMediaUrl('videos/at-the-gate/master.m3u8', '/odin/media')).toBe(
      '/odin/media/videos/at-the-gate/master.m3u8',
    )
    expect(resolveMediaUrl('/videos/at-the-gate/thumb.jpg', 'https://cdn.example')).toBe(
      'https://cdn.example/videos/at-the-gate/thumb.jpg',
    )
  })

  it('rejects paths that leave the media directory', () => {
    expect(() => resolveMediaUrl('../secret.m3u8', '/odin/media')).toThrow(/Unsafe media path/)
  })
})
