import { resolveMediaUrl } from '../media-url'
import type { CatalogFile, Video, VideoRecord } from './types'

export interface Catalog {
  list(): Video[]
  getById(id: string): Video | undefined
  search(query: string): Video[]
  related(id: string, limit?: number): Video[]
}

function assertRelative(path: string, label: string): void {
  if (!path || path.startsWith('/') || path.split('/').includes('..') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new Error(`Catalog path "${label}" must stay relative to the media base`)
  }
}

function toVideo(record: VideoRecord, channels: Map<string, Video['channel']>, mediaBase: string): Video {
  const channel = channels.get(record.channelId)
  if (!channel) throw new Error(`Video "${record.id}" refers to unknown channel "${record.channelId}"`)
  assertRelative(record.media.hls, `${record.id} hls`)
  assertRelative(record.media.thumbnail, `${record.id} thumbnail`)
  assertRelative(record.media.subtitles, `${record.id} subtitles`)
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    durationSec: record.durationSec,
    publishedAt: record.publishedAt,
    placeholder: record.placeholder,
    stanza: record.stanza,
    subtitleCitation: record.subtitleCitation,
    subtitleText: record.subtitleText,
    channel,
    hlsUrl: resolveMediaUrl(record.media.hls, mediaBase),
    thumbnailUrl: resolveMediaUrl(record.media.thumbnail, mediaBase),
    subtitlesUrl: resolveMediaUrl(record.media.subtitles, mediaBase),
  }
}

export function createCatalog(file: CatalogFile, mediaBase: string): Catalog {
  if (file.version !== 1) throw new Error(`Unsupported catalog version: ${String(file.version)}`)
  const channels = new Map(file.channels.map((channel) => [channel.id, channel]))
  const videos = file.videos.map((record) => toVideo(record, channels, mediaBase))

  const list = () => videos.slice()

  const haystack = (video: Video) =>
    [
      video.title,
      video.description,
      video.channel.name,
      video.channel.handle,
      video.subtitleText,
      video.subtitleCitation,
      video.placeholder ? 'placeholder' : '',
      video.stanza == null ? '' : `stanza ${video.stanza} hávamál havamal`,
    ]
      .join('\n')
      .toLowerCase()

  return {
    list,
    getById(id) {
      return videos.find((video) => video.id === id)
    },
    search(query) {
      const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
      if (terms.length === 0) return list()
      return videos.filter((video) => {
        const text = haystack(video)
        return terms.every((term) => text.includes(term))
      })
    },
    related(id, limit = 12) {
      return videos.filter((video) => video.id !== id).slice(0, limit)
    },
  }
}
