import { readFileSync, writeFileSync } from 'node:fs'
import { emptyCatalog, upsertEntry, type CatalogData, type VideoInput } from '../src/pipeline/catalog.ts'
import { subtitleTextFromVtt } from '../src/pipeline/vtt-file.ts'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

const catalogPath = arg('--catalog')
if (!catalogPath) {
  console.error('Missing --catalog')
  process.exit(1)
}

if (process.argv.includes('--init')) {
  writeFileSync(catalogPath, `${JSON.stringify(emptyCatalog(), null, 2)}\n`)
  process.exit(0)
}

function required(name: string): string {
  const value = process.env[name]
  if (!value || !value.trim()) {
    console.error(`Missing ${name}`)
    process.exit(1)
  }
  return value
}

const id = required('ODIN_ID')
const stanzaRaw = process.env.ODIN_STANZA?.trim() ?? ''
const vtt = readFileSync(required('ODIN_VTT_PATH'), 'utf8')
const video: VideoInput = {
  id,
  title: required('ODIN_TITLE'),
  description: required('ODIN_DESCRIPTION'),
  channelId: required('ODIN_CHANNEL_ID'),
  durationSec: Number(required('ODIN_DURATION')),
  publishedAt: required('ODIN_PUBLISHED_AT'),
  placeholder: process.env.ODIN_PLACEHOLDER === '1',
  stanza: stanzaRaw === '' ? null : Number(stanzaRaw),
  subtitleCitation: process.env.ODIN_CITATION?.trim() ?? '',
  subtitleText: subtitleTextFromVtt(vtt),
  media: {
    hls: `videos/${id}/master.m3u8`,
    thumbnail: `videos/${id}/thumb.jpg`,
    subtitles: `videos/${id}/subtitles.vtt`,
  },
}

const current = JSON.parse(readFileSync(catalogPath, 'utf8')) as CatalogData
const next = upsertEntry(current, {
  channel: {
    id: required('ODIN_CHANNEL_ID'),
    name: required('ODIN_CHANNEL_NAME'),
    handle: required('ODIN_CHANNEL_HANDLE'),
  },
  video,
})
writeFileSync(catalogPath, `${JSON.stringify(next, null, 2)}\n`)
console.log(`Catalog updated: ${id}`)
