import { describe, expect, it } from 'vitest'
import { createCatalog } from '../src/data/repository'
import type { CatalogFile } from '../src/data/types'

const file: CatalogFile = {
  version: 1,
  channels: [{ id: 'skald-of-the-pines', name: 'Skáld of the Pines', handle: '@skald' }],
  videos: [
    {
      id: 'at-the-gate',
      title: 'At the Gate',
      description: 'A moss gradient.',
      channelId: 'skald-of-the-pines',
      durationSec: 15,
      publishedAt: '2026-10-28T18:00:00.000Z',
      placeholder: true,
      stanza: 1,
      subtitleCitation: 'Bellows 1923',
      subtitleText: 'Within the gates',
      media: {
        hls: 'videos/at-the-gate/master.m3u8',
        thumbnail: 'videos/at-the-gate/thumb.jpg',
        subtitles: 'videos/at-the-gate/subtitles.vtt',
      },
    },
    {
      id: 'the-road-alone',
      title: 'The Road Alone',
      description: 'Dusk colours.',
      channelId: 'skald-of-the-pines',
      durationSec: 15,
      publishedAt: '2026-10-29T18:00:00.000Z',
      placeholder: true,
      stanza: 47,
      subtitleCitation: 'Bellows 1923',
      subtitleText: 'wandered alone',
      media: {
        hls: 'videos/the-road-alone/master.m3u8',
        thumbnail: 'videos/the-road-alone/thumb.jpg',
        subtitles: 'videos/the-road-alone/subtitles.vtt',
      },
    },
  ],
}

describe('catalog repository', () => {
  const catalog = createCatalog(file, '/odin/media')

  it('lists videos and resolves media against the base', () => {
    const videos = catalog.list()
    expect(videos.map((video) => video.id)).toEqual(['at-the-gate', 'the-road-alone'])
    expect(videos[0].hlsUrl).toBe('/odin/media/videos/at-the-gate/master.m3u8')
    expect(videos[0].channel.handle).toBe('@skald')
  })

  it('searches title, verse and channel, and suggests the other videos', () => {
    expect(catalog.search('gates').map((video) => video.id)).toEqual(['at-the-gate'])
    expect(catalog.search('bellows stanza').map((video) => video.id)).toEqual(['at-the-gate', 'the-road-alone'])
    expect(catalog.search('no-such-tape')).toEqual([])
    expect(catalog.related('at-the-gate').map((video) => video.id)).toEqual(['the-road-alone'])
    expect(catalog.getById('missing')).toBeUndefined()
  })

  it('refuses catalog paths that are already absolute', () => {
    const broken: CatalogFile = {
      ...file,
      videos: [{ ...file.videos[0], media: { ...file.videos[0].media, hls: 'https://cdn.example/master.m3u8' } }],
    }
    expect(() => createCatalog(broken, '/odin/media')).toThrow(/relative/)
  })
})
