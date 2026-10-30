import { assertSourceDuration } from './limits.ts'

export interface ChannelInput {
  id: string
  name: string
  handle: string
}

export interface VideoInput {
  id: string
  title: string
  description: string
  channelId: string
  durationSec: number
  publishedAt: string
  placeholder: boolean
  stanza: number | null
  subtitleCitation: string
  subtitleText: string
  media: {
    hls: string
    thumbnail: string
    subtitles: string
  }
}

export interface CatalogData {
  version: 1
  channels: ChannelInput[]
  videos: VideoInput[]
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HANDLE = /^@[a-z0-9]+(?:-[a-z0-9]+)*$/

export function emptyCatalog(): CatalogData {
  return { version: 1, channels: [], videos: [] }
}

function assertId(value: string, label: string): void {
  if (!ID.test(value)) throw new Error(`${label} must be a lowercase slug`)
}

function assertMediaPath(value: string, label: string): void {
  if (!value || value.startsWith('/') || value.split('/').includes('..') || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    throw new Error(`${label} must be a relative media path`)
  }
}

export function upsertEntry(
  catalog: CatalogData,
  entry: { channel: ChannelInput; video: VideoInput },
): CatalogData {
  if (catalog.version !== 1) throw new Error('Unsupported catalog version')
  const channel = entry.channel
  const video = entry.video
  assertId(channel.id, 'Channel id')
  assertId(video.id, 'Video id')
  if (!channel.name.trim()) throw new Error('Channel name is required')
  if (!HANDLE.test(channel.handle)) throw new Error('Channel handle must look like @name')
  if (!video.title.trim()) throw new Error('Title is required')
  if (video.channelId !== channel.id) throw new Error('Video channelId does not match the channel')
  assertSourceDuration(video.durationSec)
  if (Number.isNaN(Date.parse(video.publishedAt))) throw new Error('publishedAt must be an ISO date')
  if (video.stanza != null && (!Number.isInteger(video.stanza) || video.stanza <= 0)) {
    throw new Error('stanza must be a positive integer or null')
  }
  assertMediaPath(video.media.hls, 'HLS path')
  assertMediaPath(video.media.thumbnail, 'Thumbnail path')
  assertMediaPath(video.media.subtitles, 'Subtitle path')
  if (!video.media.hls.endsWith('.m3u8')) throw new Error('HLS path must end in .m3u8')
  if (!video.media.subtitles.endsWith('.vtt')) throw new Error('Subtitle path must end in .vtt')

  const channels = catalog.channels.filter((item) => item.id !== channel.id)
  channels.push({ id: channel.id, name: channel.name.trim(), handle: channel.handle })

  const videos = catalog.videos.filter((item) => item.id !== video.id)
  videos.push({
    ...video,
    title: video.title.trim(),
    description: video.description.trim(),
    subtitleCitation: video.subtitleCitation.trim(),
    subtitleText: video.subtitleText.replace(/\s+$/, ''),
  })

  return { version: 1, channels, videos }
}
