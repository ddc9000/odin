export interface ChannelRecord {
  id: string
  name: string
  handle: string
}

export interface VideoRecord {
  id: string
  title: string
  description: string
  channelId: string
  durationSec: number
  publishedAt: string
  placeholder: boolean
  /** Hávamál stanza number in the Bellows edition, when this video carries one. */
  stanza: number | null
  subtitleCitation: string
  /** Cue text, kept on the record so search does not have to fetch every VTT. */
  subtitleText: string
  media: {
    hls: string
    thumbnail: string
    subtitles: string
  }
}

export interface CatalogFile {
  version: 1
  channels: ChannelRecord[]
  videos: VideoRecord[]
}

export interface Video {
  id: string
  title: string
  description: string
  durationSec: number
  publishedAt: string
  placeholder: boolean
  stanza: number | null
  subtitleCitation: string
  subtitleText: string
  channel: ChannelRecord
  hlsUrl: string
  thumbnailUrl: string
  subtitlesUrl: string
}
