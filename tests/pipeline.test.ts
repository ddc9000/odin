import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { emptyCatalog, upsertEntry } from '../src/pipeline/catalog'
import { MAX_DURATION_SEC, MAX_FILE_BYTES, assertSourceDuration, oversizedFiles } from '../src/pipeline/limits'
import { renderMasterPlaylist, renderSubtitlePlaylist } from '../src/pipeline/playlists'

describe('pipeline helpers', () => {
  it('allows 180 seconds and refuses longer sources', () => {
    expect(MAX_DURATION_SEC).toBe(180)
    expect(() => assertSourceDuration(180)).not.toThrow()
    expect(() => assertSourceDuration(15)).not.toThrow()
    expect(() => assertSourceDuration(0.4)).toThrow(/at least 1/)
    expect(() => assertSourceDuration(181)).toThrow(/180/)
  })

  it('flags files at the 100 MB ceiling', () => {
    expect(MAX_FILE_BYTES).toBe(100 * 1024 * 1024)
    expect(oversizedFiles([{ path: 'a.ts', bytes: MAX_FILE_BYTES }])).toHaveLength(1)
    expect(oversizedFiles([{ path: 'a.ts', bytes: MAX_FILE_BYTES - 1 }])).toHaveLength(0)
  })

  it('writes a master playlist with three renditions and a subtitle group', () => {
    const master = renderMasterPlaylist([
      { name: '360p', width: 640, height: 360, bandwidth: 400000, codecs: 'avc1.4d4028,mp4a.40.2', playlist: '360p/index.m3u8' },
      { name: '720p', width: 1280, height: 720, bandwidth: 900000, playlist: '720p/index.m3u8' },
      { name: '1080p', width: 1920, height: 1080, bandwidth: 1600000, playlist: '1080p/index.m3u8' },
    ])
    expect(master).toContain('360p/index.m3u8')
    expect(master).toContain('720p/index.m3u8')
    expect(master).toContain('1080p/index.m3u8')
    expect(master).toContain('TYPE=SUBTITLES')
    expect(master).toContain('DEFAULT=NO')
    expect(master).toContain('subtitles.m3u8')
    const subtitles = renderSubtitlePlaylist(15)
    expect(subtitles).toContain('#EXT-X-PLAYLIST-TYPE:VOD')
    expect(subtitles).toContain('subtitles.vtt')
    expect(subtitles).toContain('#EXTINF:15.000,')
  })

  it('upserts a video without dropping the rest of the catalog', () => {
    const channel = { id: 'skald-of-the-pines', name: 'Skáld of the Pines', handle: '@skald' }
    const video = {
      id: 'at-the-gate',
      title: 'At the Gate',
      description: 'Placeholder',
      channelId: channel.id,
      durationSec: 15,
      publishedAt: '2026-10-28T18:00:00.000Z',
      placeholder: true,
      aiGenerated: false,
      stanza: 1,
      subtitleCitation: 'Bellows 1923',
      subtitleText: 'Within the gates',
      media: {
        hls: 'videos/at-the-gate/master.m3u8',
        thumbnail: 'videos/at-the-gate/thumb.jpg',
        subtitles: 'videos/at-the-gate/subtitles.vtt',
      },
    }
    const created = upsertEntry(emptyCatalog(), { channel, video })
    const replaced = upsertEntry(created, { channel, video: { ...video, title: 'At the Gate (new)' } })
    expect(replaced.videos).toHaveLength(1)
    expect(replaced.videos[0].title).toBe('At the Gate (new)')
    expect(() => upsertEntry(created, { channel, video: { ...video, durationSec: 240 } })).toThrow(/180/)
    expect(() =>
      upsertEntry(created, { channel, video: { ...video, media: { ...video.media, hls: 'https://x/a.m3u8' } } }),
    ).toThrow(/relative/)
  })

  it('the encode script parses', () => {
    execFileSync('bash', ['-n', 'scripts/encode-video.sh'], { stdio: 'pipe' })
    execFileSync('bash', ['-n', 'scripts/generate-placeholders.sh'], { stdio: 'pipe' })
  })
})
