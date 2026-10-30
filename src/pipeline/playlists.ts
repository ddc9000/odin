export interface VariantInfo {
  name: string
  width: number
  height: number
  bandwidth: number
  codecs?: string
  playlist: string
}

function extinf(durationSec: number): string {
  return durationSec.toFixed(3)
}

export function renderSubtitlePlaylist(durationSec: number, filename = 'subtitles.vtt'): string {
  const target = Math.max(1, Math.ceil(durationSec))
  return [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${target}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXTINF:${extinf(durationSec)},`,
    filename,
    '#EXT-X-ENDLIST',
    '',
  ].join('\n')
}

/**
 * Master playlist with a WebVTT subtitle group.
 * DEFAULT and AUTOSELECT are NO: the player draws the cue itself so Safari
 * does not paint a second copy on top of that overlay.
 */
export function renderMasterPlaylist(variants: VariantInfo[], subtitlesUri = 'subtitles.m3u8'): string {
  if (variants.length === 0) throw new Error('Need at least one rendition')
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-INDEPENDENT-SEGMENTS',
    `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",DEFAULT=NO,AUTOSELECT=NO,FORCED=NO,LANGUAGE="en",URI="${subtitlesUri}"`,
    '',
  ]
  for (const variant of variants) {
    const bandwidth = Math.max(1, Math.round(variant.bandwidth))
    const codecs = variant.codecs ? `,CODECS="${variant.codecs}"` : ''
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${variant.width}x${variant.height}${codecs},SUBTITLES="subs"`,
    )
    lines.push(variant.playlist)
  }
  lines.push('')
  return lines.join('\n')
}

export function avc1Codec(profile: string, level: number): string {
  const name = profile.toLowerCase()
  const id = name.includes('high') ? '64' : name.includes('baseline') ? '42' : '4d'
  const lvl = Number(level).toString(16).padStart(2, '0')
  return `avc1.${id}40${lvl}`
}
