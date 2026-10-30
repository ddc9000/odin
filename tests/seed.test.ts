import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseVtt } from '../src/player/vtt'
import type { CatalogFile } from '../src/data/types'
import { MAX_FILE_BYTES } from '../src/pipeline/limits'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(readFileSync(path.join(root, 'src/data/catalog.json'), 'utf8')) as CatalogFile

function walk(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) found.push(...walk(full))
    else found.push(full)
  }
  return found
}

describe('seed videos', () => {
  it('publishes the nine generated films, each at most 15 seconds', () => {
    expect(catalog.version).toBe(1)
    expect(catalog.channels).toEqual([
      { id: 'odin-forest', name: 'ODIN · Forest', handle: '@odin' },
    ])
    expect(catalog.videos.map((video) => video.id)).toEqual([
      'dawn-mist',
      'forest-rain',
      'moonlit-runestone',
      'autumn-birches',
      'winter-twilight',
      'moss-falls',
      'the-windy-tree',
      'lake-at-dawn',
      'brand-from-a-brand',
    ])
    for (const video of catalog.videos) {
      expect(video.placeholder).toBe(false)
      expect(video.aiGenerated).toBe(true)
      expect(video.channelId).toBe('odin-forest')
      expect(video.durationSec).toBeGreaterThan(10)
      expect(video.durationSec).toBeLessThanOrEqual(15.05)
      expect(Math.round(video.durationSec)).toBeLessThanOrEqual(15)
      expect(video.subtitleCitation).toMatch(/Bellows/)
      expect(video.subtitleCitation).toMatch(/1923/)
      expect(video.description.length).toBeGreaterThan(0)
      expect(video.media.hls.startsWith('videos/')).toBe(true)
      expect(video.media.hls.includes('://')).toBe(false)
    }
  })

  it('keeps one Hávamál cue for the whole video, for the subtitle track', () => {
    const expected = [
      'Cattle die',
      'A better burden',
      'None made me happy',
      'On the hillside drear',
      'Young was I once',
      'A measure of wisdom',
      'I ween that I hung',
      'the fame of a dead man',
      'A brand from a brand',
    ]
    catalog.videos.forEach((video, index) => {
      const vttPath = path.join(root, 'public/media', video.media.subtitles)
      const cues = parseVtt(readFileSync(vttPath, 'utf8'))
      expect(cues).toHaveLength(1)
      expect(cues[0].start).toBe(0)
      expect(cues[0].end).toBeGreaterThanOrEqual(video.durationSec)
      expect(cues[0].text).toContain(expected[index])
      expect(video.subtitleText).toContain(expected[index])
      const master = readFileSync(path.join(root, 'public/media', video.media.hls), 'utf8')
      expect(master).toContain('360p/index.m3u8')
      expect(master).toContain('720p/index.m3u8')
      expect(master).toContain('1080p/index.m3u8')
      expect(master).toContain('TYPE=SUBTITLES')
      for (const name of ['360p', '720p', '1080p']) {
        const playlist = readFileSync(path.join(root, 'public/media/videos', video.id, name, 'index.m3u8'), 'utf8')
        expect(playlist).toContain('#EXT-X-ENDLIST')
        expect(playlist).toContain('.ts')
      }
    })
  })

  it('keeps every media file under 100 MB and the batch small', () => {
    const media = path.join(root, 'public/media')
    const files = walk(media)
    expect(files.length).toBeGreaterThan(10)
    let total = 0
    for (const file of files) {
      const bytes = statSync(file).size
      total += bytes
      expect(bytes).toBeLessThan(MAX_FILE_BYTES)
    }
    expect(total).toBeLessThan(512 * 1024 * 1024)
  })
})
