import { execFileSync } from 'node:child_process'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { oversizedFiles } from '../src/pipeline/limits.ts'
import { avc1Codec, renderMasterPlaylist, renderSubtitlePlaylist, type VariantInfo } from '../src/pipeline/playlists.ts'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

const dir = arg('--dir')
const duration = Number(arg('--duration'))
if (!dir || !Number.isFinite(duration) || duration <= 0) {
  console.error('Usage: write-master.ts --dir public/media/videos/<id> --duration <seconds>')
  process.exit(1)
}

const names = ['360p', '720p', '1080p']

function firstSegment(variantDir: string): string {
  const segments = readdirSync(variantDir)
    .filter((name) => name.endsWith('.ts'))
    .sort()
  if (segments.length === 0) throw new Error(`No MPEG-TS segments in ${variantDir}`)
  return path.join(variantDir, segments[0])
}

function bandwidthOf(variantDir: string): number {
  const bytes = readdirSync(variantDir)
    .filter((name) => name.endsWith('.ts'))
    .reduce((sum, name) => sum + statSync(path.join(variantDir, name)).size, 0)
  return Math.ceil((bytes * 8) / duration)
}

function probe(file: string): { width: number; height: number; profile: string; level: number; audio: string } {
  const stdout = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,profile,level', '-of', 'json', file],
    { encoding: 'utf8' },
  )
  const streams = (JSON.parse(stdout) as { streams?: Array<Record<string, unknown>> }).streams ?? []
  const video = streams.find((stream) => stream.codec_type === 'video')
  const audio = streams.find((stream) => stream.codec_type === 'audio')
  if (!video) throw new Error(`No video stream in ${file}`)
  return {
    width: Number(video.width),
    height: Number(video.height),
    profile: String(video.profile ?? 'Main'),
    level: Number(video.level ?? 40),
    audio: String(audio?.codec_name ?? ''),
  }
}

const variants: VariantInfo[] = names.map((name) => {
  const variantDir = path.join(dir, name)
  const info = probe(firstSegment(variantDir))
  const audio = info.audio === 'aac' ? 'mp4a.40.2' : ''
  const codecs = audio ? `${avc1Codec(info.profile, info.level)},${audio}` : avc1Codec(info.profile, info.level)
  return {
    name,
    width: info.width,
    height: info.height,
    bandwidth: bandwidthOf(variantDir),
    codecs,
    playlist: `${name}/index.m3u8`,
  }
})

writeFileSync(path.join(dir, 'subtitles.m3u8'), renderSubtitlePlaylist(duration))
writeFileSync(path.join(dir, 'master.m3u8'), renderMasterPlaylist(variants))

function walk(folder: string): { path: string; bytes: number }[] {
  const found: { path: string; bytes: number }[] = []
  for (const name of readdirSync(folder)) {
    const full = path.join(folder, name)
    const info = statSync(full)
    if (info.isDirectory()) found.push(...walk(full))
    else found.push({ path: full, bytes: info.size })
  }
  return found
}

const tooBig = oversizedFiles(walk(dir))
if (tooBig.length > 0) {
  for (const file of tooBig) console.error(`${file.path} is ${file.bytes} bytes`)
  throw new Error('A media file reached 100 MB. Lower the bitrate or shorten the video.')
}

console.log(
  variants
    .map((variant) => `${variant.name} ${variant.width}x${variant.height} ${Math.round(variant.bandwidth / 1000)} kbps`)
    .join(', '),
)
